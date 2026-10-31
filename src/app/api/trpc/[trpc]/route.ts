import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";

// Exposes every tRPC procedure under /api/trpc/* (e.g. /api/trpc/task.list).
function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
}

export { handler as GET, handler as POST };
