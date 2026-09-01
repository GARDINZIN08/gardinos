import { STATUS_OS_LABEL, StatusOS } from "@/lib/tipos";

const CORES: Record<StatusOS, string> = {
  aguardando: "bg-neutral-200 text-neutral-800",
  em_producao: "bg-marca-dourado/20 text-yellow-800",
  pronto: "bg-blue-100 text-blue-800",
  entregue: "bg-green-100 text-green-800",
};

export default function StatusBadge({ status }: { status: StatusOS }) {
  return (
    <span
      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${CORES[status]}`}
    >
      {STATUS_OS_LABEL[status]}
    </span>
  );
}
