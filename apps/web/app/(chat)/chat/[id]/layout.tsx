// app/(chat)/chat/[id]/layout.tsx
import { Navigator } from '@/components/thread/navigator';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export default async function ChatIdLayout({
  children,
  params,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;

  return (
    <ResizablePanelGroup direction='horizontal'>
      <ResizablePanel defaultSize={72}>{children}</ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel
        className='mr-2'
        defaultSize={28}
        maxSize={40}
        minSize={12}
      >
        <Navigator id={id} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
