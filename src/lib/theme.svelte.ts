export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

function systemPreference(): Theme {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

class ThemeStore {
	current = $state<Theme>('light');

	/** Mirrors the store to the data-theme attribute the inline app.html script already set. */
	sync() {
		const attr = document.documentElement.getAttribute('data-theme');
		this.current = attr === 'dark' ? 'dark' : attr === 'light' ? 'light' : systemPreference();
	}

	set(theme: Theme) {
		this.current = theme;
		const root = document.documentElement;
		root.setAttribute('data-theme', theme);
		// Turning the lights off by hand is what lights the torch.
		if (theme === 'dark') root.dataset.torch = '';
		else delete root.dataset.torch;
		try {
			localStorage.setItem(STORAGE_KEY, theme);
		} catch {
			// Private browsing / storage disabled — theme just won't persist.
		}
	}

	toggle() {
		this.set(this.current === 'dark' ? 'light' : 'dark');
	}
}

export const theme = new ThemeStore();
