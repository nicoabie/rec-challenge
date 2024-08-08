import { Database } from "bun:sqlite";

import { Api } from "./src/Api";
import { Repository } from "./src/Repository";
import { ReservationService } from "./src/ReservationService";

// there are fancier ways to do this using DI or factories.
// this is very easy to understand and we don't want overly complex solutions
const db = new Database("db.sqlite", { strict: true });
const repository = new Repository();
const reservationService = new ReservationService(repository, db);
const api = new Api(reservationService);

const server = Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		// search could be a GET because we are not modifying anything on the system, just querying information.
		// but we need to send a body with amount of diners, ids of friends and extra dietary restrictions for unregistered users
		// and it would be messy to encode that in the query string
		// funny fact: http standard support bodies in GET but we don't want to get too crazy
		if (url.pathname === "/search" && req.method === "POST")
			return api.search(req);
		if (url.pathname === "/reservations" && req.method === "POST")
			return api.reserve(req);
		if (url.pathname.startsWith("/reservations/") && req.method === "DELETE")
			return api.cancel(req);
		return new Response("404!");
	},
});

console.log(`Listening on localhost:${server.port}`);
