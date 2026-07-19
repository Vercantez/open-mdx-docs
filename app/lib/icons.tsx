import { icons, type LucideIcon, CircleHelp } from 'lucide-react';

/** Mintlify / Font Awesome style names → Lucide export names */
const ALIASES: Record<string, keyof typeof icons> = {
	rocket: 'Rocket',
	seedling: 'Sprout',
	users: 'Users',
	building: 'Building2',
	'circle-dot': 'CircleDot',
	'circle-dollar': 'CircleDollarSign',
	'folder-open': 'FolderOpen',
	'layer-group': 'Layers',
	plug: 'Plug',
	'clock-rotate-left': 'History',
	'hard-drive': 'HardDrive',
	globe: 'Globe',
	code: 'Code',
	brain: 'Brain',
	clock: 'Clock',
	robot: 'Bot',
	wrench: 'Wrench',
	'arrows-spin': 'RefreshCw',
	'arrows-rotate': 'RefreshCw',
	browser: 'AppWindow',
	window: 'AppWindow',
	'chart-line': 'ChartLine',
	newspaper: 'Newspaper',
	'credit-card': 'CreditCard',
	bookmark: 'Bookmark',
	envelope: 'Mail',
	database: 'Database',
	cloud: 'Cloud',
	'shield-check': 'ShieldCheck',
	terminal: 'Terminal',
	'comment-dots': 'MessageCircle',
	bolt: 'Zap',
	palette: 'Palette',
	lock: 'Lock',
	sitemap: 'Network',
	rules: 'ListChecks',
	copy: 'Copy',
	phone: 'Phone',
	paintbrush: 'Paintbrush',
	star: 'Star',
	sparkles: 'Sparkles',
	lightbulb: 'Lightbulb',
	swatchbook: 'SwatchBook',
	'sun-bright': 'Sun',
	moon: 'Moon',
	'circle-half-stroke': 'Contrast',
	'pen-nib': 'PenTool',
	bell: 'Bell',
};

function toPascalCase(name: string): string {
	return name
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('');
}

export function resolveIcon(name?: string | null): LucideIcon {
	if (!name) return CircleHelp;
	const normalized = name.trim().toLowerCase();
	const aliased = ALIASES[normalized];
	if (aliased && icons[aliased]) return icons[aliased];
	const pascal = toPascalCase(normalized) as keyof typeof icons;
	if (icons[pascal]) return icons[pascal];
	return CircleHelp;
}

export function MintlifyIcon({
	icon,
	className,
	color,
	size = 16,
}: {
	icon?: string | null;
	className?: string;
	color?: string;
	size?: number;
}) {
	const Comp = resolveIcon(icon);
	return (
		<Comp
			className={className}
			size={size}
			style={color ? { color } : undefined}
			aria-hidden
		/>
	);
}
