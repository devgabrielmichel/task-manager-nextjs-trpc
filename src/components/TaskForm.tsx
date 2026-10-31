"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import { getQueryKey } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";
import type { Task } from "@/server/taskStore";
import { trpc } from "@/trpc/client";
import { Feedback, type FeedbackMessage } from "./Feedback";

type Props = {
  /** When provided, the form edits this task. Otherwise it creates a new one. */
  task?: Task;
};

export function TaskForm({ task }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(task);

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [tituloError, setTituloError] = useState<string | null>(null);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const mutationOptions = {
    onSuccess: () => {
      // The list page will be rendered again on the server with fresh data,
      // so the cached list on the client is discarded instead of showing outdated tasks.
      queryClient.removeQueries({ queryKey: getQueryKey(trpc.task.list) });
      router.push(`/?status=${isEditing ? "updated" : "created"}`);
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      // Validation errors from the backend go next to the field; anything else goes to the banner.
      const serverTituloError = error.data?.zodError?.fieldErrors.titulo?.[0];
      if (serverTituloError) setTituloError(serverTituloError);
      else setMessage({ type: "error", text: error.message });
    },
  };
  const createMutation = trpc.task.create.useMutation(mutationOptions);
  const updateMutation = trpc.task.update.useMutation(mutationOptions);

  // Stays disabled after success too, while the page navigates back to the list.
  const isSaving =
    createMutation.isPending || updateMutation.isPending || createMutation.isSuccess || updateMutation.isSuccess;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    // Same rule as the backend, checked here first to avoid a useless request.
    if (!titulo.trim()) {
      setTituloError("Title is required");
      return;
    }

    if (task) updateMutation.mutate({ id: task.id, titulo, descricao });
    else createMutation.mutate({ titulo, descricao });
  }

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      <Feedback message={message} />

      <label htmlFor="titulo">Title *</label>
      <input
        id="titulo"
        value={titulo}
        onChange={(e) => {
          setTitulo(e.target.value);
          if (tituloError) setTituloError(null);
        }}
        maxLength={120}
        aria-invalid={Boolean(tituloError)}
        aria-describedby={tituloError ? "titulo-error" : undefined}
        autoFocus
      />
      {tituloError && (
        <p id="titulo-error" className="field-error">
          {tituloError}
        </p>
      )}

      <label htmlFor="descricao">Description</label>
      <textarea
        id="descricao"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        maxLength={1000}
        rows={5}
      />

      <div className="form-actions">
        <Link href="/" className="button">
          Cancel
        </Link>
        <button type="submit" className="button primary" disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Create task"}
        </button>
      </div>
    </form>
  );
}
