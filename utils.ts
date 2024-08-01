// this is what sqlite uses https://www.sqlite.org/lang_datefunc.html
export const datetimeToISO8601 = (datetime: Date) => {
	const [datePart, timePart] = datetime.toISOString().split("T");
	return `${datePart} ${timePart.replace(/\.\d+Z/, "")}`;
};
