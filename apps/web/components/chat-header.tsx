'use client';

import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useWindowSize } from 'usehooks-ts';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { Button } from '@/components/ui/button';
import { useSidebar } from './ui/sidebar';
import { VisibilitySelector, type VisibilityType } from './visibility-selector';

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

  return (
    <header className='sticky top-2 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2'>
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
      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className='order-1 md:order-2'
          selectedVisibilityType={selectedVisibilityType}
        />
      )}
      {/* <div className='order-3 flex items-center gap-2 px-4 py-2 mr-1 rounded-3xl duration-300 cursor-pointer text-sm font-semibold hover:text-black hover:bg-zinc-300 md:ml-auto md:flex md:h-fit text-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800'>
        <GhostIcon size={18} />
        Private
      </div> */}
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
