export const check = (req: Request): Response => {
    return new Response("check!");
}

export const reserve = (req: Request): Response => {
    return new Response("reserve!");
}

export const cancel = (req: Request): Response => {
    return new Response("cancel!");
}