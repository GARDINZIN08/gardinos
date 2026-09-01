"use client";

import { useTransition } from "react";
import { excluirOS } from "@/lib/actions";

export default function ExcluirOS({
  osId,
  osNumero,
}: {
  osId: string;
  osNumero: number;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const confirmado = window.confirm(
          `Tem certeza que quer excluir a OS #${osNumero}? Essa ação não pode ser desfeita — as etapas de produção e os dados financeiros dessa OS também serão apagados.`
        );
        if (!confirmado) return;
        startTransition(() => {
          excluirOS(osId);
        });
      }}
      className="text-sm text-neutral-400 hover:text-red-600"
    >
      {isPending ? "Excluindo..." : "Excluir OS"}
    </button>
  );
}
