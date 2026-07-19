import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Card } from '~/components/ui/card';

export function Pager({
	prev,
	next,
}: {
	prev?: { slug: string; title: string };
	next?: { slug: string; title: string };
}) {
	if (!prev && !next) return null;
	return (
		<div className="mt-12 grid gap-3 sm:grid-cols-2">
			{prev ? (
				<Link to={`/${prev.slug}`}>
					<Card className="h-full p-4 shadow-none transition-colors hover:border-primary/60">
						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<ArrowLeft className="size-3" /> Previous
						</span>
						<span className="mt-1 block text-sm font-medium">{prev.title}</span>
					</Card>
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link to={`/${next.slug}`} className="sm:text-right">
					<Card className="h-full p-4 shadow-none transition-colors hover:border-primary/60">
						<span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
							Next <ArrowRight className="size-3" />
						</span>
						<span className="mt-1 block text-sm font-medium">{next.title}</span>
					</Card>
				</Link>
			) : null}
		</div>
	);
}
