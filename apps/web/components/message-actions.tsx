import { CornerDownRightIcon } from 'lucide-react';
import { memo } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';
import { useThreadReply } from '@/hooks/use-thread-reply';
import type { ChatMessage } from '@/lib/types';
import { Action, Actions } from './elements/actions';
import { CopyIcon, PencilEditIcon } from './icons';

export function PureMessageActions({
  message,
  isLoading,
  setMode,
}: {
  message: ChatMessage;
  isLoading: boolean;
  setMode?: (mode: 'view' | 'edit') => void;
}) {
  const [_, copyToClipboard] = useCopyToClipboard();
  const { threadReply, setThreadReply } = useThreadReply();

  if (isLoading) {
    return null;
  }

  const textFromParts = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

  const handleCopy = async () => {
    if (!textFromParts) {
      toast.error("There's no text to copy!");
      return;
    }

    await copyToClipboard(textFromParts);
    toast.success('Copied to clipboard!');
  };

  if (message.role === 'user') {
    return (
      <Actions className='mr-1 justify-end'>
        <div className='relative'>
          {setMode && (
            <Action
              className='absolute top-0 -left-9 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/message:opacity-100'
              data-testid='message-edit-button'
              onClick={() => setMode('edit')}
              tooltip='Edit'
            >
              <PencilEditIcon />
            </Action>
          )}
          <Action onClick={handleCopy} tooltip='Copy'>
            <CopyIcon />
          </Action>
        </div>
      </Actions>
    );
  }
  console.log('threadReply', threadReply?.text);

  return (
    <Actions className='ml-1'>
      <Action onClick={handleCopy} tooltip='Copy'>
        <CopyIcon />
      </Action>
      <Action
        onClick={() => {
          setThreadReply({
            id: message.id,
            text: message.parts
              .map((part) => (part.type === 'text' ? part.text : ''))
              .join(''),
          });
        }}
        tooltip='Reply in thread'
      >
        <CornerDownRightIcon />
      </Action>
    </Actions>
  );
}

export const MessageActions = memo(
  PureMessageActions,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }

    return true;
  }
);
