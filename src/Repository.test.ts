import { Database } from "bun:sqlite";
import { describe, expect, test, beforeEach } from "bun:test";
import { Repository } from "./Repository";

let db: Database;
let repository: Repository;

describe("repository", async () => {
	const schemaFile = Bun.file("./schema.sql");
	const schemaText = await schemaFile.text();
	const scenariosFile = Bun.file("./tests/db/scenarios.sql");
	const scenariosText = await scenariosFile.text();

	beforeEach(() => {
		db = new Database(":memory:", { strict: true });
		// TODO: remove passing db to repository
		repository = new Repository(db);
		db.run(schemaText);
		db.run(scenariosText);
	});

	describe("findTables", async () => {
		test("no tables for 8 diners", () => {
			const result = repository.findTables({
				capacity: 8,
				// this could be any date in the future
				datetime: new Date(),
				restrictionIds: [],
			});
			expect(result).toBeEmptyObject();
		});

		test("no tables if diner has all restrictions :S", () => {
			const result = repository.findTables({
				capacity: 1,
				// this could be any date in the future
				datetime: new Date(),
				restrictionIds: [1, 2, 3, 4],
			});
			expect(result).toBeEmptyObject();
		});

		test("only restaurant to accept Paleo (Tetetlán)", () => {
			const result = repository.findTables({
				capacity: 1,
				// this could be any date in the future
				datetime: new Date(),
				restrictionIds: [3],
			});
			expect(result).toEqual({
				"3": [13, 14, 15, 16, 17, 18, 19],
			});
		});

		test("only restaurant to accept Paleo (Tetetlán) just one table for 6", () => {
			const result = repository.findTables({
				capacity: 6,
				// this could be any date in the future
				datetime: new Date(),
				restrictionIds: [3],
			});
			expect(result).toEqual({
				"3": [19],
			});
		});

		test("george michael and lucile have a reservation with other 4 (incognitos) at lardo no more 6 tables available", () => {
			const result = repository.findTables({
				capacity: 6,
				datetime: new Date(2024, 7, 5, 20, 0, 0),
				restaurantId: 1,
			});
			expect(result).toBeEmptyObject();
		});

		test("the table for 6 at lardo is available 2hs before of george michael and lucile reservation", () => {
			const result = repository.findTables({
				capacity: 6,
				datetime: new Date(2024, 7, 5, 18, 0, 0),
				restaurantId: 1,
			});
			expect(result).toEqual({
				"1": [ 7 ],
			});
		});

		test("the table for 6 at lardo is not available 1 second after 2hs before of george michael and lucile reservation", () => {
			const result = repository.findTables({
				capacity: 6,
				datetime: new Date(2024, 7, 5, 18, 0, 1),
				restaurantId: 1,
			});
			expect(result).toBeEmptyObject();
		});

		test("the table for 6 at lardo is available 2hs after of george michael and lucile reservation", () => {
			const result = repository.findTables({
				capacity: 6,
				datetime: new Date(2024, 7, 5, 22, 0, 0),
				restaurantId: 1,
			});
			expect(result).toEqual({
				"1": [ 7 ],
			});
		});

		test("the table for 6 at lardo is not available 1 second before 2hs after of george michael and lucile reservation", () => {
			const result = repository.findTables({
				capacity: 6,
				datetime: new Date(2024, 7, 5, 21, 59, 59),
				restaurantId: 1,
			});
			expect(result).toBeEmptyObject();
		});
	});
});
