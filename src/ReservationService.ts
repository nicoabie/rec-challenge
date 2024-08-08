import type { Database } from "bun:sqlite";
import type { Repository } from "./Repository";

const NO_TABLE_AVAILABLE = "NO_TABLE_AVAILABLE";
const NO_ALL_DINERS_AVAILABLE = "NO_ALL_DINERS_AVAILABLE";

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

	reserve(
		dinerId: number,
		details: {
			restaurantId: number;
			diners: number;
			dinerIds: number[];
			datetime: Date;
			tables: Record<string, number[]>;
		},
	): number {
		const { restaurantId, diners, dinerIds, datetime, tables } = details;

		// we optimistically try to create a reservation with the result from search
		let reservationId = this.repository.createReservation(this.db, {
			tableIds: tables[restaurantId],
			capacity: diners,
			datetime,
		});
		if (!reservationId) {
			// we search again to see if a table got available
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

		const createdDiners = this.repository.createResevationDiners(this.db, {
			reservationId,
			dinerIds,
			datetime,
		});

		if (createdDiners !== dinerIds.length) {
			// some diners had a conflicting reservation, cancelling...
			this.repository.deleteReservation(this.db, { reservationId, dinerId });
			throw new Error(NO_ALL_DINERS_AVAILABLE);
		}

		return reservationId;
	}

	cancel(reservationId: number, dinerId: number) {
		return this.repository.deleteReservation(this.db, {
			reservationId,
			dinerId,
		});
	}
}
