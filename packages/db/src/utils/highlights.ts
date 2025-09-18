export type NumericLike = number | string | null | undefined;

export type HighlightReferenceRow = {
	referenceId: string;
	highlightId: string;
	turnId: string;
	sourceUrl: string | null;
	storyId: string;
	chapterId: string | null;
	speaker: string | null;
	content: string | null;
	startSeconds: NumericLike;
	endSeconds: NumericLike;
};

export type HighlightReference = {
	id: string;
	highlightId: string;
	turnId: string;
	sourceUrl: string | null;
	storyId: string;
	chapterId: string | null;
	speaker: string | null;
	content: string | null;
	startSeconds: number | null;
	endSeconds: number | null;
};

export function numericToNumber(value: NumericLike): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isNaN(value) ? null : value;
	const parsed = Number.parseFloat(value);
	return Number.isNaN(parsed) ? null : parsed;
}

export function mapHighlightReference(row: HighlightReferenceRow): HighlightReference {
	return {
		id: row.referenceId,
		highlightId: row.highlightId,
		turnId: row.turnId,
		sourceUrl: row.sourceUrl,
		storyId: row.storyId,
		chapterId: row.chapterId,
		speaker: row.speaker,
		content: row.content,
		startSeconds: numericToNumber(row.startSeconds),
		endSeconds: numericToNumber(row.endSeconds),
	};
}
