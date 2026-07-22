import * as React from 'react';
import { Accordion as AccordionPrimitive } from 'radix-ui';
import { ChevronDown } from 'lucide-react';
import { cn } from '~/lib/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn('border-b last:border-b-0', className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="not-prose flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					'flex w-full flex-1 items-center justify-between gap-4 px-4 py-4 text-left text-[15px] font-medium transition-colors outline-none hover:bg-muted/50 hover:no-underline disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
			{...props}
		>
			<div
				className={cn(
					'px-4 pt-0.5 pb-4 text-sm leading-relaxed text-muted-foreground',
					className,
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
