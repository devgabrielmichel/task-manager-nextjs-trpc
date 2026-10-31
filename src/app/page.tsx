import Link from "next/link";
import { TaskList } from "@/components/TaskList";
import { PAGE_SIZE } from "@/lib/config";
import { api } from "@/trpc/server";

// The task list changes all the time, so this page is rendered on every request (SSR)
// instead of being generated once at build time.
export const dynamic = "force-dynamic";

const statusMessages: Record<string, string> = {
  created: "Task created successfully.",
  updated: "Task updated successfully.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [firstPage, { status }] = await Promise.all([
    api.task.list({ limit: PAGE_SIZE }),
    searchParams,
  ]);

  return (
    <main>
      <div className="page-title">
        <h1>Tasks</h1>
        <Link href="/tasks/new" className="button primary">
          New task
        </Link>
      </div>
      <TaskList initialPage={firstPage} initialMessage={status ? statusMessages[status] : undefined} />
    </main>
  );
}
