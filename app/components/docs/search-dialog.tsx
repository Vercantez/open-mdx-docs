import { FileText, Sparkles } from 'lucide-react';
import * as React from 'react';
import { useNavigate } from 'react-router';
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
import type { SearchResult } from '~/lib/docs-types';

interface SearchResponse {
	query: string;
	source: 'ai-search' | 'local' | 'none';
	results: SearchResult[];
}

export function SearchDialog() {
	const [open, setOpen] = React.useState(false);
	const [query, setQuery] = React.useState('');
	const [response, setResponse] = React.useState<SearchResponse | null>(null);
	const navigate = useNavigate();

	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
				event.preventDefault();
				setOpen((value) => !value);
			}
			if (event.key === '/' && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
				event.preventDefault();
				setOpen(true);
			}
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

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
				// aborted or network error; ignore
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
			<Button
				variant="outline"
				className="h-8 w-40 justify-start gap-2 text-muted-foreground lg:w-56"
				onClick={() => setOpen(true)}
			>
				<FileText className="size-3.5" />
				<span className="hidden lg:inline">Search docs...</span>
				<kbd className="ml-auto hidden rounded border bg-muted px-1.5 font-mono text-[10px] lg:inline">
					⌘K
				</kbd>
			</Button>
			<CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
				<CommandInput
					placeholder="Search documentation..."
					value={query}
					onValueChange={setQuery}
				/>
				<CommandList>
					{query.trim() && results.length === 0 ? (
						<CommandEmpty>No results found.</CommandEmpty>
					) : null}
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
							{results.map((result, index) => (
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
										<div className="truncate font-medium">{result.title}</div>
										{result.excerpt || result.description ? (
											<div className="truncate text-xs text-muted-foreground">
												{result.excerpt ?? result.description}
											</div>
										) : null}
									</div>
								</CommandItem>
							))}
						</CommandGroup>
					) : null}
				</CommandList>
			</CommandDialog>
		</>
	);
}
