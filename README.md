# Task Manager

A simple task manager built with **Next.js 15 (App Router)** and **tRPC**. Tasks are kept in memory on the server, so there is no database to set up.

## Features

- Create, list, edit and delete tasks through tRPC procedures
- Task list pre-loaded with **Server-Side Rendering**
- Infinite scroll on the list (cursor-based pagination)
- Validation on both sides: the form blocks an empty title, and the backend validates every input with Zod
- Clear feedback for loading, success and error states (e.g. editing a task that no longer exists returns a `NOT_FOUND` error)

## Stack

- Next.js 15 / React 19 / TypeScript
- tRPC v11
- TanStack React Query v5 (used by the tRPC React client)
- Zod for input validation

## Running locally

Requirements: Node.js 18.18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The app starts with 25 sample tasks so the infinite scroll can be tested right away.

Other scripts:

```bash
npm run build   # production build
npm start       # run the production build
npm run lint
```

> Since the data lives in memory, it resets every time the server restarts.

## How it works

```
src/
├── server/
│   ├── taskStore.ts        # in-memory store (Map) + Task type
│   ├── trpc.ts             # tRPC initialization and error formatter
│   └── routers/
│       ├── _app.ts         # root router (exports the AppRouter type)
│       └── task.ts         # task procedures: list, byId, create, update, delete
├── trpc/
│   ├── client.tsx          # tRPC + React Query provider for client components
│   └── server.ts           # server-side caller used by server components
├── app/
│   ├── api/trpc/[trpc]/    # HTTP endpoint for tRPC (/api/trpc)
│   ├── page.tsx            # task list (SSR)
│   └── tasks/
│       ├── new/            # create form
│       └── [id]/edit/      # edit form
└── components/
    ├── TaskList.tsx        # list, delete, infinite scroll
    ├── TaskForm.tsx        # shared create/edit form
    └── Feedback.tsx        # success / error message
```

### API (tRPC procedures)

| Procedure | Type | Input | Errors |
|---|---|---|---|
| `task.list` | query | `{ limit?, cursor? }` | – |
| `task.byId` | query | `{ id }` | `NOT_FOUND` |
| `task.create` | mutation | `{ titulo, descricao? }` | `BAD_REQUEST` (empty title) |
| `task.update` | mutation | `{ id, titulo, descricao? }` | `NOT_FOUND`, `BAD_REQUEST` |
| `task.delete` | mutation | `{ id }` | `NOT_FOUND` |

A task has the fields `id` (UUID), `titulo` (required), `descricao` (optional) and `dataCriacao` (timestamp in ms).

## Main decisions

- **SSR without an HTTP call to itself.** The list page is a server component that calls the tRPC router directly through `createCaller`. The first page of tasks is rendered on the server and passed to the client component as initial data, so React Query doesn't fetch it again on load.
- **Same validation on both sides.** The form checks the title before sending, which avoids a useless request. The backend validates again with Zod, because the API can be called by anyone, not only by this frontend. Zod errors are returned per field so the form can show them next to the input.
- **Cursor pagination instead of offset.** The cursor is the creation timestamp of the last task received. If a task is deleted while the user scrolls, an offset would skip or repeat items; the cursor doesn't.
- **Deleting updates the cache directly.** After a delete, the task is removed from the cached pages instead of refetching the whole list.
- **In-memory store on `globalThis`.** Next.js bundles route handlers and pages separately and reloads modules in dev mode. Keeping the `Map` on `globalThis` guarantees that the API and the SSR pages share the same data.

## Limitations

- Data is lost when the server restarts, and it would not be shared between multiple server instances. A real version would use a database.
- There is no authentication; every procedure is public.
