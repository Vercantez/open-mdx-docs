import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function Pager({
	prev,
	next,
}: {
	prev?: { slug: string; title: string };
	next?: { slug: string; title: string };
}) {
	if (!prev && !next) return null;
	return (
		<div className="not-prose mt-14 flex items-start justify-between gap-6 border-t pt-6">
			{prev ? (
				<Link to={`/${prev.slug}`} className="group flex flex-col gap-1 no-underline">
					<span className="flex items-center gap-1 text-[13px] text-muted-foreground">
						<ArrowLeft className="size-3.5" /> Previous
					</span>
					<span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
						{prev.title}
					</span>
				</Link>
			) : (
				<span />
			)}
			{next ? (
				<Link
					to={`/${next.slug}`}
					className="group ml-auto flex flex-col items-end gap-1 text-right no-underline"
				>
					<span className="flex items-center gap-1 text-[13px] text-muted-foreground">
						Next <ArrowRight className="size-3.5" />
					</span>
					<span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
						{next.title}
					</span>
				</Link>
			) : null}
		</div>
	);
}
