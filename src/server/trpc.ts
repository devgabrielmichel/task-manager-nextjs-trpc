import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";

const t = initTRPC.create({
  // Expose validation errors per field, so the frontend can show "Title is required"
  // next to the right input instead of a generic message.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
