export class Api {

	search = (req: Request): Response => {
		const data = { restaurantIds: [2, 4], availabilityToken: "" };
		return new Response(JSON.stringify(data));
	};
	
	reserve = (req: Request): Response => {
		return new Response("{}");
	};
	
	cancel = (req: Request): Response => {
		return new Response("{}");
	};
	
}

