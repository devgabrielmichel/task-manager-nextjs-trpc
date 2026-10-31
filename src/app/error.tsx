"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>Something went wrong</h1>
      <p className="feedback error">The page could not be loaded.</p>
      <button type="button" className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
