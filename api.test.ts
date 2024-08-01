import { describe, expect, test } from "bun:test";
import { cancel, reserve, search } from "./api";

// in all the endpoints we have a loggedInUserId: 1.
// ideally that should come in an authorization token or cookie but as auth is OOS, I put it in the body as any other prop.

describe("search", () => {
	test("returns list of available restaurants for given constraints", async () => {
		const data = {
			loggedInUserId: 1,
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
		});
		const res = await search(req).json();
		expect(res).toMatchObject({ restaurantIds: [2, 4], availabilityToken: "" });
	});
});

describe("reserve", () => {
	test("returns empty object", async () => {
		const data = {
			loggedInUserId: 1,
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
		});
		const res = await reserve(req).json();
		expect(res).toBeEmptyObject();
	});
});

describe("cancel", () => {
	test("returns empty object", async () => {
		const data = {
			loggedInUserId: 1,
			reservationId: 2,
		};
		const req = new Request("http://localhost/cancel", {
			method: "POST",
			body: JSON.stringify(data),
		});
		const res = await cancel(req).json();
		expect(res).toBeEmptyObject();
	});
});
