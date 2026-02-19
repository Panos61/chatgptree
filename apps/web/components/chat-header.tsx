'use client';

import { MessageCircleDashedIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState, useEffect, useRef } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { useCurrentMessage } from '@/hooks/use-current-message';
import { useSidebar } from './ui/sidebar';
import type { VisibilityType } from './visibility-selector';
import classNames from 'classnames';

const gradients = [
  'linear-gradient(90deg, #6366f1 0%, #8b5cf6 40%, #06b6d4 100%)',
  'linear-gradient(90deg, #3b82f6 0%, #6366f1 40%, #ec4899 100%)',
  'linear-gradient(90deg, #10b981 0%, #3b82f6 40%, #8b5cf6 100%)',
  'linear-gradient(90deg, #f59e0b 0%, #ef4444 40%, #ec4899 100%)',
  'linear-gradient(90deg, #06b6d4 0%, #6366f1 40%, #a855f7 100%)',
];

function PureChatHeader({
  chatId: _chatId,
  selectedVisibilityType: _selectedVisibilityType,
  isReadonly: _isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { currentMessage } = useCurrentMessage();

  const prevMsgIdRef = useRef<string | undefined>(undefined);
  const gradientIndexRef = useRef(0);
  const [currentGradient, setCurrentGradient] = useState(gradients[0]);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (currentMessage?.id !== prevMsgIdRef.current) {
      prevMsgIdRef.current = currentMessage?.id;
      gradientIndexRef.current =
        (gradientIndexRef.current + 1) % gradients.length;
      setCurrentGradient(gradients[gradientIndexRef.current]);
      setAnimationKey((k) => k + 1);
    }
  }, [currentMessage?.id]);

  const [isTemporary, setIsTemporary] = useState(false);
  const temporaryCTAcls = classNames(
    'order-4 flex items-center gap-1 px-4 py-2 mr-1 rounded-3xl duration-300 cursor-pointer text-sm font-semibold hover:text-black hover:bg-zinc-300 md:ml-auto md:flex md:h-fit',
    {
      'text-violet-500 bg-zinc-300 dark:text-violet-500 dark:bg-zinc-800':
        isTemporary,
      'text-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800': !isTemporary,
    }
  );

  return (
    <header className='sticky flex items-center gap-2 bg-background px-2 py-1 md:px-2'>
      {animationKey > 0 && (
        <div className='absolute bottom-0 left-0 h-px w-full overflow-hidden'>
          <div
            key={animationKey}
            className='animate-loading-bar h-full w-[200%]'
            style={{
              background: currentGradient,
              filter: 'blur(0.5px)',
              boxShadow: '0 0 8px 2px rgba(139, 92, 246, 0.4)',
            }}
          />
        </div>
      )}
      <SidebarToggle />
      {(!open || windowWidth < 768) && (
        <Button
          className='order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2'
          onClick={() => {
            router.push('/');
            router.refresh();
          }}
          variant='ghost'
        >
          <PlusIcon />
          <span className='md:sr-only'>New Chat</span>
        </Button>
      )}
      {/* {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className='order-1 md:order-2'
          selectedVisibilityType={selectedVisibilityType}
        />
      )} */}
      {currentMessage?.text && (
        <div className='order-3 mx-auto md:px-2'>
          <span className='line-clamp-1 text-sm font-medium text-muted-foreground'>
            {currentMessage.text}
          </span>
        </div>
      )}
      <button
        type='button'
        className={temporaryCTAcls}
        onClick={() => setIsTemporary(!isTemporary)}
      >
        <MessageCircleDashedIcon size={16} />
        Temporary Chat
      </button>
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
  );
});
