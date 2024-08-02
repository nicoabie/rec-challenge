import { describe, expect, test } from "bun:test";

import { datetimeToISO8601, idsToBits } from "./utils";

describe("datetimeToISO8601", () => {
	// ideally we should create more tests, we could use something like https://github.com/dubzzz/fast-check to generate many test cases
	test("serializes correctly", () => {
		// months in ecmascript starts from zero :P
		const date = new Date(2024, 7, 1, 20, 0, 0);
		expect(datetimeToISO8601(date)).toBe("2024-08-01 20:00:00");
	});
});

describe("idsToBits", () => {
	// ideally we should create more tests, we could use something like https://github.com/dubzzz/fast-check to generate many test cases
	test("serializes correctly zero ids", () => {
		expect(idsToBits([])).toBe(0);
	});

	test("serializes correctly 1 id", () => {
		expect(idsToBits([1])).toBe(1);
	});

	test("serializes correctly 2 ids", () => {
		expect(idsToBits([1, 3])).toBe(5);
	});
});
