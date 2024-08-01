export const check = (req: Request): Response => {
	const data = { restaurantIds: [2, 4], availabilityToken: "" };
	return new Response(JSON.stringify(data));
};

export const reserve = (req: Request): Response => {
	return new Response("{}");
};

export const cancel = (req: Request): Response => {
	return new Response("{}");
};
