import type { ReservationService } from "./ReservationService";

export class Api {
	private reservationService: ReservationService;

	constructor(reservationService: ReservationService) {
		this.reservationService = reservationService;
	}

	search = (req: Request): Response => {
		const data = { restaurantIds: [2, 4], availabilityToken: "" };
		return new Response(JSON.stringify(data));
	};

	reserve = async (req: Request): Promise<Response> => {
		const dinerId = +(req.headers.get("loggedInDinerId") ?? 0) as number;
		const { restaurantId, availabilityToken } = await req.json();
		const { diners, dinerIds, datetime, tables } = JSON.parse(
			atob(availabilityToken),
		);
		// TODO validate inputs
		try {
			const reservation = this.reservationService.reserve(dinerId, {
				restaurantId,
				diners,
				dinerIds,
				datetime,
				tables,
			});
			return new Response(JSON.stringify(reservation), { status: 201 });
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
