import { getStatusTone } from "@/lib/utils";

export function StatusBadge({
  status,
  children
}: {
  status: Parameters<typeof getStatusTone>[0];
  children: React.ReactNode;
}) {
  return <span className={`status ${getStatusTone(status)}`}>{children}</span>;
}
