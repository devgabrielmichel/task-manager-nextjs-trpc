import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { taskStore, type Task } from "../taskStore";

const titulo = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(120, "Title must have at most 120 characters");

// An empty description is stored as "no description".
const descricao = z
  .string()
  .trim()
  .max(1000, "Description must have at most 1000 characters")
  .optional()
  .transform((value) => value || undefined);

const taskId = z.string().min(1);

function findTaskOrThrow(id: string): Task {
  const task = taskStore.get(id);
  if (!task) {
    throw new TRPCError({ code: "NOT_FOUND", message: `Task "${id}" not found` });
  }
  return task;
}

export const taskRouter = router({
  /**
   * Cursor-based pagination, newest tasks first.
   * The cursor is the creation timestamp of the last item received. Unlike an offset,
   * it keeps working when tasks are deleted while the user is scrolling.
   */
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.number().nullish(),
      }),
    )
    .query(({ input }) => {
      const { limit, cursor } = input;
      const sorted = [...taskStore.values()].sort((a, b) => b.dataCriacao - a.dataCriacao);
      const remaining = cursor == null ? sorted : sorted.filter((t) => t.dataCriacao < cursor);
      const items = remaining.slice(0, limit);
      const nextCursor = remaining.length > limit ? items[items.length - 1].dataCriacao : null;
      return { items, nextCursor };
    }),

  byId: publicProcedure
    .input(z.object({ id: taskId }))
    .query(({ input }) => findTaskOrThrow(input.id)),

  create: publicProcedure
    .input(z.object({ titulo, descricao }))
    .mutation(({ input }) => {
      const task: Task = {
        id: crypto.randomUUID(),
        titulo: input.titulo,
        descricao: input.descricao,
        dataCriacao: Date.now(),
      };
      taskStore.set(task.id, task);
      return task;
    }),

  update: publicProcedure
    .input(z.object({ id: taskId, titulo, descricao }))
    .mutation(({ input }) => {
      const task = findTaskOrThrow(input.id);
      const updated: Task = { ...task, titulo: input.titulo, descricao: input.descricao };
      taskStore.set(task.id, updated);
      return updated;
    }),

  delete: publicProcedure
    .input(z.object({ id: taskId }))
    .mutation(({ input }) => {
      findTaskOrThrow(input.id);
      taskStore.delete(input.id);
      return { id: input.id };
    }),
});
