import type { UseChatHelpers } from '@ai-sdk/react';
import { ArrowDownIcon } from 'lucide-react';
import { useMessages } from '@/hooks/use-messages';
import type { Vote } from '@/lib/db/schema';
import type { ChatMessage } from '@/lib/types';
import { useDataStream } from './data-stream-provider';
import { useCurrentMessage } from '@/hooks/use-current-message';
import { ConversationBlock } from './conversation-block';
import { Greeting } from './greeting';

import { ThinkingMessage } from './message';
import { useEffect, useMemo } from 'react';

function getQuestionText(message: ChatMessage): string {
  const textPart = message.parts?.find(
    (part) => part.type === 'text' && part.text?.trim()
  );
  return textPart && 'text' in textPart ? textPart.text : '';
}

type MessagesProps = {
  addToolApprovalResponse: UseChatHelpers<ChatMessage>['addToolApprovalResponse'];
  chatId: string;
  status: UseChatHelpers<ChatMessage>['status'];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
};

type ConversationBlockProps = { question: ChatMessage; answers: ChatMessage[] };

function PureMessages({
  addToolApprovalResponse,
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  selectedModelId: _selectedModelId,
}: MessagesProps) {
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useDataStream();

  // const conversationBlocks = useMemo(() => {
  //   if (status === 'ready') {
  //     return messages.reduce(
  //       (
  //         acc: Array<{ question: ChatMessage; answers: ChatMessage[] }>,
  //         message
  //       ) => {
  //         if (message.role === 'user') {
  //           acc.push({ question: message, answers: [] });
  //         } else if (message.role === 'assistant' && acc.length > 0) {
  //           acc[acc.length - 1].answers.push(message);
  //         }
  //         return acc;
  //       },
  //       []
  //     );
  //   }
  //   return [];
  // }, [messages, status]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const blocks = container.querySelectorAll('[data-question-id]');
      let current: Element | null = null;

      for (const block of blocks) {
        if (
          block.getBoundingClientRect().top <=
          container.getBoundingClientRect().top + 60
        ) {
          current = block;
        }
      }

      if (current) {
        setCurrentMessage({
          id: current.getAttribute('data-question-id')!,
          text: current.getAttribute('data-question-text')!,
        });
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messagesContainerRef]);

  const conversationBlocks = useMemo(() => {
    // add non empty conversation blocks while streaming
    if (status === 'streaming' && messages.length > 0) {
      return messages.reduce<ConversationBlockProps[]>((acc, message) => {
        if (message.role === 'user') {
          acc.push({ question: message, answers: [] });
        } else if (message.role === 'assistant' && acc.length > 0) {
          if (
            message.parts?.some(
              (part) => part.type === 'text' && part.text?.trim()
            )
          ) {
            acc[acc.length - 1].answers.push(message);
          }
        }
        return acc;
      }, []);
    }

    return messages.reduce<ConversationBlockProps[]>((acc, message) => {
      if (message.role === 'user') {
        acc.push({ question: message, answers: [] });
      } else if (message.role === 'assistant' && acc.length > 0) {
        acc[acc.length - 1].answers.push(message);
      }
      return acc;
    }, []);
  }, [messages, status]);

  const { setCurrentMessage } = useCurrentMessage();

  useEffect(() => {
    if (conversationBlocks.length > 0) {
      const firstBlock = conversationBlocks.at(0);
      if (firstBlock) {
        const questionText = getQuestionText(firstBlock.question);
        if (questionText) {
          setCurrentMessage({
            id: firstBlock.question.id,
            text: questionText,
          });
        }
      }
    } else {
      setCurrentMessage(null);
    }
  }, [conversationBlocks, setCurrentMessage]);

  return (
    <div className='relative flex-1'>
      <div
        className='absolute inset-0 touch-pan-y overflow-y-auto'
        ref={messagesContainerRef}
      >
        <div className='mx-auto flex min-w-0 max-w-4xl flex-col gap-4 px-2 py-4 md:gap-6 md:px-4'>
          {messages.length === 0 && <Greeting />}
          {(status === 'streaming' ||
            status === 'submitted' ||
            status === 'ready') &&
            conversationBlocks.map((block, index) => (
              <ConversationBlock
                key={block.question.id}
                questionMessage={block.question}
                answerMessages={block.answers}
                isLast={index === conversationBlocks.length - 1}
                addToolApprovalResponse={addToolApprovalResponse}
                chatId={chatId}
                status={status}
                votes={votes}
                regenerate={regenerate}
                isReadonly={isReadonly}
                hasSentMessage={hasSentMessage}
                setMessages={setMessages}
              />
            ))}
          {/* {messages.map((message, index) => (
            <PreviewMessage
              addToolApprovalResponse={addToolApprovalResponse}
              chatId={chatId}
              isLoading={
                status === 'streaming' && messages.length - 1 === index
              }
              isReadonly={isReadonly}
              key={message.id}
              message={message}
              regenerate={regenerate}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              setMessages={setMessages}
              vote={
                votes
                  ? votes.find((vote) => vote.messageId === message.id)
                  : undefined
              }
            />
          ))} */}

          {status === 'submitted' &&
            !messages.some((msg) =>
              msg.parts?.some(
                (part) => 'state' in part && part.state === 'approval-responded'
              )
            ) && <ThinkingMessage />}
          <div
            className='min-h-[24px] min-w-[24px] shrink-0'
            ref={messagesEndRef}
          />
        </div>
      </div>

      <button
        type='button'
        aria-label='Scroll to bottom'
        className={`absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-background p-2 shadow-lg transition-all hover:bg-muted ${
          isAtBottom
            ? 'pointer-events-none scale-0 opacity-0'
            : 'pointer-events-auto scale-100 opacity-100'
        }`}
        onClick={() => scrollToBottom('smooth')}
      >
        <ArrowDownIcon size={16} />
      </button>
    </div>
  );
}

export const Messages = PureMessages;
