import { FileText, Search, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';
import { ClientOnly } from '~/components/client-only';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command';
import { withBase } from '~/lib/base';
import { groupOf } from '~/lib/docs';
import type { SearchResult } from '~/lib/docs-types';

interface SearchResponse {
	query: string;
	source: 'ai-search' | 'local' | 'none';
	results: SearchResult[];
}

type SearchVariant = 'bar' | 'icon';

function SearchTrigger({ variant, onClick, disabled = false }: { variant: SearchVariant; onClick?: () => void; disabled?: boolean }) {
	if (variant === 'icon') {
		return (
			<Button
				variant="ghost"
				size="icon"
				aria-label="Search documentation"
				onClick={onClick}
				disabled={disabled}
			>
				<Search className="size-4" />
			</Button>
		);
	}
	return (
		<Button
			variant="outline"
			className="h-9 w-full max-w-md justify-start gap-2 rounded-lg border bg-muted/40 px-3 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted/70 hover:text-foreground"
			onClick={onClick}
			disabled={disabled}
		>
			<Search className="size-4" />
			<span>Search docs...</span>
			<kbd className="ml-auto rounded border bg-muted px-1.5 font-mono text-[10px]">⌘K</kbd>
		</Button>
	);
}

function SearchDialogInner({ variant }: { variant: SearchVariant }) {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');
	const [response, setResponse] = React.useState<SearchResponse | null>(null);
	const navigate = useNavigate();

	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			const mobile = window.matchMedia('(max-width: 767px)').matches;
			if ((variant === 'icon') !== mobile) return;
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setOpen((value) => !value);
			}
			if (
				event.key === '/' &&
				!(event.target instanceof HTMLInputElement) &&
				!(event.target instanceof HTMLTextAreaElement)
			) {
				event.preventDefault();
				setOpen(true);
			}
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, [variant]);

	React.useEffect(() => {
		if (!query.trim()) {
			setResponse(null);
			return;
		}
		const controller = new AbortController();
		const timeout = setTimeout(async () => {
			try {
				const res = await fetch(`${withBase('/api/search')}?q=${encodeURIComponent(query)}`, {
					signal: controller.signal,
				});
				if (res.ok) setResponse((await res.json()) as SearchResponse);
			} catch {
				// Aborted request or a transient network error.
			}
		}, 150);
		return () => {
			controller.abort();
			clearTimeout(timeout);
		};
	}, [query]);

	const results = response?.results ?? [];

	return (
		<>
			<SearchTrigger variant={variant} onClick={() => setOpen(true)} />
			<CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
				<CommandInput
					placeholder="Search documentation..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{query.trim() && results.length === 0 ? <CommandEmpty>No results found.</CommandEmpty> : null}
					{results.length > 0 ? (
						<CommandGroup
							heading={
								<span className="flex items-center gap-2">
									Results
									{response?.source === 'ai-search' ? (
										<Badge variant="secondary" className="gap-1">
											<Sparkles />
											AI Search
										</Badge>
									) : null}
								</span>
							}
						>
							{results.map((result, index) => {
								const group = groupOf(result.slug);
								return (
									<CommandItem
										key={`${result.slug}-${index}`}
										value={`${result.slug}-${index}`}
										onSelect={() => {
											setOpen(false);
											setQuery('');
											void navigate(`/${result.slug}`);
										}}
									>
										<FileText className="text-muted-foreground" />
										<div className="min-w-0 flex-1">
											<div className="flex min-w-0 items-baseline gap-2">
												<span className="truncate font-medium">{result.title}</span>
												{group ? (
													<span className="shrink-0 text-xs text-muted-foreground">{group}</span>
												) : null}
											</div>
											{result.excerpt || result.description ? (
												<div className="truncate text-xs text-muted-foreground">
													{result.excerpt ?? result.description}
												</div>
											) : null}
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
					) : null}
				</CommandList>
			</CommandDialog>
		</>
	);
}

export function SearchDialog({ variant = 'bar' }: { variant?: SearchVariant }) {
	return (
		<ClientOnly fallback={<SearchTrigger variant={variant} disabled />}>
			<SearchDialogInner variant={variant} />
		</ClientOnly>
	);
}
