import type { Database } from "bun:sqlite";

import { datetimeToISO8601, idsToBits } from "./utils";

export const findTables = (
	db: Database,
	search: {
		capacity: number;
		datetime: Date;
		restrictionIds: number[];
	},
): { restaurantId: number; tableIds: number[] }[] => {
	const { capacity, datetime, restrictionIds } = search;

	const query = db.query(`
        SELECT
            t.id,
            t.restaurant_id
        FROM
            tables t
            JOIN restaurants r ON t.restaurant_id = r.id
            LEFT JOIN reservations ON t.id = reservations.table_id
                AND reservations.datetime != $datetime
        WHERE
            reservations.id IS NULL
            AND t.capacity >= $capacity
            AND r.restrictions & $restrictions = $restrictions
        ORDER BY
            t.restaurant_id,
            -- this is on purpose to offer smaller tables first
            t.capacity ASC;
    `);

	const items = query.all({
		capacity,
		datetime: datetimeToISO8601(datetime),
		restrictions: idsToBits(restrictionIds),
	}) as { id: number; restaurant_id: number }[];

	return Object.entries(
		Object.groupBy(items, (item) => item.restaurant_id),
	).map(([keys, values]) => ({
		restaurantId: +keys,
		tableIds: values?.map((v) => v.id) ?? [],
	}));
};
