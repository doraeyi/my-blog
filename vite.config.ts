import tailwindcss from '@tailwindcss/vite';
import { mdsvex } from 'mdsvex';
import { remarkReadingTime, remarkToc } from '@doraeyi/content-toolkit';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	// @lucide/svelte ships raw .svelte source (for tree-shaking) instead of
	// precompiled JS, so Vite's SSR must transform it instead of leaving it
	// external — otherwise Node tries to `import` the .svelte file directly.
	ssr: {
		noExternal: ['@lucide/svelte']
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter(),
			// CSRF is enforced in hooks.server.ts instead, which exempts the two
			// endpoints other servers post to (webmentions, one-click unsubscribe).
			csrf: { trustedOrigins: ['*'] },
			preprocess: [
				mdsvex({
					extensions: ['.svx', '.md'],
					remarkPlugins: [remarkReadingTime, remarkToc]
				})
			],
			extensions: ['.svelte', '.svx', '.md'],
			typescript: {
				config: (config) => {
					config.include.push('../drizzle.config.ts');
				}
			}
		}),

		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true
		})
	]
});
