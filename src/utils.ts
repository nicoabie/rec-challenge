import { formatDate } from "date-fns";

// this is what sqlite uses https://www.sqlite.org/lang_datefunc.html
export const datetimeToISO8601 = (datetime: Date) => {
	return formatDate(datetime, "yyyy-MM-dd HH:mm:ss");
};

export const idsToBits = (ids: number[]): number => {
	let result = 0;
	// database ids starts at 1, to not waste bit 0 we always substract 1.
	for (const id of ids) {
		result |= 1 << (id - 1);
	}
	return result;
};

export const bitsToIds = (bits: number): number[] => {
	const ids: number[] = [];
	let position = 0;
	let b = bits;

	while (b !== 0) {
		if (b & 1) {
			ids.push(position + 1); // Add 1 since IDs start at 1
		}
		b >>= 1; // Shift bits to the right
		position++;
	}

	return ids;
};

export const encodeAvailabilityToken = (data: {
	diners: number;
	dinerIds: number[];
	datetime: Date;
	tables: Record<string, number[]>;
}) => btoa(JSON.stringify(data));
