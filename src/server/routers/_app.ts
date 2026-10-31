import { router } from "../trpc";
import { taskRouter } from "./task";

export const appRouter = router({
  task: taskRouter,
});

// Only the type is shared with the client, never the server code itself.
export type AppRouter = typeof appRouter;
