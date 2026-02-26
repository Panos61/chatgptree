import { createContext, useContext } from 'react';

export const ThreadReplyContext = createContext<{
  threadReply: { id: string; text: string } | null;
  setThreadReply: (threadReply: { id: string; text: string } | null) => void;
} | null>(null);

export const useThreadReply = () => {
  const context = useContext(ThreadReplyContext);
  if (!context) {
    throw new Error('useThreadReply must be used within a ThreadReplyProvider');
  }

  return context;
};
