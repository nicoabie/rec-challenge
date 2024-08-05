import { describe, expect, spyOn, test } from "bun:test";
import type { Repository } from "./Repository";
import { ReservationService } from "./ReservationService";

const repository: Partial<Repository> = {};
const reservationService = new ReservationService(repository as Repository);

describe("search", () => {
	test("does the search", () => {
		// @ts-ignore we do not care about function signature, just creating it to be spied upon
		repository.findTables = () => {};
		const spy = spyOn(repository, "findTables");
		reservationService.search();
		expect(spy).toHaveBeenCalled();
	});
});
