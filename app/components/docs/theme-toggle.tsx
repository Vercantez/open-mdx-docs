import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '~/components/ui/button';

export function ThemeToggle({ strict = false }: { strict?: boolean }) {
	const { resolvedTheme, setTheme } = useTheme();
	if (strict) return null;
	const label = resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

	return (
		<Button
			variant="ghost"
			size="icon"
			className="relative"
			aria-label={label}
			title={label}
			onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
		>
			<Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>
	);
}
