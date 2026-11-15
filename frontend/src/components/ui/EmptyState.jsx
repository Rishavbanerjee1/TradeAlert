import "./EmptyState.css";
import { Inbox } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  description = "There is no data to display.",
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Inbox size={18} />
      </div>
      <b>{title}</b>
      <p>{description}</p>
    </div>
  );
}
