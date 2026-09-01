import { criarOS } from "@/lib/actions";

export default function NovaOSPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-4">Nova Ordem de Serviço</h1>
      <form action={criarOS} className="flex flex-col gap-4 bg-white p-4 rounded shadow-sm">
        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="cliente">
            Cliente *
          </label>
          <input
            id="cliente"
            name="cliente"
            required
            className="w-full border rounded px-3 py-2"
            placeholder="Nome do cliente"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="telefone_cliente">
            Telefone
          </label>
          <input
            id="telefone_cliente"
            name="telefone_cliente"
            className="w-full border rounded px-3 py-2"
            placeholder="(00) 00000-0000"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="descricao">
            Descrição do serviço *
          </label>
          <textarea
            id="descricao"
            name="descricao"
            required
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="O que precisa ser feito"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="observacoes">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={2}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="responsavel">
              Responsável
            </label>
            <input
              id="responsavel"
              name="responsavel"
              className="w-full border rounded px-3 py-2"
              placeholder="Quem vai tocar a produção"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="data_prazo">
              Prazo
            </label>
            <input
              id="data_prazo"
              name="data_prazo"
              type="date"
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1" htmlFor="criado_por">
            Seu nome (quem está criando a OS)
          </label>
          <input
            id="criado_por"
            name="criado_por"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-marca-preto text-marca-branco px-4 py-2 rounded font-semibold hover:bg-marca-dourado hover:text-marca-preto transition"
        >
          Criar OS
        </button>
      </form>
    </div>
  );
}
