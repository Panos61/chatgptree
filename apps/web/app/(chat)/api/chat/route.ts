import { geolocation } from '@vercel/functions';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
} from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';
import { auth, type UserType } from '@/app/(auth)/auth';
import { entitlementsByUserType } from '@/lib/ai/entitlements';
import { type RequestHints, systemPrompt } from '@/lib/ai/prompts';
import { getLanguageModel } from '@/lib/ai/providers';
import { createDocument } from '@/lib/ai/tools/create-document';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { isProductionEnvironment } from '@/lib/constants';
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatTitleById,
  updateMessage,
} from '@/lib/db/queries';
import type { DBMessage } from '@/lib/db/schema';
import { ChatSDKError } from '@/lib/errors';
import type { ChatMessage } from '@/lib/types';
import { convertToUIMessages, generateUUID } from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { type PostRequestBody, postRequestBodySchema } from './schema';

export const maxDuration = 60;

function getStreamContext() {
  try {
    return createResumableStreamContext({ waitUntil: after });
  } catch (_) {
    return null;
  }
}

export { getStreamContext };

async function createNavigator(
  chatId: string,
  chatTitle: string,
  userMessageId: string,
  assistantMessageId: string,
  assistantMessage: string,
) {
  if (!process.env.THREADS_SERVICE_URL) {
    console.error('THREADS_SERVICE_URL is not set');
    return;
  }

  try {
    await fetch(`${process.env.THREADS_SERVICE_URL}/navigator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: chatId,
        chatTitle: chatTitle,
        userMessageId: userMessageId,
        assistantMessageId: assistantMessageId,
        assistantMessage: assistantMessage,
      }),
    });
  } catch (error) {
    console.error('Error applying navigator:', error);
    return;
  }
}

async function addNavEntry(
  navigatorId: string,
  chatId: string,
  userMessageId: string,
  assistantMessageId: string,
  assistantMessage: string,
) {
  if (!process.env.THREADS_SERVICE_URL) {
    console.error('THREADS_SERVICE_URL is not set');
    return;
  }

  try {
    await fetch(
      `${process.env.THREADS_SERVICE_URL}/navigator/id/${navigatorId}/entries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: navigatorId,
          navigatorId: navigatorId,
          chatId: chatId,
          assistantMessageId: assistantMessageId,
          userMessageId: userMessageId,
          assistantMessage: assistantMessage,
        }),
      },
    ).catch((err) => {
      console.error('Error adding nav entry:', err);
      return;
    });
  } catch (error) {
    console.error('Error adding nav entry:', error);
    return;
  }
}

async function appendToThread(userMessage: string, assistantMessage: string) {
  if (!process.env.THREADS_SERVICE_URL) {
    console.error('THREADS_SERVICE_URL is not set');
    return;
  }

  try {
    await fetch(`${process.env.THREADS_SERVICE_URL}/threads/append`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage: userMessage,
        assistantMessage: assistantMessage,
      }),
    });
  } catch (error) {
    console.error('Error forwarding response to thread:', error);
    return;
  }
}

