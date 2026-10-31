"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/server/routers/_app";
import { PAGE_SIZE } from "@/lib/config";
import { trpc } from "@/trpc/client";
import { Feedback, type FeedbackMessage } from "./Feedback";

type TaskPage = inferRouterOutputs<AppRouter>["task"]["list"];

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export function TaskList({
  initialPage,
  initialMessage,
}: {
  initialPage: TaskPage;
  initialMessage?: string;
}) {
  const [message, setMessage] = useState<FeedbackMessage | null>(
    initialMessage ? { type: "success", text: initialMessage } : null,
  );
  const utils = trpc.useUtils();

  // The first page comes from the server (SSR) and seeds the cache, so nothing is fetched on load.
  // Next pages are fetched on the client as the user scrolls.
  const listQuery = trpc.task.list.useInfiniteQuery(
    { limit: PAGE_SIZE },
    {
      initialData: { pages: [initialPage], pageParams: [null] },
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    },
  );
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = listQuery;

  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: ({ id }) => {
      // Remove the task from the cached pages instead of refetching everything.
      utils.task.list.setInfiniteData({ limit: PAGE_SIZE }, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.filter((task) => task.id !== id),
          })),
        },
      );
      setMessage({ type: "success", text: "Task deleted." });
    },
    onError: (error) => setMessage({ type: "error", text: `Could not delete the task: ${error.message}` }),
  });

  // Drop the ?status=... from the URL once the message is shown, so a refresh doesn't show it again.
  useEffect(() => {
    if (initialMessage) window.history.replaceState(null, "", "/");
  }, [initialMessage]);

  // Infinite scroll: when the sentinel at the bottom of the list becomes visible, load the next page.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  function handleDelete(id: string, titulo: string) {
    if (!window.confirm(`Delete "${titulo}"?`)) return;
    setMessage(null);
    deleteMutation.mutate({ id });
  }

  const tasks = listQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <>
      <Feedback message={message} />

      {tasks.length === 0 ? (
        <p className="empty">
          No tasks yet. <Link href="/tasks/new">Create the first one.</Link>
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => {
            const isDeleting = deleteMutation.isPending && deleteMutation.variables?.id === task.id;
            return (
              <li key={task.id} className={`task ${isDeleting ? "deleting" : ""}`}>
                <div className="task-content">
                  <h2>{task.titulo}</h2>
                  {task.descricao && <p>{task.descricao}</p>}
                  {/* Server and browser may be in different time zones, so the text can differ after hydration. */}
                  <time dateTime={new Date(task.dataCriacao).toISOString()} suppressHydrationWarning>
                    {dateFormat.format(task.dataCriacao)}
                  </time>
                </div>
                <div className="task-actions">
                  <Link href={`/tasks/${task.id}/edit`} className="button">
                    Edit
                  </Link>
                  <button
                    type="button"
                    className="button danger"
                    onClick={() => handleDelete(task.id, task.titulo)}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div ref={sentinelRef} className="list-footer">
        {isFetchingNextPage && <p>Loading more tasks...</p>}
        {listQuery.isFetchNextPageError && (
          <p className="feedback error">
            Could not load more tasks.{" "}
            <button type="button" className="link-button" onClick={() => fetchNextPage()}>
              Try again
            </button>
          </p>
        )}
        {!hasNextPage && tasks.length > 0 && <p>You have reached the end of the list.</p>}
      </div>
    </>
  );
}
