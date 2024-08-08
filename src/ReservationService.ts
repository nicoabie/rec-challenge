import type { Database } from "bun:sqlite";
import { isBefore } from "date-fns";
import type { Repository } from "./Repository";

const NO_TABLE_AVAILABLE = "NO_TABLE_AVAILABLE";
const NOT_ALL_DINERS_AVAILABLE = "NOT_ALL_DINERS_AVAILABLE";
const DATE_SHOULD_BE_IN_THE_FUTURE = "DATE_SHOULD_BE_IN_THE_FUTURE";

// this service throws exceptions to flag business requirements not being met.
// I did that because most people are used to exceptions.
// Personally I prefer error as values ie using either monad but js does not support that natively and I would have to add a library for that.
// and let exceptions to flag unrecoverable scenarios -> something that will end in a 5xx status code

export class ReservationService {
	private repository: Repository;
	private db: Database;

	constructor(repository: Repository, db: Database) {
		this.repository = repository;
		this.db = db;
	}

	search(query: {
		diners: number;
		dinerIds: number[];
		extraRestrictionIds: number[];
		datetime: Date;
	}): Record<string, number[]> {
		const { diners, dinerIds, extraRestrictionIds, datetime } = query;

		if (isBefore(datetime, new Date())) {
			throw new Error(DATE_SHOULD_BE_IN_THE_FUTURE);
		}

		const dinersRestrictionIds = this.repository.findDinersRestrictionIds(
			this.db,
			dinerIds,
		);
		const restrictionIds = [
			...new Set(dinersRestrictionIds.concat(extraRestrictionIds)),
		];

		return this.repository.findTables(this.db, {
			capacity: diners,
			datetime,
			restrictionIds,
		});
	}

	reserve(details: {
		restaurantId: number;
		diners: number;
		dinerIds: number[];
		datetime: Date;
		tables: Record<string, number[]>;
	}): number {
		const { restaurantId, diners, dinerIds, datetime, tables } = details;

		if (isBefore(datetime, new Date())) {
			throw new Error(DATE_SHOULD_BE_IN_THE_FUTURE);
		}

		// about how this method is implemented:
		// the sqlite driver for bun is synchronous and If I were to only have one instance of the server that would make it possible to first check
		// if the reservation can be created then just create it because there would be no concurrency. There would be no chance of a change between the check and the creation.
		// I decided not to do it that way because it would be a trick that won't scale in real world scenarios. most drivers are async in real life and one tends to have more than one instance.
		// Furthermore the only way to fix that would be using serializable isolation of transactions that would create a bottleneck.

		// we wrap inside a transaction in case there is an issue between the creation of the reservation and the reservation diners.
		return this.db.transaction(() => {
			// we optimistically try to create a reservation with the result from search
			let reservationId = this.repository.createReservation(this.db, {
				tableIds: tables[restaurantId],
				capacity: diners,
				datetime,
			});
			if (!reservationId) {
				// we search again to see if a table got available between we first searched and decided to reserve
				const newTables = this.repository.findTables(this.db, {
					capacity: diners,
					datetime,
					restaurantId,
				});

				// do we have tables?
				if (Object.keys(newTables).length) {
					reservationId = this.repository.createReservation(this.db, {
						tableIds: newTables[restaurantId],
						capacity: diners,
						datetime,
					});
				}

				if (!reservationId) {
					throw new Error(NO_TABLE_AVAILABLE);
				}
			}

			const createdDiners = this.repository.createReservationDiners(this.db, {
				reservationId,
				dinerIds,
				datetime,
			});

			if (createdDiners !== dinerIds.length) {
				// some diners had a conflicting reservation, cancelling...
				const deleted = this.repository.forceDeleteReservation(
					this.db,
					reservationId,
				);
				if (!deleted) {
					// if for some reason the deletion failed we would log this event
				}
				throw new Error(NOT_ALL_DINERS_AVAILABLE);
			}

			return reservationId;
		})();
	}

	cancel(reservationId: number, dinerId: number) {
		return this.repository.deleteReservation(this.db, {
			reservationId,
			dinerId,
		});
	}
}
