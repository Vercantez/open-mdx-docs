import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '~/lib/utils';

function Tabs({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			className={cn('flex flex-col gap-2', className)}
			{...props}
		/>
	);
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(
				'flex h-auto w-full items-center justify-start gap-6 overflow-x-auto rounded-none border-b bg-transparent p-0 text-muted-foreground',
				className,
			)}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				'relative -mb-px shrink-0 rounded-none border-0 bg-transparent px-0 pt-1 pb-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground shadow-none transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-transparent hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:after:bg-primary [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn('flex-1 outline-none', className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
