import * as React from 'react';
import { Link } from 'react-router';
import {
	AlertTriangle,
	CheckCircle2,
	ChevronRight,
	CircleAlert,
	Copy,
	Check as CheckIcon,
	Info as InfoIcon,
	Lightbulb,
} from 'lucide-react';
import {
	Accordion as UiAccordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion';
import { Card as UiCard, CardDescription, CardTitle } from '~/components/ui/card';
import { Tabs as UiTabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { MintlifyIcon } from '~/lib/icons';
import { cn } from '~/lib/utils';

const CALLOUTS = {
	Note: { icon: InfoIcon, className: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
	Tip: { icon: Lightbulb, className: 'border-primary/40 bg-primary/10 text-primary' },
	Warning: { icon: AlertTriangle, className: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
	Info: { icon: CircleAlert, className: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300' },
	Check: { icon: CheckCircle2, className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
} as const;

type CalloutKind = keyof typeof CALLOUTS;

function Callout({ kind, title, children }: { kind: CalloutKind; title?: string; children?: React.ReactNode }) {
	const { icon: Icon, className } = CALLOUTS[kind];
	return (
		<div className={cn('my-4 flex gap-3 rounded-lg border px-4 py-3 text-sm', className)}>
			<Icon className="mt-0.5 size-4 shrink-0" />
			<div className="min-w-0 flex-1 [&_p]:m-0 [&_p]:leading-6">
				{title ? <p className="mb-1 font-semibold">{title}</p> : null}
				{children}
			</div>
		</div>
	);
}

const Note = (props: { title?: string; children?: React.ReactNode }) => <Callout kind="Note" {...props} />;
const Tip = (props: { title?: string; children?: React.ReactNode }) => <Callout kind="Tip" {...props} />;
const Warning = (props: { title?: string; children?: React.ReactNode }) => <Callout kind="Warning" {...props} />;
const Info = (props: { title?: string; children?: React.ReactNode }) => <Callout kind="Info" {...props} />;
const Check = (props: { title?: string; children?: React.ReactNode }) => <Callout kind="Check" {...props} />;

function hexToRgba(color: string, alpha: number): string | undefined {
	const raw = color.trim();
	const short = /^#([0-9a-f]{3})$/i.exec(raw);
	const long = /^#([0-9a-f]{6})$/i.exec(raw);
	let hex = '';
	if (short) {
		hex = short[1]
			.split('')
			.map((c) => c + c)
			.join('');
	} else if (long) {
		hex = long[1];
	} else {
		return undefined;
	}
	const r = Number.parseInt(hex.slice(0, 2), 16);
	const g = Number.parseInt(hex.slice(2, 4), 16);
	const b = Number.parseInt(hex.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderIcon(icon?: React.ReactNode | string, color?: string) {
	if (!icon) return null;
	if (typeof icon === 'string') {
		const bg = color ? hexToRgba(color, 0.13) : undefined;
		return (
			<span
				className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
				style={color ? { backgroundColor: bg, color } : undefined}
			>
				<MintlifyIcon icon={icon} className="size-4" color={color} />
			</span>
		);
	}
	return icon;
}

function Card({
	title,
	icon,
	href,
	color,
	children,
}: {
	title?: string;
	icon?: React.ReactNode | string;
	href?: string;
	color?: string;
	children?: React.ReactNode;
}) {
	const inner = (
		<UiCard
			className={cn(
				'h-full gap-1 p-5 shadow-none transition-colors',
				href && 'hover:border-primary/60',
			)}
		>
			<CardTitle className="flex items-center gap-2 text-sm">
				{renderIcon(icon, color)}
				<span className="min-w-0 flex-1">{title}</span>
				{href ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
			</CardTitle>
			{children ? (
				<CardDescription className="text-sm [&_p]:m-0">{children}</CardDescription>
			) : null}
		</UiCard>
	);
	if (!href) return inner;
	const isExternal = /^https?:\/\//.test(href);
	return isExternal ? (
		<a href={href} target="_blank" rel="noreferrer" className="block no-underline">
			{inner}
		</a>
	) : (
		<Link to={href} className="block no-underline">
			{inner}
		</Link>
	);
}

function Icon({
	icon,
	color,
	size = 16,
	className,
}: {
	icon?: string;
	color?: string;
	size?: number;
	className?: string;
}) {
	return <MintlifyIcon icon={icon} color={color} size={size} className={className} />;
}

function CardGroup({ cols = 2, children }: { cols?: number; children?: React.ReactNode }) {
	return (
		<div
			className="my-4 grid gap-4"
			style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${cols > 1 ? '16rem' : '100%'}), 1fr))` }}
		>
			{children}
		</div>
	);
}

interface TabElementProps {
	title?: string;
	children?: React.ReactNode;
}

function Tab({ children }: TabElementProps) {
	return <>{children}</>;
}

function Tabs({ children }: { children?: React.ReactNode }) {
	const tabs = React.Children.toArray(children).filter(
		(child): child is React.ReactElement<TabElementProps> => React.isValidElement(child),
	);
	if (tabs.length === 0) return null;
	return (
		<UiTabs defaultValue="0" className="my-4">
			<TabsList>
				{tabs.map((tab, index) => (
					<TabsTrigger key={index} value={String(index)}>
						{tab.props.title ?? `Tab ${index + 1}`}
					</TabsTrigger>
				))}
			</TabsList>
			{tabs.map((tab, index) => (
				<TabsContent key={index} value={String(index)} className="[&_p:first-child]:mt-2">
					{tab}
				</TabsContent>
			))}
		</UiTabs>
	);
}

function CodeGroup({ children }: { children?: React.ReactNode }) {
	const blocks = React.Children.toArray(children).filter(React.isValidElement);
	const titles = blocks.map((block, index) => {
		const props = (block as React.ReactElement<{ title?: string; meta?: string }>).props;
		const meta = typeof props?.meta === 'string' ? props.meta : '';
		return props?.title ?? meta.split(' ')[0] ?? `Code ${index + 1}`;
	});
	if (blocks.length === 0) return null;
	return (
		<UiTabs defaultValue="0" className="my-4">
			<TabsList>
				{titles.map((title, index) => (
					<TabsTrigger key={index} value={String(index)}>
						{title}
					</TabsTrigger>
				))}
			</TabsList>
			{blocks.map((block, index) => (
				<TabsContent key={index} value={String(index)}>
					{block}
				</TabsContent>
			))}
		</UiTabs>
	);
}

function Accordion({
	title,
	children,
	defaultOpen = false,
}: {
	title?: string;
	children?: React.ReactNode;
	defaultOpen?: boolean;
}) {
	return (
		<UiAccordion type="single" collapsible defaultValue={defaultOpen ? 'item' : undefined} className="my-2 rounded-lg border px-4">
			<AccordionItem value="item" className="border-b-0">
				<AccordionTrigger className="py-3 hover:no-underline">{title}</AccordionTrigger>
				<AccordionContent className="text-muted-foreground [&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
					{children}
				</AccordionContent>
			</AccordionItem>
		</UiAccordion>
	);
}

function AccordionGroup({ children }: { children?: React.ReactNode }) {
	return <div className="my-4">{children}</div>;
}

function Steps({ children }: { children?: React.ReactNode }) {
	return <div className="my-6 ml-2 flex flex-col gap-8 border-l pl-8">{children}</div>;
}

function Step({ title, children }: { title?: string; children?: React.ReactNode }) {
	return (
		<div className="relative">
			<span className="absolute -left-[2.55rem] flex size-5 items-center justify-center rounded-full border bg-background">
				<span className="size-1.5 rounded-full bg-primary" />
			</span>
			{title ? <h3 className="mt-0 mb-2 text-base font-semibold">{title}</h3> : null}
			<div className="text-sm text-muted-foreground [&_p:first-child]:mt-0">{children}</div>
		</div>
	);
}

function Frame({ caption, children }: { caption?: string; children?: React.ReactNode }) {
	return (
		<figure className="my-4 overflow-hidden rounded-xl border">
			<div className="[&_img]:m-0 [&_img]:w-full">{children}</div>
			{caption ? (
				<figcaption className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
					{caption}
				</figcaption>
			) : null}
		</figure>
	);
}

function Expandable({ title, children }: { title?: string; children?: React.ReactNode }) {
	return <Accordion title={title}>{children}</Accordion>;
}

function ParamField({
	path,
	query,
	header,
	body,
	type,
	required,
	default: defaultValue,
	children,
}: {
	path?: string;
	query?: string;
	header?: string;
	body?: string;
	type?: string;
	required?: boolean;
	default?: string;
	children?: React.ReactNode;
}) {
	const name = path ?? query ?? header ?? body;
	const location = path ? 'path' : query ? 'query' : header ? 'header' : 'body';
	return (
		<div className="my-4 rounded-lg border px-4 py-3">
			<div className="flex flex-wrap items-center gap-2 font-mono text-sm">
				<span className="font-semibold">{name}</span>
				{type ? <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{type}</span> : null}
				<span className="rounded bg-muted px-1.5 py-0.5 text-xs">{location}</span>
				{required ? (
					<span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">required</span>
				) : null}
				{defaultValue !== undefined ? (
					<span className="text-xs text-muted-foreground">default: {defaultValue}</span>
				) : null}
			</div>
			{children ? <div className="mt-2 text-sm text-muted-foreground [&_p]:m-0">{children}</div> : null}
		</div>
	);
}

const ResponseField = ParamField;

function PreWithCopy({ children, ...props }: React.ComponentProps<'pre'>) {
	const ref = React.useRef<HTMLPreElement>(null);
	const [copied, setCopied] = React.useState(false);
	const [canCopy, setCanCopy] = React.useState(false);
	React.useEffect(() => {
		setCanCopy(true);
	}, []);
	return (
		<div className="group relative">
			<pre ref={ref} {...props}>
				{children}
			</pre>
			{canCopy ? (
				<button
					type="button"
					aria-label="Copy code"
					onClick={() => {
						const text = ref.current?.innerText ?? '';
						void navigator.clipboard?.writeText(text).then(() => {
							setCopied(true);
							setTimeout(() => setCopied(false), 1500);
						});
					}}
					className="absolute top-2 right-2 rounded-md border bg-background/80 p-1.5 text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:text-foreground"
				>
					{copied ? <CheckIcon className="size-3.5" /> : <Copy className="size-3.5" />}
				</button>
			) : null}
		</div>
	);
}

function DocLink({ href = '', children, ...props }: React.ComponentProps<'a'>) {
	if (href.startsWith('#')) {
		return (
			<a href={href} {...props}>
				{children}
			</a>
		);
	}
	if (/^(https?:)?\/\//.test(href) || href.startsWith('mailto:')) {
		return (
			<a href={href} target="_blank" rel="noreferrer" {...props}>
				{children}
			</a>
		);
	}
	return (
		<Link to={href.startsWith('/') ? href : `/${href}`} {...props}>
			{children}
		</Link>
	);
}

export const mdxComponents = {
	Note,
	Tip,
	Warning,
	Info,
	Check,
	Card,
	CardGroup,
	Icon,
	Tabs,
	Tab,
	CodeGroup,
	Accordion,
	AccordionGroup,
	Steps,
	Step,
	Frame,
	Expandable,
	ParamField,
	ResponseField,
	pre: PreWithCopy,
	a: DocLink,
};
