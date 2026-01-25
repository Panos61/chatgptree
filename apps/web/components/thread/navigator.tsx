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
import { CircleDotIcon, CircleIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { ScrollArea } from '../ui/scroll-area';
import { useEffect } from 'react';

type TreeItem = { name: string } | { name: string; items: TreeItem[] };

export function Navigator({ id }: { id: string }) {
  console.log('id', id);
  const { data, isLoading, mutate } = useSWR(
    id ? `http://localhost:8080/navigator/${id}` : null,
    fetcher,
    {
      revalidateOnMount: true,
    }
  );

  useEffect(() => {
    if (id) {
      mutate(`http://localhost:8080/navigator/${id}`);
    }
  }, [id]);

  const Tree: TreeItem[] = [
    {
      name: 'Getting Hired',
      items: [
        { name: 'Build a Strong Foundation' },
        { name: 'Prepare Your Application' },
        { name: 'Ace the Interview' },
        { name: 'Interview Process' },
        { name: 'Preparation Tips' },
      ],
    },
    {
      name: 'Skills at Uber',
      items: [
        {
          name: 'Frontend Development',
          items: [
            { name: 'React' },
            { name: 'Next.js' },
            { name: 'Tailwind CSS' },
            { name: 'TypeScript' },
          ],
        },
        { name: 'Backend Development' },
        { name: 'Database' },
        { name: 'DevOps' },
        { name: 'Cloud Computing' },
      ],
    },
    {
      name: 'Succeeding at Uber',
      items: [
        { name: 'Understand the Culture' },
        { name: 'Key Skills & Focus Areas' },
        { name: 'Growth & Development' },
      ],
    },
    {
      name: 'Company Culture',
      items: [
        { name: 'Understand the Culture' },
        { name: 'Key Skills & Focus Areas' },
        { name: 'Growth & Development' },
      ],
    },
    {
      name: 'Resources',
      items: [
        { name: 'Uber Career Resources' },
        { name: 'Uber Careers Blog' },
        { name: 'Uber Careers Podcast' },
      ],
    },
  ];

  const renderItem = (fileItem: TreeItem) => {
    if ('items' in fileItem) {
      return (
        <Collapsible key={fileItem.name}>
          <CollapsibleTrigger asChild>
            <Button
              variant='ghost'
              size='sm'
              className='group hover:bg-accent hover:text-accent-foreground w-full justify-start transition-none'
            >
              {/* <ChevronRightIcon className='size-3! transition-transform group-data-[state=open]:rotate-90' /> */}
              <CircleIcon className='text-muted-foreground size-3!' />
              {fileItem.name}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='style-lyra:ml-4 mt-1 ml-5'>
            <div className='flex flex-col gap-1'>
              {fileItem.items.map((child) => renderItem(child))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }
    return (
      <Button
        key={fileItem.name}
        variant='link'
        size='sm'
        className='text-foreground w-full justify-start gap-2'
      >
        <CircleDotIcon className='text-muted-foreground size-3!' />
        <span className='text-muted-foreground text-sm'>{fileItem.name}</span>
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
            <span className='font-semibold text-sm overflow-hidden text-ellipsis min-w-0 line-clamp-1'>
              {data?.chatTitle}
            </span>
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
            {Tree.map((item) => renderItem(item))}
          </div>
        )}
      </ScrollArea>
    </>
  );
}
