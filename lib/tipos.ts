// Limite combinado com o usuário: valores até esse teto podem ficar
// visíveis/editáveis direto na tela da OS (sem senha). Acima disso, só a
// aba Financeiro (com senha) pode definir ou mostrar o valor.
export const LIMITE_VALOR_PUBLICO = 1000;

export type StatusOS = "aguardando" | "em_producao" | "pronto" | "entregue";

export type StatusPagamento = "nao_pago" | "pago_parcial" | "pago";

export const STATUS_OS_LABEL: Record<StatusOS, string> = {
  aguardando: "Aguardando",
  em_producao: "Em produção",
  pronto: "Pronto",
  entregue: "Entregue",
};

export const STATUS_OS_ORDEM: StatusOS[] = [
  "aguardando",
  "em_producao",
  "pronto",
  "entregue",
];

export const STATUS_PAGAMENTO_LABEL: Record<StatusPagamento, string> = {
  nao_pago: "Não pago",
  pago_parcial: "Pago parcialmente",
  pago: "Pago",
};

export interface OrdemServico {
  id: string;
  numero: number;
  cliente: string;
  telefone_cliente: string | null;
  descricao: string;
  observacoes: string | null;
  status: StatusOS;
  responsavel: string | null;
  data_criacao: string;
  data_prazo: string | null;
  data_entrega: string | null;
  criado_por: string | null;
  atualizado_em: string;
}

export interface EtapaProducao {
  id: string;
  os_id: string;
  titulo: string;
  concluida: boolean;
  ordem: number;
  criado_em: string;
}

export interface FinanceiroOS {
  os_id: string;
  valor_total: number;
  valor_pago: number;
  status_pagamento: StatusPagamento;
  forma_pagamento: string | null;
  observacoes_financeiras: string | null;
  atualizado_em: string;
}
