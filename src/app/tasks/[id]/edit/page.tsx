import { notFound } from "next/navigation";
import { TRPCError } from "@trpc/server";
import { TaskForm } from "@/components/TaskForm";
import { api } from "@/trpc/server";

export const dynamic = "force-dynamic";

async function getTask(id: string) {
  try {
    return await api.task.byId({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
}

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);

  return (
    <main>
      <h1>Edit task</h1>
      <TaskForm task={task} />
    </main>
  );
}
