export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  /** Unix timestamp in milliseconds */
  dataCriacao: number;
};

// Fictitious sample data so the list (and the infinite scroll) has something to show on first run.
function seed(): Map<string, Task> {
  const store = new Map<string, Task>();
  const now = Date.now();
  for (let i = 1; i <= 25; i++) {
    const task: Task = {
      id: crypto.randomUUID(),
      titulo: `Sample task #${i}`,
      descricao: i % 3 === 0 ? undefined : `This is the description of sample task #${i}.`,
      // One minute apart, so every task has a distinct creation time (used as the pagination cursor).
      dataCriacao: now - (25 - i) * 60_000,
    };
    store.set(task.id, task);
  }
  return store;
}

// The store lives on globalThis because Next.js may load this module more than once
// (route handlers and server components are bundled separately, and dev mode hot-reloads modules).
// Keeping a single instance makes the API and the SSR pages see the same data.
const globalForStore = globalThis as unknown as { taskStore?: Map<string, Task> };

export const taskStore = (globalForStore.taskStore ??= seed());