export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
  } catch (_) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  try {
    const { id, message, messages, selectedChatModel, selectedVisibilityType } =
      requestBody;

    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const userType: UserType = session.user.type;

    const messageCount = await getMessageCountByUserId({
      id: session.user.id,
      differenceInHours: 24,
    });

    // if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
    //   return new ChatSDKError('rate_limit:chat').toResponse();
    // }

    const isToolApprovalFlow = Boolean(messages);

    const chat = await getChatById({ id });
    let messagesFromDb: DBMessage[] = [];
    let titlePromise: Promise<string> | null = null;

    if (chat) {
      if (chat.userId !== session.user.id) {
        return new ChatSDKError('forbidden:chat').toResponse();
      }
      if (!isToolApprovalFlow) {
        messagesFromDb = await getMessagesByChatId({ id });
      }
    } else if (message?.role === 'user') {
      await saveChat({
        id,
        userId: session.user.id,
        title: 'New chat',
        visibility: selectedVisibilityType,
      });
      titlePromise = generateTitleFromUserMessage({ message });
    }

    const uiMessages = isToolApprovalFlow
      ? (messages as ChatMessage[])
      : [...convertToUIMessages(messagesFromDb), message as ChatMessage];

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    if (message?.role === 'user') {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: 'user',
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    const isReasoningModel =
      selectedChatModel.includes('reasoning') ||
      selectedChatModel.includes('thinking');

    const modelMessages = await convertToModelMessages(uiMessages);

    const stream = createUIMessageStream({
      originalMessages: isToolApprovalFlow ? uiMessages : undefined,
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: modelMessages,
          stopWhen: stepCountIs(5),
          experimental_activeTools: isReasoningModel
            ? []
            : [
                'getWeather',
                'createDocument',
                'updateDocument',
                'requestSuggestions',
              ],
          providerOptions: isReasoningModel
            ? {
                anthropic: {
                  thinking: { type: 'enabled', budgetTokens: 10_000 },
                },
              }
            : undefined,
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({ session, dataStream }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: 'stream-text',
          },
        });

        dataStream.merge(result.toUIMessageStream({ sendReasoning: true }));

        if (titlePromise) {
          const title = await titlePromise;
          dataStream.write({ type: 'data-chat-title', data: title });
          updateChatTitleById({ chatId: id, title });
        }
      },
      generateId: generateUUID,
      onFinish: async ({ messages: finishedMessages }) => {
        if (!chat && finishedMessages.length > 0) {
          const assistantMessage = finishedMessages[0].parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('');
          const title = titlePromise ? await titlePromise : 'New chat';

          await createNavigator(
            id,
            title,
            message?.id ?? '',
            finishedMessages[0].id,
            assistantMessage,
          );
        }
        if (isToolApprovalFlow) {
          for (const finishedMsg of finishedMessages) {
            const existingMsg = uiMessages.find((m) => m.id === finishedMsg.id);
            if (existingMsg) {
              await updateMessage({
                id: finishedMsg.id,
                parts: finishedMsg.parts,
              });
            } else {
              await saveMessages({
                messages: [
                  {
                    id: finishedMsg.id,
                    role: finishedMsg.role,
                    parts: finishedMsg.parts,
                    createdAt: new Date(),
                    attachments: [],
                    chatId: id,
                  },
                ],
              });
            }
          }
        } else if (finishedMessages.length > 0) {
          const responseText = finishedMessages.map((currentMessage) =>
            currentMessage.parts
              .map((part) => (part.type === 'text' ? part.text : ''))
              .join(''),
          );

          const userMessage =
            message?.parts
              .map((part) => (part.type === 'text' ? part.text : ''))
              .join('') ?? '';
          const assistantMessage = responseText.join('') ?? '';

          await addNavEntry(
            id,
            id,
            message?.id ?? '',
            finishedMessages[0].id,
            assistantMessage,
          );
          await appendToThread(userMessage, assistantMessage);
          await saveMessages({
            messages: finishedMessages.map((currentMessage) => ({
              id: currentMessage.id,
              role: currentMessage.role,
              parts: currentMessage.parts,
              createdAt: new Date(),
              attachments: [],
              chatId: id,
            })),
          });
        }
      },
      onError: () => 'Oops, an error occurred!',
    });

    return createUIMessageStreamResponse({
      stream,
      async consumeSseStream({ stream: sseStream }) {
        if (!process.env.REDIS_URL) {
          return;
        }
        try {
          const streamContext = getStreamContext();
          if (streamContext) {
            const streamId = generateId();
            await createStreamId({ streamId, chatId: id });
            await streamContext.createNewResumableStream(
              streamId,
              () => sseStream,
            );
          }
        } catch (_) {
          // ignore redis errors
        }
      },
    });
  } catch (error) {
    const vercelId = request.headers.get('x-vercel-id');

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (
      error instanceof Error &&
      error.message?.includes(
        'AI Gateway requires a valid credit card on file to service requests',
      )
    ) {
      return new ChatSDKError('bad_request:activate_gateway').toResponse();
    }

    console.error('Unhandled error in chat API:', error, { vercelId });
    return new ChatSDKError('offline:chat').toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new ChatSDKError('bad_request:api').toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:chat').toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError('forbidden:chat').toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
