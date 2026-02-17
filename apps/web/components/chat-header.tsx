'use client';

import { MessageCircleDashedIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useState } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { useCurrentMessage } from '@/hooks/use-current-message';
import { useSidebar } from './ui/sidebar';
import { VisibilitySelector, type VisibilityType } from './visibility-selector';
import classNames from 'classnames';

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();
  const { currentMessage } = useCurrentMessage();

  const [isTemporary, setIsTemporary] = useState(false);
  const temporaryCTAcls = classNames(
    'order-3 flex items-center gap-1 px-4 py-2 mr-1 rounded-3xl duration-300 cursor-pointer text-sm font-semibold hover:text-black hover:bg-zinc-300 md:ml-auto md:flex md:h-fit',
    {
      'text-violet-500 bg-zinc-300 dark:text-violet-500 dark:bg-zinc-800':
        isTemporary,
      'text-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800': !isTemporary,
    }
  );

  return (
    <header className='sticky top-2 flex items-center gap-2 mb-5 bg-background px-2 py-1.5 md:px-2'>
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
      <span className='order-3 text-center mx-auto text-sm font-bold'>
        {currentMessage?.text}
      </span>
      <div
        className={temporaryCTAcls}
        onClick={() => setIsTemporary(!isTemporary)}
      >
        <MessageCircleDashedIcon size={16} />
        Temporary
      </div>
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
