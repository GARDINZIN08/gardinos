import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import StatusBadge from "@/components/StatusBadge";
import { OrdemServico, STATUS_OS_LABEL, STATUS_OS_ORDEM } from "@/lib/tipos";

export const dynamic = "force-dynamic";

async function buscarOrdens(): Promise<OrdemServico[]> {
  const { data, error } = await supabaseAdmin
    .from("ordens_servico")
    .select("*")
    .order("data_criacao", { ascending: false });

  if (error) {
    throw new Error(`Erro ao buscar ordens de serviço: ${error.message}`);
  }

  return data as OrdemServico[];
}

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default async function PaginaInicial() {
  const ordens = await buscarOrdens();

  const colunas = STATUS_OS_ORDEM.map((status) => ({
    status,
    itens: ordens.filter((os) => os.status === status),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Ordens de Serviço</h1>
        <Link
          href="/nova"
          className="bg-marca-preto text-marca-branco px-4 py-2 rounded text-sm font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
        >
          + Nova OS
        </Link>
      </div>

      {ordens.length === 0 ? (
        <p className="text-neutral-500">
          Nenhuma OS cadastrada ainda. Clique em &quot;+ Nova OS&quot; para
          começar.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {colunas.map((coluna) => (
            <div key={coluna.status} className="bg-white rounded shadow-sm">
              <div className="px-3 py-2 border-b font-semibold text-sm bg-neutral-50 rounded-t">
                {STATUS_OS_LABEL[coluna.status]} ({coluna.itens.length})
              </div>
              <div className="p-2 flex flex-col gap-2">
                {coluna.itens.map((os) => (
                  <Link
                    key={os.id}
                    href={`/os/${os.id}`}
                    className="block border rounded p-2 hover:border-marca-dourado transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">
                        OS #{os.numero}
                      </span>
                      <StatusBadge status={os.status} />
                    </div>
                    <div className="text-sm mt-1">{os.cliente}</div>
                    <div className="text-xs text-neutral-500 line-clamp-2">
                      {os.descricao}
                    </div>
                    {os.data_prazo && (
                      <div className="text-xs text-neutral-400 mt-1">
                        Prazo: {formatarData(os.data_prazo)}
                      </div>
                    )}
                  </Link>
                ))}
                {coluna.itens.length === 0 && (
                  <p className="text-xs text-neutral-400 px-1 py-2">
                    Nenhuma OS aqui.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
