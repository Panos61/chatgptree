import { CornerDownRightIcon } from 'lucide-react';
import { memo } from 'react';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from './ui/context-menu';

/** Mockup type for threaded replies - supports arbitrary nesting */
type ThreadReplyMock = {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  replies?: ThreadReplyMock[];
};

export function PureThreadReplyItem({
  reply,
  depth = 0,
  setThreadReply,
}: {
  reply: ThreadReplyMock;
  depth?: number;
  setThreadReply: (r: { id: string; text: string } | null) => void;
}) {
  const hasReplies = reply.replies && reply.replies.length > 0;

  return (
    <div className={cn('relative', depth > 0 && 'mt-2')}>
      <div
        className={cn(
          'group relative flex items-start gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-border/50 hover:bg-muted/30',
          depth > 0 && 'ml-6 border-l pl-4',
          reply.role === 'user' ? 'border-border/50' : 'border-transparent'
        )}
      >
        <CornerDownRightIcon
          className='mt-0.5 shrink-0 text-muted-foreground'
          size={14}
        />
        <div className='min-w-0 flex-1'>
          {reply.role === 'user' ? (
            <p className='line-clamp-2 text-sm text-foreground'>{reply.text}</p>
          ) : (
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <p className='line-clamp-2 text-sm text-foreground'>
                  {reply.text}
                </p>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem
                  className='flex items-center gap-2'
                  onClick={() =>
                    setThreadReply({ id: reply.id, text: reply.text })
                  }
                >
                  <CornerDownRightIcon size={12} />
                  Reply in thread
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )}
          <span className='text-xs text-muted-foreground'>
            {reply.role === 'user' ? 'You' : 'Assistant'}
          </span>
        </div>
        <button
          aria-label='Reply in thread'
          className='shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100 hover:scale-110 duration-300'
          onClick={() => setThreadReply({ id: reply.id, text: reply.text })}
          type='button'
        >
          {reply.role === 'assistant' && <CornerDownRightIcon size={12} />}
        </button>
      </div>
      {hasReplies && (
        <div className='mt-1'>
          {reply.replies?.map((child) => (
            <PureThreadReplyItem
              depth={depth + 1}
              key={child.id}
              reply={child}
              setThreadReply={setThreadReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const ThreadReplyItem = memo(PureThreadReplyItem);
