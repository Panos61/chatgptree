'use client';

import { CircleDotIcon, CircleIcon, TextIcon } from 'lucide-react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetcher } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';

type Navigator = {
  id: string;
  chatId: string;
  chatTitle: string;
  updatedAt: string;
};

type NavigatorEntry = {
  id: string;
  navigatorId: string;
  chatId: string;
  assistantMessageId: string;
  userMessageId: string;
  label: string;
  anchor: string;
  sections: NavigatorSection[];
};

type NavigatorSection = {
  id: string;
  navigatorId: string;
  parentId: string | null;
  assistantMessageId: string;
  label: string;
  anchor: string;
  level: number;
};

type NavigatorData = {
  navigator: Navigator;
  entries: NavigatorEntry[];
};

export function Navigator({ id }: { id: string }) {
  const { data, isLoading } = useSWR<NavigatorData>(
    id ? `http://localhost:8080/navigator/by-chat/${id}` : null,
    fetcher,
    {
      revalidateOnMount: true,
      revalidateOnFocus: true,
      shouldRetryOnError: true,
      errorRetryInterval: 5000,
    }
  );

  const renderEntry = (entry: NavigatorEntry) => {
    return (
      <Collapsible key={entry.id}>
        <CollapsibleTrigger asChild>
          <Button
            className='group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none'
            size='sm'
            variant='ghost'
          >
            <CircleIcon className='text-muted-foreground size-3!' />
            {entry.label}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className='style-lyra:ml-4 mt-1 ml-5'>
          <div className='flex flex-col gap-1'>
            {entry.sections?.map((section) => renderSections(section))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const renderSections = (section: NavigatorSection) => {
    if ('items' in section) {
      return (
        <Collapsible key={section.id}>
          <CollapsibleTrigger asChild>
            <Button
              className='group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none'
              size='sm'
              variant='ghost'
            >
              {/* <ChevronRightIcon className='size-3! transition-transform group-data-[state=open]:rotate-90' /> */}
              <CircleIcon className='text-muted-foreground size-3!' />
              {section.label}
            </Button>
          </CollapsibleTrigger>
          {/* <CollapsibleContent className='style-lyra:ml-4 mt-1 ml-5'>
            <div className='flex flex-col gap-1'>
              {fileItem.items.map((child) => renderItem(child))}
             </div> 
          </CollapsibleContent> */}
        </Collapsible>
      );
    }
    return (
      <Button
        className='text-foreground w-full justify-start gap-2'
        key={section.id}
        size='sm'
        variant='link'
      >
        <CircleDotIcon className='text-muted-foreground size-3!' />
        <span className='text-muted-foreground text-sm'>{section.label}</span>
      </Button>
    );
  };

  return (
    <>
      <Tabs className='w-full' defaultValue='answers'>
        <div className='flex items-center px-4 py-3 w-full'>
          {isLoading ? (
            <Skeleton className='w-full h-4' />
          ) : (
            <div className='flex items-center gap-2'>
              <TextIcon className='text-muted-foreground' size={12} />
              <span className='font-semibold text-m overflow-hidden text-ellipsis min-w-0 line-clamp-1'>
                {data?.navigator.chatTitle}
              </span>
            </div>
          )}
        </div>
        <Separator />
        <TabsList className='w-full bg-transparent!'>
          <TabsTrigger value='answers'>Answers</TabsTrigger>
          <TabsTrigger value='questions'>Questions</TabsTrigger>
        </TabsList>
      </Tabs>
      <ScrollArea className='h-[calc(100vh-100px)]'>
        {isLoading ? (
          <div className='flex flex-col gap-4 p-6'>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton className='w-full h-4' key={i} />
            ))}
          </div>
        ) : (
          <div className='flex flex-col gap-1 p-1'>
            {data?.entries.map((entry) => renderEntry(entry))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
