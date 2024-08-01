// this is what sqlite uses https://www.sqlite.org/lang_datefunc.html
export const datetimeToISO8601 = (datetime: Date) => {
	const [datePart, timePart] = datetime.toISOString().split("T");
	return `${datePart} ${timePart.replace(/\.\d+Z/, "")}`;
};

export const restrictionsToBits = (restrictions: number[]): number => {
	let result = 0;
	// database ids starts at 1, to not waste bit 0 we always substract 1.
	for (const r of restrictions) {
		result |= 1 << (r - 1);
	}
	return result;
};
