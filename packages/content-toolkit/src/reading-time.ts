export interface ReadingTime {
	words: number;
	minutes: number;
	text: string;
}

const DEFAULT_WORDS_PER_MINUTE = 200;

export function computeReadingTime(
	content: string,
	wordsPerMinute = DEFAULT_WORDS_PER_MINUTE
): ReadingTime {
	const plain = content.replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`~-]/g, ' ');
	const words = (plain.match(/\S+/g) ?? []).length;
	const minutes = Math.max(1, Math.round(words / wordsPerMinute));
	return { words, minutes, text: `${minutes} min read` };
}
