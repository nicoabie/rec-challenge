import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { Repository } from "./Repository";

const db = new Database("db.sqlite", { strict: true });
const repository = new Repository(db);

describe("findTables", () => {
	test("retrieves data", () => {
		const result = repository.findTables({
			capacity: 6,
			datetime: new Date(2024, 7, 1, 22, 0, 0),
			restrictionIds: [1],
		});
		expect(result).toMatchObject({
			"1": [7],
			"3": [19],
		});
	});
});
