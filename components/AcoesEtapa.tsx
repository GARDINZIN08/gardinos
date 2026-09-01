"use client";

import { alternarEtapa, removerEtapa } from "@/lib/actions";
import { EtapaProducao } from "@/lib/tipos";
import { useTransition } from "react";

export default function AcoesEtapa({ etapa }: { etapa: EtapaProducao }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-2 border-b last:border-b-0 py-2">
      <input
        type="checkbox"
        checked={etapa.concluida}
        disabled={isPending}
        onChange={() =>
          startTransition(() => {
            alternarEtapa(etapa.id, etapa.os_id, etapa.concluida);
          })
        }
        className="h-4 w-4"
      />
      <span
        className={`flex-1 text-sm ${
          etapa.concluida ? "line-through text-neutral-400" : ""
        }`}
      >
        {etapa.titulo}
      </span>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(() => {
            removerEtapa(etapa.id, etapa.os_id);
          })
        }
        className="text-xs text-neutral-400 hover:text-red-600"
        aria-label="Remover etapa"
      >
        remover
      </button>
    </li>
  );
}
