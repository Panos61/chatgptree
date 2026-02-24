import type { UseChatHelpers } from '@ai-sdk/react';
import type { Vote } from '@/lib/db/schema';
import type { ChatMessage } from '@/lib/types';
import { PreviewMessage } from './message';
import { Separator } from './ui/separator';

function getQuestionText(message: ChatMessage): string {
  const textPart = message.parts?.find(
    (part) => part.type === 'text' && part.text?.trim()
  );
  return textPart && 'text' in textPart ? textPart.text : '';
}

export function PureConversationBlock({
  questionMessage,
  answerMessages,
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  regenerate,
  isReadonly,
  hasSentMessage,
  setMessages,
  isLast = false,
}: {
  questionMessage: ChatMessage;
  answerMessages: ChatMessage[];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>['addToolApprovalResponse'];
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Vote[] | undefined;
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  hasSentMessage: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  isLast?: boolean;
}) {
  const questionText = getQuestionText(questionMessage);

  return (
    <div className='space-y-4'>
      <div
        className='relative pb-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 rounded-xl duration-300'
        data-question-id={questionMessage.id}
        data-question-text={questionText}
      >
        {/* {questionText && (
        <div className='sticky top-14 z-10 -mx-2 -mt-4 mb-2 border-b border-border/50 bg-background/95 px-4 py-2 backdrop-blur supports-backdrop-filter:bg-background/80 md:-mx-4 md:px-6'>
          <span className='line-clamp-1 text-sm font-medium text-muted-foreground'>
            {questionText}
          </span>
        </div>
      )} */}
        {questionMessage && (
          <PreviewMessage
            addToolApprovalResponse={addToolApprovalResponse}
            chatId={chatId}
            isLoading={false}
            isReadonly={isReadonly}
            key={questionMessage.id}
            message={questionMessage}
            regenerate={regenerate}
            requiresScrollPadding={false}
            setMessages={setMessages}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === questionMessage.id)
                : undefined
            }
          />
        )}
        {answerMessages.map((message, index) => (
          <PreviewMessage
            addToolApprovalResponse={addToolApprovalResponse}
            chatId={chatId}
            isLoading={
              status === 'streaming' && answerMessages.length - 1 === index
            }
            isReadonly={isReadonly}
            key={message.id}
            message={message}
            regenerate={regenerate}
            requiresScrollPadding={
              hasSentMessage && index === answerMessages.length - 1
            }
            setMessages={setMessages}
            vote={
              votes
                ? votes.find((vote) => vote.messageId === message.id)
                : undefined
            }
          />
        ))}
      </div>
      {!isLast && <Separator className='bg-zinc-200 dark:bg-zinc-800/60' />}
    </div>
  );
}

export const ConversationBlock = PureConversationBlock;
