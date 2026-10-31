import { createCallerFactory } from "@/server/trpc";
import { appRouter } from "@/server/routers/_app";

// Used by server components: calls the procedures directly, without an HTTP round trip.
export const api = createCallerFactory(appRouter)({});
