import { describe, expect, test } from "bun:test";
import { Api } from "./Api";
import type { ReservationService } from "./ReservationService";

const reservationService: Partial<ReservationService> = {};
const api = new Api(reservationService as ReservationService);

// in all the endpoints we have a loggedInDinerId: 1 in the headers
// ideally that should come in an authorization token or cookie but as auth is OOS.

describe("search", () => {
	test("returns list of available restaurants for given constraints", async () => {
		const data = {
			// we have the amount of total diners (users of the app "friends" + people without a platform user)
			diners: 8,
			// userIds of platform users including loggedInUser
			userIds: [1, 2, 3, 4],
			// restrictions of people without a platform user
			extraRestrictions: [],
			// in UTC
			datetime: new Date(),
		};
		const req = new Request("http://localhost/search", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});
		const res = await api.search(req).json();
		expect(res).toMatchObject({ restaurantIds: [2, 4], availabilityToken: "" });
	});
});

describe("reserve", () => {
	test("returns empty object", async () => {
		const data = {
			// checking available tables can be an expensive operation so when the user first checks we encode all the restaurants with the
			// dietary restrictions, available tables for the amount of diners and datetime into a token.

			// when doing the actual resevation we will optimistically use any table for the given restaurant id to do the reservation.
			// in case it fails we will search again if any new table was made available.
			availabilityToken: "",
			restaurantId: 1,
		};
		const req = new Request("http://localhost/reserve", {
			method: "POST",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});
		const res = await api.reserve(req).json();
		expect(res).toBeEmptyObject();
	});
});

describe("cancel", () => {
	test("returns 204 if reservation was cancelled", async () => {
		const data = {
			reservationId: 2,
		};
		const req = new Request("http://localhost/cancel", {
			method: "DELETE",
			body: JSON.stringify(data),
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
		const data = {
			reservationId: 2,
		};
		const req = new Request("http://localhost/cancel", {
			method: "DELETE",
			body: JSON.stringify(data),
			headers: {
				loggedInDinerId: "1",
			},
		});

		//stub
		reservationService.cancel = () => false;

		const res = await api.cancel(req);

		expect(res.status).toBe(404);
	});
});
