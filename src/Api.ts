import type { ReservationService } from "./ReservationService";
import { encodeAvailabilityToken } from "./utils";

export class Api {
	private reservationService: ReservationService;

	constructor(reservationService: ReservationService) {
		this.reservationService = reservationService;
	}

	search = async (req: Request): Promise<Response> => {
		const { diners, dinerIds, extraRestrictionIds, datetime } =
			await req.json();
		// validate input
		const tables = this.reservationService.search({
			diners,
			dinerIds,
			extraRestrictionIds,
			datetime,
		});
		const restaurantIds = Object.keys(tables);
		if (restaurantIds.length) {
			const availabilityToken = encodeAvailabilityToken({
				diners,
				dinerIds,
				datetime,
				tables,
			});
			const data = { restaurantIds, availabilityToken };
			return new Response(JSON.stringify(data));
		}
		return new Response(null, { status: 404 });
	};

	reserve = async (req: Request): Promise<Response> => {
		const dinerId = +(req.headers.get("loggedInDinerId") ?? 0) as number;
		const { restaurantId, availabilityToken } = await req.json();
		const { diners, dinerIds, datetime, tables } = JSON.parse(
			atob(availabilityToken),
		);
		// TODO validate inputs
		try {
			const reservationId = this.reservationService.reserve(dinerId, {
				restaurantId,
				diners,
				dinerIds,
				datetime,
				tables,
			});
			return new Response(JSON.stringify({ reservationId }), { status: 201 });
		} catch (error) {
			return new Response(JSON.stringify({ error: (error as Error).message }), {
				status: 409,
			});
		}
	};

	cancel = async (req: Request): Promise<Response> => {
		const dinerId = +(req.headers.get("loggedInDinerId") ?? 0) as number;
		const { reservationId } = await req.json();
		// TODO validate restaurantId and dinerId exist and are numbers
		const wasCancelled = this.reservationService.cancel(reservationId, dinerId);

		if (wasCancelled) {
			return new Response(null, { status: 204 });
		}
		return new Response(null, { status: 404 });
	};
}
