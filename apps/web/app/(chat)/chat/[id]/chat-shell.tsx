'use client';

import useSWR from 'swr';
import { Navigator } from '@/components/thread/navigator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

const navigatorFetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
};

export default function ChatShell({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { data } = useSWR(
    `http://localhost:8080/navigator/by-chat/${id}`,
    navigatorFetcher,
  );

  const showNavigator = !!data?.navigator;

  return (
    <ResizablePanelGroup direction='horizontal'>
      <ResizablePanel defaultSize={showNavigator ? 72 : 100}>
        {children}
      </ResizablePanel>
      {showNavigator && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            className='mr-2'
            defaultSize={28}
            maxSize={40}
            minSize={12}
          >
            <Navigator id={id} />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
