'use client';

import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';
import { CircleDotIcon, CircleIcon, TextIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';

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
            variant='ghost'
            size='sm'
            className='group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none'
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
              variant='ghost'
              size='sm'
              className='group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none'
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
        key={section.id}
        variant='link'
        size='sm'
        className='text-foreground w-full justify-start gap-2'
      >
        <CircleDotIcon className='text-muted-foreground size-3!' />
        <span className='text-muted-foreground text-sm'>{section.label}</span>
      </Button>
    );
  };

  return (
    <>
      <Tabs defaultValue='answers' className='w-full'>
        <div className='flex items-center px-4 py-3 w-full'>
          {isLoading ? (
            <Skeleton className='w-full h-4' />
          ) : (
            <div className='flex items-center gap-2'>
              <TextIcon size={12} className='text-muted-foreground' />
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
              <Skeleton key={i} className='w-full h-4' />
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
