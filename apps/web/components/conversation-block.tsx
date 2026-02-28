import type { UseChatHelpers } from '@ai-sdk/react';
import { ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { useThreadReply } from '@/hooks/use-thread-reply';
import type { ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PreviewMessage } from './message';
import { ThreadReplyItem } from './thread-reply-item';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { Separator } from './ui/separator';

function getQuestionText(message: ChatMessage): string {
  const textPart = message.parts?.find(
    (part) => part.type === 'text' && part.text?.trim()
  );
  return textPart && 'text' in textPart ? textPart.text : '';
}

/** Mockup type for threaded replies - supports arbitrary nesting */
type ThreadReplyMock = {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  replies?: ThreadReplyMock[];
};

/** Mockup data: nested thread replies */
const MOCK_THREAD_REPLIES: ThreadReplyMock[] = [
  {
    id: 'thread-1',
    text: 'Can you compare this with Remix?',
    role: 'user',
    replies: [
      {
        id: 'thread-1-1',
        text: 'Sure! Here are the key differences between Next.js and Remix...',
        role: 'assistant',
        replies: [
          {
            id: 'thread-1-1-1',
            text: 'What about data loading patterns specifically?',
            role: 'user',
            replies: [
              {
                id: 'thread-1-1-1-1',
                text: 'Both use similar patterns. Next.js has getServerSideProps and Remix uses loaders. The main difference is...',
                role: 'assistant',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'thread-2',
    text: 'Could you add TypeScript examples?',
    role: 'user',
    replies: [
      {
        id: 'thread-2-1',
        text: 'Here are the TypeScript versions of the examples above...',
        role: 'assistant',
      },
    ],
  },
];

export function PureConversationBlock({
  questionMessage,
  answerMessages,
  addToolApprovalResponse,
  status,
  regenerate,
  isReadonly,
  hasSentMessage,
  setMessages,
  isLast = false,
}: {
  questionMessage: ChatMessage;
  answerMessages: ChatMessage[];
  addToolApprovalResponse: UseChatHelpers<ChatMessage>['addToolApprovalResponse'];
  status: UseChatHelpers<ChatMessage>['status'];
  regenerate: UseChatHelpers<ChatMessage>['regenerate'];
  isReadonly: boolean;
  hasSentMessage: boolean;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  isLast?: boolean;
}) {
  const { setThreadReply } = useThreadReply();
  const [isThreadRepliesOpen, setIsThreadRepliesOpen] = useState(true);
  const [isThreadRepliesVisible, setIsThreadRepliesVisible] = useState(true);

  const questionText = getQuestionText(questionMessage);

  if (!isThreadRepliesVisible) {
    return (
      <div className='space-y-4'>
        <div
          className='relative pb-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 rounded-xl duration-300'
          data-question-id={questionMessage.id}
          data-question-text={questionText}
        >
          {questionMessage && (
            <PreviewMessage
              addToolApprovalResponse={addToolApprovalResponse}
              isLoading={false}
              isReadonly={isReadonly}
              key={questionMessage.id}
              message={questionMessage}
              regenerate={regenerate}
              requiresScrollPadding={false}
              setMessages={setMessages}
            />
          )}
          {answerMessages.map((message, index) => (
            <PreviewMessage
              addToolApprovalResponse={addToolApprovalResponse}
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
            />
          ))}
        </div>
        {!isLast && <Separator className='bg-zinc-200 dark:bg-zinc-800/60' />}
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div
        className='relative pb-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 rounded-xl duration-300'
        data-question-id={questionMessage.id}
        data-question-text={questionText}
      >
        {questionMessage && (
          <PreviewMessage
            addToolApprovalResponse={addToolApprovalResponse}
            isLoading={false}
            isReadonly={isReadonly}
            key={questionMessage.id}
            message={questionMessage}
            regenerate={regenerate}
            requiresScrollPadding={false}
            setMessages={setMessages}
          />
        )}
        {answerMessages.map((message, index) => (
          <PreviewMessage
            addToolApprovalResponse={addToolApprovalResponse}
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
          />
        ))}
        <Collapsible
          className='mt-6 border-l-2 border-border/40 pl-4'
          onOpenChange={setIsThreadRepliesOpen}
          open={isThreadRepliesOpen}
        >
          <CollapsibleTrigger asChild>
            <button
              className='mt-4 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground'
              onClick={() => setIsThreadRepliesVisible(true)}
              type='button'
            >
              <ChevronDownIcon
                className={cn(
                  'size-3.5 transition-transform duration-200 ease-out',
                  !isThreadRepliesOpen && '-rotate-90'
                )}
              />
              Show thread replies
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className='overflow-hidden data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 data-[state=closed]:duration-200 data-[state=open]:duration-300'>
            <div className='mt-3 space-y-2'>
              {MOCK_THREAD_REPLIES.map((reply) => (
                <ThreadReplyItem
                  key={reply.id}
                  reply={reply}
                  setThreadReply={setThreadReply}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {!isLast && <Separator className='bg-zinc-200 dark:bg-zinc-800/60' />}
    </div>
  );
}

export const ConversationBlock = PureConversationBlock;
