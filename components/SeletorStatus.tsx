"use client";

import { useTransition } from "react";
import { atualizarStatusOS } from "@/lib/actions";
import { STATUS_OS_LABEL, STATUS_OS_ORDEM, StatusOS } from "@/lib/tipos";

export default function SeletorStatus({
  osId,
  statusAtual,
}: {
  osId: string;
  statusAtual: StatusOS;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_OS_ORDEM.map((status) => {
        const ativo = status === statusAtual;
        return (
          <button
            key={status}
            type="button"
            disabled={isPending || ativo}
            onClick={() =>
              startTransition(() => {
                atualizarStatusOS(osId, status);
              })
            }
            className={`px-3 py-1.5 rounded text-sm font-semibold border transition ${
              ativo
                ? "bg-marca-preto text-marca-branco border-marca-preto"
                : "bg-white text-marca-preto border-neutral-300 hover:border-marca-dourado"
            }`}
          >
            {STATUS_OS_LABEL[status]}
          </button>
        );
      })}
    </div>
  );
}
