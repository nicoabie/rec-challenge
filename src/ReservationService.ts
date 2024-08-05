import type { Repository } from "./Repository";

const NO_TABLE_AVAILABLE = "NO_TABLE_AVAILABLE";
const NO_ALL_DINERS_AVAILABLE = "NO_ALL_DINERS_AVAILABLE";

export class ReservationService {
	private repository: Repository;

	constructor(repository: Repository) {
		this.repository = repository;
	}

	search = () => {
		this.repository.findTables({
			capacity: 6,
			datetime: new Date(),
			restrictionIds: [],
		});
	};

	reserve = (
		dinerId: number,
		details: {
			restaurantId: number;
			diners: number;
			dinerIds: number[];
			datetime: Date;
			tables: Record<string, number[]>;
		},
	) => {
		const { restaurantId, diners, dinerIds, datetime, tables } = details;
		// we optimistically try to create a reservation with the result from search
		let reservationId = this.repository.createReservation({
			tableIds: tables[restaurantId],
			capacity: diners,
			datetime,
		});
		if (!reservationId) {
			// we search again to see if a table got available
			const newTables = this.repository.findTables({
				capacity: diners,
				datetime,
				restaurantId,
			});

			reservationId = this.repository.createReservation({
				tableIds: newTables[restaurantId],
				capacity: diners,
				datetime,
			});

			if (!reservationId) {
				throw new Error(NO_TABLE_AVAILABLE);
			}
		}

		const createdDiners = this.repository.createResevationDiners({
			reservationId,
			dinerIds,
			datetime,
		});

		if (createdDiners !== dinerIds.length) {
			// some diners had a conflicting reservation, cancelling...
			this.repository.deleteReservation(reservationId, dinerId);
			throw new Error(NO_ALL_DINERS_AVAILABLE);
		}
	};

	cancel = (reservationId: number, dinerId: number) => {
		return this.repository.deleteReservation(reservationId, dinerId);
	};
}
