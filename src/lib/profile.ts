/**
 * Facts about Liam shared by the 人物檔案 (/about) and the English profile (/en).
 * Keep them to things that are true and current — recruiters read both pages.
 */

/** Résumé PDF in static/, or null until one is added. */
export const resumeUrl: string | null = null;

export interface ExperienceEntry {
	/** e.g. "2024.07 — 現在" */
	period: string;
	org: string;
	role: string;
	/** One to three short lines of what was done there. */
	points: string[];
}

/** Work history, newest first. Filled from the résumé. */
export const experience: ExperienceEntry[] = [];

/** Education, newest first. Filled from the résumé. */
export const education: ExperienceEntry[] = [];
