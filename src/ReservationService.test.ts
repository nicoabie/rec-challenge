import { Database } from "bun:sqlite";
import { describe, expect, test, mock } from "bun:test";
import type { Repository } from "./Repository";
import { ReservationService } from "./ReservationService";

const repository: Partial<Repository> = {};
const db = new Database(":memory:", { strict: true });
const reservationService = new ReservationService(repository as Repository, db);

describe("search", () => {
	test("calls findTables with diners restriction ids + extra resctrictions ids ", () => {
		// stub
		repository.findDinersRestrictionIds = () => [3];

		repository.findTables = mock(() => ({}));

		const datetime = new Date();
		reservationService.search({
			diners: 2,
			dinerIds: [1],
			extraRestrictionIds: [2],
			datetime,
		});

		expect(repository.findTables).toHaveBeenCalledWith(db, {
			capacity: 2,
			datetime,
			restrictionIds: [3, 2],
		});
	});
});

describe("reserve", () => {
	test("reservation gets created optimistically", () => {
		repository.createReservation = mock(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({}));

		reservationService.reserve(1, {
			restaurantId: 1,
			diners: 2,
			dinerIds: [1],
			datetime: new Date(),
			tables: {1: [1, 2]}
		});

		expect(repository.createReservation).toHaveBeenCalledTimes(1)
		expect(repository.createReservationDiners).toHaveBeenCalledTimes(1)
		expect(repository.findTables).not.toHaveBeenCalled();
	});

	test("reservation gets created not optimistically", () => {
		repository.createReservation = mock<() => number | null>().mockImplementationOnce(() => null).mockImplementationOnce(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({1: [3, 4]}));

		reservationService.reserve(1, {
			restaurantId: 1,
			diners: 2,
			dinerIds: [1],
			datetime: new Date(),
			tables: {1: [1, 2]}
		});

		expect(repository.createReservation).toHaveBeenCalledTimes(2)
		expect(repository.createReservationDiners).toHaveBeenCalledTimes(1)
		expect(repository.findTables).toHaveBeenCalled();
	});

	test("reservation does not get created", () => {
		repository.createReservation = mock<() => number | null>().mockImplementationOnce(() => null).mockImplementationOnce(() => null);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({1: [3, 4]}));

		expect(() => {
			reservationService.reserve(1, {
				restaurantId: 1,
				diners: 2,
				dinerIds: [1],
				datetime: new Date(),
				tables: {1: [1, 2]}
			});
		}).toThrowError("NO_TABLE_AVAILABLE");

		expect(repository.createReservation).toHaveBeenCalledTimes(2)
		expect(repository.createReservationDiners).not.toHaveBeenCalled()
	});

	test("reservation gets partially created", () => {
		repository.createReservation = mock(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({1: [3, 4]}));
		repository.deleteReservation = mock(() => true);

		expect(() => {
			reservationService.reserve(1, {
				restaurantId: 1,
				diners: 2,
				dinerIds: [1, 2],
				datetime: new Date(),
				tables: {1: [1, 2]}
			});
		}).toThrowError("NOT_ALL_DINERS_AVAILABLE");

		
		expect(repository.deleteReservation).toHaveBeenCalled()
	});
});
