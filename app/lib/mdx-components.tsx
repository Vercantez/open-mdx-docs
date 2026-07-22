import * as React from 'react';
import { slug as slugify } from 'github-slugger';
import { Link } from 'react-router';
import {
	AlertTriangle,
	ArrowUpRight,
	Check as CheckIcon,
	CheckCircle2,
	CircleAlert,
	Copy,
	Info as InfoIcon,
	Lightbulb,
} from 'lucide-react';
import {
	Accordion as UiAccordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion';
import { Tabs as UiTabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { MintlifyIcon } from '~/lib/icons';
import { cn } from '~/lib/utils';

const CALLOUTS = {
	Note: {
		icon: InfoIcon,
		background: 'bg-muted/60',
		accent: 'text-muted-foreground',
	},
	Tip: {
		icon: Lightbulb,
		background: 'bg-primary/[0.07]',
		accent: 'text-primary',
	},
	Info: {
		icon: CircleAlert,
		background: 'bg-sky-500/[0.08]',
		accent: 'text-sky-600 dark:text-sky-400',
	},
	Warning: {
		icon: AlertTriangle,
		background: 'bg-amber-500/[0.08]',
		accent: 'text-amber-600 dark:text-amber-400',
	},
	Check: {
		icon: CheckCircle2,
		background: 'bg-emerald-500/[0.08]',
		accent: 'text-emerald-600 dark:text-emerald-400',
	},
} as const;

type CalloutKind = keyof typeof CALLOUTS;

function Callout({
	kind,
	title,
	children,
}: {
	kind: CalloutKind;
	title?: string;
	children?: React.ReactNode;
}) {
	const { icon: Icon, background, accent } = CALLOUTS[kind];
	return (
		<div
			className={cn(
				'my-5 flex gap-3 rounded-xl border border-transparent px-4 py-3.5 text-sm leading-relaxed',
				background,
			)}
		>
			<Icon className={cn('mt-0.5 size-4 shrink-0', accent)} />
			<div className="min-w-0 flex-1 text-foreground/90 [&_p]:m-0 [&_p]:leading-relaxed [&_p+p]:mt-2">
				{title ? <div className={cn('mb-1 font-medium', accent)}>{title}</div> : null}
				{children}
			</div>
		</div>
	);
}

const Note = (props: { title?: string; children?: React.ReactNode }) => (
	<Callout kind="Note" {...props} />
);
const Tip = (props: { title?: string; children?: React.ReactNode }) => (
	<Callout kind="Tip" {...props} />
);
const Warning = (props: { title?: string; children?: React.ReactNode }) => (
	<Callout kind="Warning" {...props} />
);
const Info = (props: { title?: string; children?: React.ReactNode }) => (
	<Callout kind="Info" {...props} />
);
const Check = (props: { title?: string; children?: React.ReactNode }) => (
	<Callout kind="Check" {...props} />
);

function renderCardIcon(icon?: React.ReactNode | string, color?: string, className?: string) {
	if (!icon) return null;
	if (typeof icon === 'string') {
		return <MintlifyIcon icon={icon} className={cn('size-5 text-primary', className)} color={color} size={20} />;
	}
	return (
		<span className={cn('block size-5 text-primary [&_svg]:size-5', className)} style={color ? { color } : undefined}>
			{icon}
		</span>
	);
}

function Card({
	title,
	icon,
	href,
	color,
	horizontal = false,
	children,
}: {
	title?: string;
	icon?: React.ReactNode | string;
	href?: string;
	color?: string;
	horizontal?: boolean;
	children?: React.ReactNode;
}) {
	const isExternal = Boolean(href && /^https?:\/\//.test(href));
	const renderedIcon = renderCardIcon(icon, color, horizontal ? 'mt-0.5 shrink-0' : undefined);
	const cardContents = (
		<>
			{title ? (
				<div
					className={cn(
						'text-base font-semibold text-foreground',
						!horizontal && renderedIcon && 'mt-3',
						!horizontal && isExternal && 'pr-6',
					)}
				>
					{title}
				</div>
			) : null}
			{children ? (
				<div className={cn(horizontal ? 'mt-1' : 'mt-1.5', 'text-sm leading-relaxed text-muted-foreground [&_p]:m-0')}>
					{children}
				</div>
			) : null}
		</>
	);
	const inner = (
		<div
			className={cn(
				'relative h-full rounded-xl border bg-transparent shadow-none',
				horizontal ? 'flex items-start gap-3 p-4' : 'p-5',
				href && 'transition-colors hover:border-primary/50',
			)}
		>
			{renderedIcon}
			{horizontal ? <div className={cn('min-w-0 flex-1', isExternal && 'pr-6')}>{cardContents}</div> : cardContents}
			{isExternal ? (
				<ArrowUpRight className={cn('absolute size-4 text-muted-foreground', horizontal ? 'top-4 right-4' : 'top-5 right-5')} />
			) : null}
		</div>
	);
	if (!href) return inner;
	const className = 'not-prose block no-underline';
	return isExternal ? (
		<a href={href} target="_blank" rel="noreferrer" className={className}>
			{inner}
		</a>
	) : (
		<Link to={href} className={className}>
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
	const className =
		cols === 1
			? 'my-4 grid grid-cols-1 gap-3'
			: cols === 2
				? 'my-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:[&>*:last-child:nth-child(odd)]:col-span-full'
				: 'my-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:max-lg:[&>*:last-child:nth-child(odd)]:col-span-full lg:grid-cols-6 lg:[&>*]:col-span-2 lg:[&>*:last-child:nth-child(3n+1)]:col-span-6 lg:[&>*:nth-last-child(2):nth-child(3n+1)]:col-span-3 lg:[&>*:last-child:nth-child(3n+2)]:col-span-3';
	return (
		<div className={className}>{children}</div>
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
		<UiTabs defaultValue="0" className="my-4 gap-0">
			<TabsList className="docs-tab-bar-scroll">
				{tabs.map((tab, index) => (
					<TabsTrigger key={index} value={String(index)}>
						{tab.props.title ?? `Tab ${index + 1}`}
					</TabsTrigger>
				))}
			</TabsList>
			{tabs.map((tab, index) => (
				<TabsContent key={index} value={String(index)} className="mt-4 [&_p:first-child]:mt-0">
					{tab}
				</TabsContent>
			))}
		</UiTabs>
	);
}

type CodePreProps = React.ComponentProps<'pre'> & {
	title?: string;
	meta?: string;
	'data-language'?: string;
	'data-meta'?: string;
};

function codeLabel(props: CodePreProps): string | undefined {
	if (typeof props.title === 'string' && props.title.trim()) return props.title.trim();
	const meta = (props['data-meta'] ?? props.meta)?.trim();
	if (meta) {
		const named = /(?:^|\s)(?:title|filename)=["']([^"']+)["']/i.exec(meta);
		return named?.[1] ?? meta;
	}
	const language = props['data-language']?.toLowerCase();
	return language && ['text', 'txt', 'plaintext'].includes(language) ? undefined : language;
}

const CodeGroupContext = React.createContext(false);

function codeBlockProps(block: React.ReactElement): CodePreProps {
	let candidate = block;
	for (let depth = 0; depth < 4; depth += 1) {
		const props = candidate.props as CodePreProps;
		if (props.title || props.meta || props['data-meta'] || props['data-language']) return props;
		const nested = React.Children.toArray(props.children).filter(
			(child): child is React.ReactElement => React.isValidElement(child),
		);
		if (nested.length !== 1) return props;
		candidate = nested[0];
	}
	return candidate.props as CodePreProps;
}

function CopyButton({
	copied,
	disabled,
	onClick,
	className,
}: {
	copied: boolean;
	disabled: boolean;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			aria-label="Copy code"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
				className,
			)}
		>
			{copied ? (
				<CheckIcon className="size-3.5 text-primary" />
			) : (
				<Copy className="size-3.5" />
			)}
		</button>
	);
}

function CodeGroup({ children }: { children?: React.ReactNode }) {
	const blocks = React.Children.toArray(children).filter(
		(child): child is React.ReactElement<CodePreProps> => React.isValidElement(child),
	);
	const [active, setActive] = React.useState('0');
	const [copied, setCopied] = React.useState(false);
	const [canCopy, setCanCopy] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);
	React.useEffect(() => setCanCopy(true), []);
	React.useEffect(() => setCopied(false), [active]);
	if (blocks.length === 0) return null;
	return (
		<CodeGroupContext.Provider value>
			<div ref={containerRef} className="my-5 overflow-hidden rounded-xl border">
				<UiTabs value={active} onValueChange={setActive} className="gap-0">
					<div className="flex h-10 items-center border-b bg-muted/40">
						<TabsList className="docs-tab-bar-scroll h-10 min-w-0 flex-1 gap-1 overflow-x-auto border-b-0 bg-transparent px-2">
							{blocks.map((block, index) => (
								<TabsTrigger
									key={index}
									value={String(index)}
									className="m-0 rounded-md px-2.5 py-1 font-mono text-xs font-medium text-muted-foreground after:hidden hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground"
								>
									{codeLabel(codeBlockProps(block)) ?? `Code ${index + 1}`}
								</TabsTrigger>
							))}
						</TabsList>
						<CopyButton
							copied={copied}
							disabled={!canCopy}
							className="mr-2 ml-auto shrink-0"
							onClick={() => {
								const text =
									containerRef.current?.querySelector<HTMLElement>('[data-state="active"] pre')
										?.innerText ?? '';
								void navigator.clipboard?.writeText(text).then(() => {
									setCopied(true);
									setTimeout(() => setCopied(false), 1500);
								});
							}}
						/>
					</div>
					{blocks.map((block, index) => (
						<TabsContent
							key={index}
							value={String(index)}
							className="m-0 [&_pre]:my-0 [&_pre]:rounded-none [&_pre]:border-0"
						>
							{block}
						</TabsContent>
					))}
				</UiTabs>
			</div>
		</CodeGroupContext.Provider>
	);
}

const AccordionGroupContext = React.createContext(false);

function Accordion({
	title,
	children,
	defaultOpen = false,
}: {
	title?: string;
	children?: React.ReactNode;
	defaultOpen?: boolean;
}) {
	const grouped = React.useContext(AccordionGroupContext);
	return (
		<UiAccordion
			type="single"
			collapsible
			defaultValue={defaultOpen ? 'item' : undefined}
			className={cn(!grouped && 'my-4 overflow-hidden rounded-xl border')}
		>
			<AccordionItem value="item" className="border-b-0">
				<AccordionTrigger>{title}</AccordionTrigger>
				<AccordionContent className="[&_p:first-child]:mt-0 [&_p:last-child]:mb-0">
					{children}
				</AccordionContent>
			</AccordionItem>
		</UiAccordion>
	);
}

function AccordionGroup({ children }: { children?: React.ReactNode }) {
	return (
		<AccordionGroupContext.Provider value>
			<div className="my-6 divide-y divide-border overflow-hidden rounded-xl border">
				{children}
			</div>
		</AccordionGroupContext.Provider>
	);
}

interface StepProps {
	title?: string;
	children?: React.ReactNode;
	number?: number;
	last?: boolean;
}

function Steps({ children }: { children?: React.ReactNode }) {
	const steps = React.Children.toArray(children).filter(
		(child): child is React.ReactElement<StepProps> => React.isValidElement(child),
	);
	return (
		<div className="my-6 flex flex-col">
			{steps.map((step, index) =>
				React.cloneElement(step, {
					number: index + 1,
					last: index === steps.length - 1,
				}),
			)}
		</div>
	);
}

function Step({ title, children, number = 1, last = false }: StepProps) {
	return (
		<div className="flex gap-4">
			<div className="flex flex-col items-center">
				<span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/50 font-mono text-[13px] font-medium text-muted-foreground">
					{number}
				</span>
				{last ? null : <span className="w-px flex-1 bg-border" />}
			</div>
			<div className={cn('min-w-0 flex-1', last ? 'pb-1' : 'pb-8')}>
				{title ? <h3 className="mt-0.5 mb-2 text-base font-semibold">{title}</h3> : null}
				<div className="text-sm leading-relaxed text-muted-foreground [&_p:first-child]:mt-0">
					{children}
				</div>
			</div>
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

function Update({
	label,
	description,
	children,
}: {
	label?: string;
	description?: string;
	children?: React.ReactNode;
}) {
	return (
		<div
			id={label ? slugify(label) : undefined}
			data-update
			className="flex flex-col gap-3 border-t py-10 first:border-t-0 first:pt-0 lg:flex-row lg:gap-10"
		>
			<div className="lg:sticky lg:top-32 lg:w-44 lg:shrink-0 lg:self-start">
				{label ? <div className="text-sm font-medium text-foreground">{label}</div> : null}
				{description ? (
					<div className="mt-2 inline-flex w-fit rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
						{description}
					</div>
				) : null}
			</div>
			<div className="min-w-0 flex-1">{children}</div>
		</div>
	);
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
	const badgeClassName = 'rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs';
	return (
		<div className="my-4 rounded-xl border bg-transparent px-4 py-3">
			<div className="flex flex-wrap items-center gap-2 font-mono text-sm">
				<span className="font-semibold">{name}</span>
				{type ? <span className={badgeClassName}>{type}</span> : null}
				<span className={badgeClassName}>{location}</span>
				{required ? (
					<span className="rounded-md bg-destructive/10 px-1.5 py-0.5 font-mono text-xs text-destructive">
						required
					</span>
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

function PreWithCopy(allProps: CodePreProps) {
	const {
		children,
		title,
		meta,
		'data-language': language,
		'data-meta': dataMeta,
		...props
	} = allProps;
	const inCodeGroup = React.useContext(CodeGroupContext);
	const ref = React.useRef<HTMLPreElement>(null);
	const [copied, setCopied] = React.useState(false);
	const [canCopy, setCanCopy] = React.useState(false);
	React.useEffect(() => setCanCopy(true), []);
	const label = codeLabel({ title, meta, 'data-language': language, 'data-meta': dataMeta });
	if (inCodeGroup) {
		return (
			<pre data-language={language} data-meta={dataMeta} {...props}>
				{children}
			</pre>
		);
	}
	const copy = () => {
		const text = ref.current?.innerText ?? '';
		void navigator.clipboard?.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		});
	};
	return (
		<div className="group relative my-5 overflow-hidden rounded-xl border">
			{label ? (
				<div className="flex h-10 items-center justify-between border-b bg-muted/40 px-4">
					<span className="font-mono text-xs text-muted-foreground">{label}</span>
					<CopyButton copied={copied} disabled={!canCopy} onClick={copy} />
				</div>
			) : null}
			<pre ref={ref} data-language={language} data-meta={dataMeta} {...props}>
				{children}
			</pre>
			{label ? null : (
				<CopyButton
					copied={copied}
					disabled={!canCopy}
					onClick={copy}
					className="absolute top-2 right-2 border bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
				/>
			)}
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
	Update,
	ParamField,
	ResponseField,
	pre: PreWithCopy,
	a: DocLink,
};
