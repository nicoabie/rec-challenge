import { Database } from "bun:sqlite";
import { beforeEach, describe, expect, test } from "bun:test";
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

	describe("findTables", () => {
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
				"1": [7],
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
				"1": [7],
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

	describe("deleteReservation", () => {
		test("cannot delete old reservation", () => {
			const result = repository.deleteReservation(1, 2);
			expect(result).toBeFalse();
		});

		test("can delete future reservation if part of the diners", () => {
			const result = repository.deleteReservation(2, 2);
			expect(result).toBeTrue();
		});

		test("cannot delete future reservation if not part of the diners", () => {
			// Gob was not invited
			const result = repository.deleteReservation(2, 4);
			expect(result).toBeFalse();
		});
	});

	describe("createReservation", () => {
		test("creates successfully a reservation at lardos taking the smallest table for 2", () => {
			const id = repository.createReservation({
				capacity: 2,
				datetime: new Date(2024, 7, 21),
				tableIds: [7, 5, 1],
			});

			expect(id).toBeInteger();

			const res = db
				.query("select table_id from reservations where id = ?")
				.get(id) as { table_id: number };

			expect(res.table_id).toBe(1);
		});

		test("creates successfully a reservation at lardos taking the smallest table for 4", () => {
			const id = repository.createReservation({
				capacity: 4,
				datetime: new Date(2024, 7, 21),
				tableIds: [7, 5, 1],
			});

			expect(id).toBeInteger();

			const res = db
				.query("select table_id from reservations where id = ?")
				.get(id) as { table_id: number };

			expect(res.table_id).toBe(5);
		});

		test("cannot create two reservation at the same time for 6 at lardos", () => {
			const first = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21),
				tableIds: [7],
			});

			expect(first).toBeInteger();

			const second = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21),
				tableIds: [7],
			});

			expect(second).toBeNull();
		});

		test("can create a second reservation 2 hours after", () => {
			const first = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 18, 0, 0),
				tableIds: [7],
			});

			expect(first).toBeInteger();

			const second = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 20, 0, 0),
				tableIds: [7],
			});

			expect(second).toBeInteger();
		});

		test("can create a second reservation 2 hours before", () => {
			const first = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 18, 0, 0),
				tableIds: [7],
			});

			expect(first).toBeInteger();

			const second = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 16, 0, 0),
				tableIds: [7],
			});

			expect(second).toBeInteger();
		});

		test("cannot create a second reservation 1 second before 2 hours after", () => {
			const first = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 18, 0, 0),
				tableIds: [7],
			});

			expect(first).toBeInteger();

			const second = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 19, 59, 59),
				tableIds: [7],
			});

			expect(second).toBeNull();
		});

		test("cannot create a second reservation 1 second after 2 hours before", () => {
			const first = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 18, 0, 0),
				tableIds: [7],
			});

			expect(first).toBeInteger();

			const second = repository.createReservation({
				capacity: 6,
				datetime: new Date(2024, 7, 21, 16, 0, 1),
				tableIds: [7],
			});

			expect(second).toBeNull();
		});
	});
});
