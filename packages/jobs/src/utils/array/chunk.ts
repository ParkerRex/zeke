export function chunk<T>(input: T[], size: number): T[][] {
	if (size <= 0) return [input];
	const result: T[][] = [];
	for (let i = 0; i < input.length; i += size) {
		result.push(input.slice(i, i + size));
	}
	return result;
}
