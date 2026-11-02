/**
 * A heading split for a letter-by-letter entrance: every character gets its
 * own index, and Latin words stay grouped, so a narrow screen wraps between
 * words rather than inside one (each letter is its own inline-block). CJK
 * characters stand alone and can break anywhere.
 */
export function titleWords(title: string) {
	let i = 0;
	return (title.match(/[\p{Script=Latin}\d][\p{Script=Latin}\d'’.-]*|./gsu) ?? []).map((w) =>
		[...w].map((ch) => ({ ch, i: i++ }))
	);
}
