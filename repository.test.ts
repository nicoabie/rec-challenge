import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { findTables } from "./repository";

const db = new Database("db.sqlite", { strict: true });

describe("findTables", () => {
	test("retrieves data", () => {
		const result = findTables(db, {
			capacity: 6,
			datetime: new Date(2007, 0, 1, 10, 0, 0),
			restrictions: [1],
		});
		expect(result).toMatchObject([
			{
				restaurantId: 1,
				tableIds: [7],
			},
			{
				restaurantId: 3,
				tableIds: [19],
			},
		]);
	});
});
