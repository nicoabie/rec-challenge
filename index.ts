import { cancel, reserve, search } from "./api";

const server = Bun.serve({
	port: 3000,
	fetch(req) {
		const url = new URL(req.url);
		// search could be a GET because we are not modifying anything on the system, just querying information.
		// but we need to send a body with amount of diners, ids of friends and extra dietary restrictions for unregistered users
		// and it would be messy to encode that in the query string
		// funny fact: http standard support bodies in GET but we don't want to get too crazy
		if (url.pathname === "/search" && req.method === "POST") return search(req);
		if (url.pathname === "/reserve" && req.method === "POST")
			return reserve(req);
		if (url.pathname === "/cancel" && req.method === "POST") return cancel(req);
		return new Response("404!");
	},
});

console.log(`Listening on localhost:${server.port}`);
