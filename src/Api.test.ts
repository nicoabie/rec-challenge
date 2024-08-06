import { describe, expect, test } from "bun:test";
import { Api } from "./Api";
import type { ReservationService } from "./ReservationService";
import { encodeAvailabilityToken } from "./utils";

const reservationService: Partial<ReservationService> = {};
const api = new Api(reservationService as ReservationService);

// in all the endpoints we have a loggedInDinerId: 1 in the headers
// ideally that should come in an authorization token or cookie but as auth is OOS.

describe("search", () => {
	const data = {
		// we have the amount of total diners (users of the app "friends" + people without a platform user)
		diners: 8,
		// dinerIds of platform users including loggedInDinerId
		dinerIds: [1, 2, 3, 4],
		// restrictions of people without a platform user
		extraRestrictionIds: [],
		// in UTC
		datetime: new Date(2027, 7, 3, 20, 0, 0),
	};

	test("returns 200 with a list of available restaurants for given constraints", async () => {
		const req = new Request("http://localhost/search", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.search = () => ({ 3: [1, 2] });

		const res = await api.search(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toMatchObject({
			restaurantIds: ["3"],
			availabilityToken: encodeAvailabilityToken({
				diners: data.diners,
				dinerIds: data.dinerIds,
				datetime: data.datetime,
				tables: { 3: [1, 2] },
			}),
		});
	});

	test("returns 404 if no restaurant found for given constraints", async () => {
		const req = new Request("http://localhost/search", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.search = () => ({});

		const res = await api.search(req);
		expect(res.status).toBe(404);
	});
});

describe("reserve", () => {
	const data = {
		// checking available tables can be an expensive operation so when the user first checks we encode all the restaurants with the
		// dietary restrictions, available tables for the amount of diners and datetime into a token.

		// when doing the actual resevation we will optimistically use any table for the given restaurant id to do the reservation.
		// in case it fails we will search again if any new table was made available.
		availabilityToken: btoa(
			JSON.stringify({
				diners: 2,
				dinerIds: [1, 2],
				datetime: new Date(2024, 7, 5, 20, 0, 0),
				tables: { 1: [1, 2], 2: [3, 4] },
			}),
		),
		restaurantId: 1,
	};

	test("returns 201 if reservation was created", async () => {
		const req = new Request("http://localhost/reserve", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.reserve = () => 3;

		const res = await api.reserve(req);
		const body = await res.json();
		expect(res.status).toBe(201);
		expect(body).toMatchObject({ reservationId: 3 });
	});

	test("returns 409 (conflict) if reservation was not created", async () => {
		const req = new Request("http://localhost/reserve", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.reserve = () => {
			throw new Error("NO_TABLE_AVAILABLE");
		};

		const res = await api.reserve(req);
		const body = await res.json();
		expect(res.status).toBe(409);
		expect(body).toMatchObject({ error: "NO_TABLE_AVAILABLE" });
	});
});

describe("cancel", () => {
	test("returns 204 if reservation was cancelled", async () => {
		const req = new Request("http://localhost/reservations/2", {
			method: "DELETE",
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.cancel = () => true;

		const res = await api.cancel(req);

		expect(res.status).toBe(204);
	});

	test("returns 404 if reservation was not cancelled", async () => {
		const req = new Request("http://localhost/reservations/2", {
			method: "DELETE",
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.cancel = () => false;

		const res = await api.cancel(req);

		expect(res.status).toBe(404);
	});

	// we could have another test to return 401 if the logged in diner is not part of the table they want to cancel
	// but that would involve another query to the db.
	// I think returning 404 in both cases is good enough
});
