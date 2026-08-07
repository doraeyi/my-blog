import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { admin } from 'better-auth/plugins';
import { defaultRoles } from 'better-auth/plugins/admin/access';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true },
	socialProviders: {
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET
		}
	},
	plugins: [
		admin({
			// adds `role` to the user table; "Liam" is the admin role for this personal site,
			// reusing the plugin's built-in admin permission set under that name
			adminRoles: ['Liam'],
			roles: { Liam: defaultRoles.admin, user: defaultRoles.user }
		}),
		sveltekitCookies(getRequestEvent) // make sure this is the last plugin in the array
	]
});
