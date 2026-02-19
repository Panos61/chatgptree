// app/(chat)/chat/[id]/layout.tsx
import ChatShell from './chat-shell';
import { Suspense } from 'react';

export default async function ChatIdLayout({
  children,
  params,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className='flex h-dvh' />}>
      <ChatShell id={id}>{children}</ChatShell>
    </Suspense>
  );
}
