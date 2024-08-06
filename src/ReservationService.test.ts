import { describe, expect, spyOn, test } from "bun:test";
import type { Repository } from "./Repository";
import { ReservationService } from "./ReservationService";

const repository: Partial<Repository> = {};
const reservationService = new ReservationService(repository as Repository);

describe("search", () => {
	test("calls findTables with diners restriction ids + extra resctrictions ids ", () => {
		// stub
		repository.findDinersRestrictionIds = () => [3];

		repository.findTables = () => ({});
		const spy = spyOn(repository, "findTables");

		const datetime = new Date();
		reservationService.search({
			diners: 2,
			dinerIds: [1],
			extraRestrictionIds: [2],
			datetime,
		});

		expect(spy).toHaveBeenCalledWith({
			capacity: 2,
			datetime,
			restrictionIds: [3, 2],
		});
	});
});
