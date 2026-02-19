import { createContext, useContext } from 'react';

export const CurrentMessageContext = createContext<{
  currentMessage: { id: string; text: string } | null;
  setCurrentMessage: (message: { id: string; text: string } | null) => void;
} | null>(null);

export const useCurrentMessage = () => {
  const context = useContext(CurrentMessageContext);
  if (!context) {
    throw new Error(
      'useCurrentMessage must be used within a CurrentMessageProvider'
    );
  }

  return context;
};
