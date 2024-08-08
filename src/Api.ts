import { z } from "zod";
import type { ReservationService } from "./ReservationService";
import { encodeAvailabilityToken } from "./utils";

const INVALID_RESTAURANT_ID = "INVALID_RESTAURANT_ID";

const IdSchema = z.coerce.number().positive();

const SearchRequestSchema = z.object({
	diners: z.number().positive(),
	dinerIds: z.number().array().nonempty(),
	extraRestrictionIds: z.number().array(),
	datetime: z.coerce.date(),
});

const AvailabilityTokenSchema = z.preprocess(
	(val) => JSON.parse(atob(val as string)),
	z.object({
		diners: z.number().positive(),
		dinerIds: z.number().array().nonempty(),
		datetime: z.coerce.date(),
		tables: z.record(z.string(), z.number().array().nonempty()),
	}),
);

const ReserveRequestSchema = z.object({
	restaurantId: IdSchema,
	availabilityToken: AvailabilityTokenSchema,
});

export class Api {
	private reservationService: ReservationService;

	constructor(reservationService: ReservationService) {
		this.reservationService = reservationService;
	}

	async search(req: Request): Promise<Response> {
		const { success, data, error } = SearchRequestSchema.safeParse(
			await req.json(),
		);

		if (!success) {
			return new Response(JSON.stringify(error), { status: 400 });
		}

		const { diners, dinerIds, extraRestrictionIds, datetime } = data;

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
	}

	async reserve(req: Request): Promise<Response> {
		const dinerId = IdSchema.parse(req.headers.get("loggedInDinerId"));
		const { success, data, error } = ReserveRequestSchema.safeParse(
			await req.json(),
		);

		if (!success) {
			return new Response(JSON.stringify(error), { status: 400 });
		}

		const {
			restaurantId,
			availabilityToken: { diners, dinerIds, datetime, tables },
		} = data;

		if (!tables[restaurantId]) {
			return new Response(JSON.stringify({ INVALID_RESTAURANT_ID }), {
				status: 400,
			});
		}

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
	}

	async cancel(req: Request): Promise<Response> {
		const { pathname } = new URL(req.url);
		const reservationId = IdSchema.parse(
			pathname.match(/\/reservations\/(\d+)/)?.[1],
		);
		const dinerId = IdSchema.parse(req.headers.get("loggedInDinerId"));

		const wasCancelled = this.reservationService.cancel(reservationId, dinerId);

		if (wasCancelled) {
			return new Response(null, { status: 204 });
		}
		return new Response(null, { status: 404 });
	}
}
