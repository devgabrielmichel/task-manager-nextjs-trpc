export type FeedbackMessage = { type: "success" | "error"; text: string };

export function Feedback({ message }: { message: FeedbackMessage | null }) {
  if (!message) return null;
  return (
    <p className={`feedback ${message.type}`} role={message.type === "error" ? "alert" : "status"}>
      {message.text}
    </p>
  );
}
