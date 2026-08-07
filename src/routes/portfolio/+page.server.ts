import type { PageServerLoad } from './$types';
import { listProjects } from '$lib/server/services/projects-service';

export const load: PageServerLoad = async () => {
	return { projects: await listProjects() };
};
