export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getStatusTone(
  status: "active" | "expiring" | "expired" | "due" | "success" | "duplicate" | "invalid" | "blocked"
) {
  switch (status) {
    case "active":
    case "success":
      return "status--success";
    case "expiring":
    case "duplicate":
      return "status--warning";
    case "expired":
    case "due":
    case "invalid":
    case "blocked":
      return "status--danger";
    default:
      return "status--neutral";
  }
}
