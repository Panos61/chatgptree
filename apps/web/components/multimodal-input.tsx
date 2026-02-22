'use client';

import type { UseChatHelpers } from '@ai-sdk/react';
import type { UIMessage } from 'ai';
import equal from 'fast-deep-equal';
import { CheckIcon } from 'lucide-react';
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useLocalStorage, useWindowSize } from 'usehooks-ts';
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from '@/components/ai-elements/model-selector';
import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  modelsByProvider,
} from '@/lib/ai/models';
import type { Attachment, ChatMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from './elements/prompt-input';
import { ArrowUpIcon, PaperclipIcon, StopIcon } from './icons';
import { PreviewAttachment } from './preview-attachment';
import { SuggestedActions } from './suggested-actions';
import { Button } from './ui/button';
import type { VisibilityType } from './visibility-selector';

function setCookie(name: string, value: string) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  // biome-ignore lint/suspicious/noDocumentCookie: needed for client-side cookie setting
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}`;
}

function PureMultimodalInput({
  chatId,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
}: {
  chatId: string;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>['status'];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
  sendMessage: UseChatHelpers<ChatMessage>['sendMessage'];
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const { resolvedTheme } = useTheme();

  // const adjustHeight = useCallback(() => {
  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = '44px';
  //   }
  // }, []);

  // useEffect(() => {
  //   if (textareaRef.current) {
  //     adjustHeight();
  //   }
  // }, [adjustHeight]);

  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  // const resetHeight = useCallback(() => {
  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = '44px';
  //   }
  // }, []);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    'input',
    ''
  );

  // useEffect(() => {
  //   if (textareaRef.current) {
  //     const domValue = textareaRef.current.value;
  //     // Prefer DOM value over localStorage to handle hydration
  //     const finalValue = domValue || localStorageInput || '';
  //     setInput(finalValue);
  //     adjustHeight();
  //   }
  //   // Only run once after hydration
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [adjustHeight, localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const submitForm = useCallback(() => {
    window.history.pushState({}, '', `/chat/${chatId}`);

    sendMessage({
      role: 'user',
      parts: [
        ...attachments.map((attachment) => ({
          type: 'file' as const,
          url: attachment.url,
          name: attachment.name,
          mediaType: attachment.contentType,
        })),
        {
          type: 'text',
          text: input,
        },
      ],
    });

    setAttachments([]);
    setLocalStorageInput('');
    // resetHeight();
    setInput('');

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
    // resetHeight,
  ]);

  const uploadFile = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (_error) {
      toast.error('Failed to upload file, please try again!');
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error('Error uploading files!', error);
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith('image/')
      );

      if (imageItems.length === 0) {
        return;
      }

      // Prevent default paste behavior for images
      event.preventDefault();

      setUploadQueue((prev) => [...prev, 'Pasted image']);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch (error) {
        console.error('Error uploading pasted images:', error);
        toast.error('Failed to upload pasted image(s)');
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, uploadFile]
  );

  // Add paste event listener to textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener('paste', handlePaste);
    return () => textarea.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const [isInputExpanded, setIsInputExpanded] = useState(false);
  useEffect(() => {
    if (input.includes('\n')) {
      setIsInputExpanded(true);
    } else {
      setIsInputExpanded(false);
    }
  }, [input]);

  return (
    <div className={cn('relative flex w-full flex-col gap-4', className)}>
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        className='pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0'
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type='file'
      />

      <div
        className={cn(
          'transition-[background-image,box-shadow] duration-300',
          messages.length === 0 && 'p-px',
          (status === 'submitted' || status === 'streaming') &&
            'animate-loading-border bg-size-[200%_100%]',
          messages.length === 0 &&
            status !== 'submitted' &&
            status !== 'streaming' &&
            'input-focus-gradient',
          messages.length === 0 &&
            (resolvedTheme === 'light'
              ? 'input-focus-gradient-light'
              : 'input-focus-gradient-dark')
        )}
        style={{
          borderRadius: isInputExpanded ? '24px' : '30px',
          transition: 'border-radius 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'border-radius',
          ...(status === 'submitted' || status === 'streaming'
            ? {
                backgroundImage:
                  'linear-gradient(90deg, #6366f1 0%, #8b5cf6 20%, #06b6d4 40%, #10b981 60%, #f59e0b 80%, #6366f1 100%)',
                boxShadow: '0 0 20px 2px rgba(139, 92, 246, 0.3)',
              }
            : {}),
        }}
      >
        <PromptInput
          className={cn(
            'flex flex-row justify-between min-h-[60px] overflow-visible! border bg-background px-3 shadow-2xl transition-colors duration-300',
            messages.length === 0 &&
              (resolvedTheme === 'light'
                ? 'focus-within:border-green-800 focus-visible:border-green-800'
                : 'focus-within:border-emerald-600 focus-visible:border-emerald-600'),
            isInputExpanded ? 'p-3 items-end' : 'items-center'
          )}
          style={{
            borderRadius: isInputExpanded
              ? messages.length === 0
                ? '23px'
                : '20px'
              : messages.length === 0
              ? '29px'
              : '30px',
            transition:
              'border-radius 300ms cubic-bezier(0.4, 0, 0.2, 1), padding 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'border-radius',
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!input.trim() && attachments.length === 0) {
              return;
            }
            if (status !== 'ready') {
              toast.error('Please wait for the model to finish its response!');
            } else {
              submitForm();
            }
          }}
        >
          {(attachments.length > 0 || uploadQueue.length > 0) && (
            <div
              className='flex flex-row items-end gap-2 overflow-x-scroll'
              data-testid='attachments-preview'
            >
              {attachments.map((attachment) => (
                <PreviewAttachment
                  attachment={attachment}
                  key={attachment.url}
                  onRemove={() => {
                    setAttachments((currentAttachments) =>
                      currentAttachments.filter((a) => a.url !== attachment.url)
                    );
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                />
              ))}

              {uploadQueue.map((filename) => (
                <PreviewAttachment
                  attachment={{
                    url: '',
                    name: filename,
                    contentType: '',
                  }}
                  isUploading={true}
                  key={filename}
                />
              ))}
            </div>
          )}
          <div
            className={cn(
              'flex flex-row items-center gap-1 w-full sm:gap-2',
              isInputExpanded ? 'items-end' : 'items-center'
            )}
          >
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <PromptInputTextarea
              data-testid='multimodal-input'
              ref={textareaRef}
              value={input}
              placeholder='Ask anything'
              className='grow resize-none border-none bg-transparent px-2 min-h-0! h-auto text-base outline-none ring-0 [-ms-overflow-style:none] [scrollbar-width:none] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-scrollbar]:hidden'
              maxHeight={200}
              minHeight={44}
              onChange={handleInput}
            />
          </div>
          <PromptInputToolbar className='border-top-0! border-t-0! p-0 shadow-none dark:border-0 dark:border-transparent!'>
            <PromptInputTools className='mr-3 gap-0 sm:gap-0.5'>
              <ModelSelectorCompact
                onModelChange={onModelChange}
                selectedModelId={selectedModelId}
              />
            </PromptInputTools>

            {status === 'submitted' ? (
              <StopButton setMessages={setMessages} stop={stop} />
            ) : (
              <PromptInputSubmit
                className='size-8 rounded-full bg-primary text-primary-foreground transition-colors duration-200 hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground'
                data-testid='send-button'
                disabled={!input.trim() || uploadQueue.length > 0}
                status={status}
              >
                <ArrowUpIcon size={14} />
              </PromptInputSubmit>
            )}
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }

    return true;
  }
);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>['status'];
  selectedModelId: string;
}) {
  const isReasoningModel =
    selectedModelId.includes('reasoning') || selectedModelId.includes('think');

  return (
    <Button
      className='aspect-square h-8 rounded-lg p-1 transition-colors hover:bg-accent'
      data-testid='attachments-button'
      disabled={status !== 'ready' || isReasoningModel}
      onClick={(event) => {
        event.preventDefault();
        fileInputRef.current?.click();
      }}
      variant='ghost'
    >
      <PaperclipIcon size={14} style={{ width: 14, height: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selectedModel =
    chatModels.find((m) => m.id === selectedModelId) ??
    chatModels.find((m) => m.id === DEFAULT_CHAT_MODEL) ??
    chatModels[0];
  const [provider] = selectedModel.id.split('/');

  // Provider display names
  const providerNames: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
    xai: 'xAI',
    reasoning: 'Reasoning',
  };

  return (
    <ModelSelector onOpenChange={setOpen} open={open}>
      <ModelSelectorTrigger asChild className='w-32!'>
        <Button className='h-8 justify-between px-2' variant='ghost'>
          {provider && <ModelSelectorLogo provider={provider} />}
          <ModelSelectorName>{selectedModel.name}</ModelSelectorName>
        </Button>
      </ModelSelectorTrigger>
      <ModelSelectorContent>
        <ModelSelectorInput placeholder='Search models...' />
        <ModelSelectorList>
          {Object.entries(modelsByProvider).map(
            ([providerKey, providerModels]) => (
              <ModelSelectorGroup
                heading={providerNames[providerKey] ?? providerKey}
                key={providerKey}
              >
                {providerModels.map((model) => {
                  const logoProvider = model.id.split('/')[0];
                  return (
                    <ModelSelectorItem
                      key={model.id}
                      onSelect={() => {
                        onModelChange?.(model.id);
                        setCookie('chat-model', model.id);
                        setOpen(false);
                      }}
                      value={model.id}
                    >
                      <ModelSelectorLogo provider={logoProvider} />
                      <ModelSelectorName>{model.name}</ModelSelectorName>
                      {model.id === selectedModel.id && (
                        <CheckIcon className='ml-auto size-4' />
                      )}
                    </ModelSelectorItem>
                  );
                })}
              </ModelSelectorGroup>
            )
          )}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  );
}

const ModelSelectorCompact = memo(PureModelSelectorCompact);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>['setMessages'];
}) {
  return (
    <Button
      className='size-7 rounded-full bg-foreground p-1 text-background transition-colors duration-200 hover:bg-foreground/90 disabled:bg-muted disabled:text-muted-foreground'
      data-testid='stop-button'
      onClick={(event) => {
        event.preventDefault();
        stop();
        setMessages((messages) => messages);
      }}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
