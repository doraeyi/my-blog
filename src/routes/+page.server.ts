import type { PageServerLoad } from './$types';
import { loadSuspectBoard } from '$lib/server/suspect-board';

/** The homepage is just the evidence board. */
export const load: PageServerLoad = async () => ({ board: await loadSuspectBoard() });
