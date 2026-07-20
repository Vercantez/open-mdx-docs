import * as React from 'react';

/** Render children only after mount to avoid SSR/client hydration mismatches. */
export function ClientOnly({
	children,
	fallback = null,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => {
		setMounted(true);
	}, []);
	if (!mounted) return <>{fallback}</>;
	return <>{children}</>;
}
