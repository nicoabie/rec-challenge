import { Database } from "bun:sqlite";
import {
	afterAll,
	beforeAll,
	describe,
	expect,
	mock,
	setSystemTime,
	test,
} from "bun:test";
import type { Repository } from "./Repository";
import { ReservationService } from "./ReservationService";

const repository: Partial<Repository> = {};
const db = new Database(":memory:", { strict: true });
const reservationService = new ReservationService(repository as Repository, db);

beforeAll(() => {
	// very cool, I don't remember node having this out of the box
	setSystemTime(new Date("2024-08-08T00:00:00.000Z"));
});

afterAll(() => {
	// very important to reset this because it is set globally and not for this single file
	// it would be very nice if bun did that automatically created an issue for that https://github.com/oven-sh/bun/issues/13173
	setSystemTime();
});

describe("search", () => {
	test("throws if date is before than system time", () => {
		expect(() => {
			reservationService.search({
				diners: 2,
				dinerIds: [1],
				extraRestrictionIds: [2],
				datetime: new Date(2024, 7, 7, 20, 0, 0),
			});
		}).toThrowError("DATE_SHOULD_BE_IN_THE_FUTURE");
	});

	test("throws if there are diners with already a reservation", () => {
		repository.findDinerIdsWithReservationsAtDatetime = () => [1];

		expect(() => {
			reservationService.search({
				diners: 2,
				dinerIds: [1],
				extraRestrictionIds: [2],
				datetime: new Date(2024, 7, 8, 20, 0, 0),
			});
		}).toThrowError("THERE_ARE_DINERS_WITH_A_RESERVATION_ALREADY");
	});

	test("calls findTables with diners restriction ids + extra resctrictions ids", () => {
		// stub
		repository.findDinersRestrictionIds = () => [3];
		repository.findDinerIdsWithReservationsAtDatetime = () => [];

		repository.findTables = mock(() => ({}));

		const datetime = new Date(2024, 7, 8, 20, 0, 0);
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
	test("throws if date is before than system time", () => {
		expect(() => {
			reservationService.reserve({
				restaurantId: 1,
				diners: 2,
				dinerIds: [1],
				datetime: new Date(2024, 7, 7, 20, 0, 0),
				tables: { 1: [1, 2] },
			});
		}).toThrowError("DATE_SHOULD_BE_IN_THE_FUTURE");
	});

	test("reservation gets created optimistically", () => {
		repository.createReservation = mock(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({}));

		reservationService.reserve({
			restaurantId: 1,
			diners: 2,
			dinerIds: [1],
			datetime: new Date(),
			tables: { 1: [1, 2] },
		});

		expect(repository.createReservation).toHaveBeenCalledTimes(1);
		expect(repository.createReservationDiners).toHaveBeenCalledTimes(1);
		expect(repository.findTables).not.toHaveBeenCalled();
	});

	test("reservation gets created not optimistically", () => {
		repository.createReservation = mock<() => number | null>()
			.mockImplementationOnce(() => null)
			.mockImplementationOnce(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({ 1: [3, 4] }));

		reservationService.reserve({
			restaurantId: 1,
			diners: 2,
			dinerIds: [1],
			datetime: new Date(),
			tables: { 1: [1, 2] },
		});

		expect(repository.createReservation).toHaveBeenCalledTimes(2);
		expect(repository.createReservationDiners).toHaveBeenCalledTimes(1);
		expect(repository.findTables).toHaveBeenCalled();
	});

	test("reservation does not get created", () => {
		repository.createReservation = mock<() => number | null>()
			.mockImplementationOnce(() => null)
			.mockImplementationOnce(() => null);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({ 1: [3, 4] }));

		expect(() => {
			reservationService.reserve({
				restaurantId: 1,
				diners: 2,
				dinerIds: [1],
				datetime: new Date(),
				tables: { 1: [1, 2] },
			});
		}).toThrowError("NO_TABLE_AVAILABLE");

		expect(repository.createReservation).toHaveBeenCalledTimes(2);
		expect(repository.createReservationDiners).not.toHaveBeenCalled();
	});

	test("reservation gets partially created", () => {
		repository.createReservation = mock(() => 1);
		repository.createReservationDiners = mock(() => 1);
		repository.findTables = mock(() => ({ 1: [3, 4] }));
		repository.forceDeleteReservation = mock(() => true);

		expect(() => {
			reservationService.reserve({
				restaurantId: 1,
				diners: 2,
				dinerIds: [1, 2],
				datetime: new Date(),
				tables: { 1: [1, 2] },
			});
		}).toThrowError("NOT_ALL_DINERS_AVAILABLE");

		expect(repository.forceDeleteReservation).toHaveBeenCalled();
	});
});
