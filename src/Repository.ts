import type { Database } from "bun:sqlite";
import { addHours } from "date-fns/addHours";

import { addSeconds } from "date-fns/addSeconds";
import { bitsToIds, datetimeToISO8601, idsToBits } from "./utils";

export class Repository {
	findTables(
		db: Database,
		search: {
			capacity: number;
			datetime: Date;
			restrictionIds?: number[];
			restaurantId?: number;
		},
	): Record<string, number[]> {
		// this method can be used either specifying restrictionIds when doing the search
		// OR specifying a restaurantId if when optimistically trying to create a reservation it couldn't
		// and we need to search for more tables
		const { capacity, datetime, restrictionIds, restaurantId } = search;

		const query = db.query(`
			SELECT
				t.id,
				t.restaurant_id
			FROM
				tables t
				JOIN restaurants r ON t.restaurant_id = r.id
				LEFT JOIN reservations ON t.id = reservations.table_id
					AND reservations.datetime BETWEEN $minDatetime AND $maxDatetime
			WHERE
				reservations.id IS NULL
				AND t.capacity >= $capacity
				${restrictionIds ? "AND r.restrictions & $restrictions = $restrictions" : ""}
				${restaurantId ? "AND r.id = $restaurantId" : ""}
			ORDER BY t.restaurant_id
		`);

		const items = query.all({
			capacity,
			minDatetime: datetimeToISO8601(addSeconds(addHours(datetime, -2), 1)),
			maxDatetime: datetimeToISO8601(addSeconds(addHours(datetime, 2), -1)),
			...(restrictionIds && { restrictions: idsToBits(restrictionIds) }),
			...(restaurantId && { restaurantId }),
		}) as { id: number; restaurant_id: number }[];

		return Object.fromEntries(
			Object.entries(Object.groupBy(items, (item) => item.restaurant_id)).map(
				([keys, values]) => [keys, values?.map((v) => v.id) ?? []],
			),
		);
	}

	deleteReservation(
		db: Database,
		info: { reservationId: number; dinerId: number },
	): boolean {
		// we could implement soft deletes with a deletedAt column but I believe for the context of the problem
		// it makes more sense to hard delete. maintaining cancelled reservations adds no value and makes searching and reservation harder
		const query = db.query(`
			DELETE FROM reservations 
			WHERE id IN (
				SELECT dr.reservation_id FROM diners_reservations dr 
				WHERE
					dr.reservation_id = $reservationId
					-- all attendees in the platform can delete the reservation
					AND dr.diner_id = $dinerId
					-- we won't allow cancelling passed reservations
					AND dr.datetime > datetime('now')
				)
		`);

		const { reservationId, dinerId } = info;
		const result = query.run({
			reservationId,
			dinerId,
		});

		return !!result.changes;
	}

	createReservation(
		db: Database,
		info: {
			tableIds: number[];
			capacity: number;
			datetime: Date;
		},
	): number | null {
		const { tableIds, capacity, datetime } = info;

		const query = db.query(`
			INSERT INTO reservations (restaurant_id, table_id, capacity, datetime) 
			SELECT t.restaurant_id, t.id, $capacity, $datetime FROM tables t 
				LEFT JOIN reservations ON t.id = reservations.table_id
				AND reservations.datetime BETWEEN $minDatetime AND $maxDatetime
			WHERE 
				reservations.id IS NULL
				-- seems bun does not have a way to do this yet or documentation does not mention it
				-- this is dangerous and could be sql injected
				AND t.id IN (${tableIds})
				-- the tablesIds should only contain tables with the specified capacity be cause they came from a previous search
				-- but it is not bad to make sure
				AND t.capacity >= $capacity
			-- this is on purpose to offer smaller tables first
			ORDER BY t.capacity ASC
			LIMIT 1; 
		`);

		const result = query.run({
			datetime: datetimeToISO8601(datetime),
			capacity,
			minDatetime: datetimeToISO8601(addSeconds(addHours(datetime, -2), 1)),
			maxDatetime: datetimeToISO8601(addSeconds(addHours(datetime, 2), -1)),
		});

		if (result.changes) {
			return result.lastInsertRowid as number;
		}
		return null;
	}

	createReservationDiners(
		db: Database,
		info: {
			reservationId: number;
			dinerIds: number[];
			datetime: Date;
		},
	) {
		const { reservationId, dinerIds, datetime } = info;

		const query = db.query(`
			INSERT INTO diners_reservations (diner_id, reservation_id, datetime) 
			SELECT d.id, $reservationId, $datetime FROM diners d 
				LEFT JOIN diners_reservations ON d.id = diners_reservations.diner_id
				AND diners_reservations.datetime BETWEEN $minDatetime AND $maxDatetime
			WHERE 
				diners_reservations.id IS NULL
				-- seems bun does not have a way to do this yet or documentation does not mention it
				-- this is dangerous and could be sql injected
				AND d.id IN (${dinerIds})
		`);

		const result = query.run({
			reservationId,
			datetime: datetimeToISO8601(datetime),
			minDatetime: datetimeToISO8601(addSeconds(addHours(datetime, -2), 1)),
			maxDatetime: datetimeToISO8601(addSeconds(addHours(datetime, 2), -1)),
		});

		return result.changes;
	}

	findDinersRestrictionIds(db: Database, dinerIds: number[]): number[] {
		const query = db.query(`
			SELECT d.restrictions FROM diners d 
			WHERE 
				-- seems bun does not have a way to do this yet or documentation does not mention it
				-- this is dangerous and could be sql injected
				d.id IN (${dinerIds})
		`);

		return (query.all() as { restrictions: number }[]).flatMap((i) =>
			bitsToIds(i.restrictions),
		);
	}
}
