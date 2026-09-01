"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  abrirSessaoFinanceiro,
  encerrarSessaoFinanceiro,
} from "@/lib/financeiroAuth";
import {
  COOKIE_NAME_ACESSO,
  DURACAO_COOKIE_SEGUNDOS,
  criarTokenAcesso,
} from "@/lib/acessoAuth";
import { StatusOS, StatusPagamento } from "@/lib/tipos";

// Compara duas senhas em tempo constante (evita "timing attack"), sem
// quebrar quando os textos têm tamanhos diferentes — por isso comparamos
// o hash SHA-256 de cada uma (sempre 32 bytes) em vez do texto direto.
function senhasConferem(digitada: string, correta: string): boolean {
  const a = crypto.createHash("sha256").update(digitada).digest();
  const b = crypto.createHash("sha256").update(correta).digest();
  return crypto.timingSafeEqual(a, b);
}

// ------------------------------------------------------------------
// Ordens de Serviço
// ------------------------------------------------------------------

export async function criarOS(formData: FormData) {
  const cliente = String(formData.get("cliente") || "").trim();
  const descricao = String(formData.get("descricao") || "").trim();

  if (!cliente || !descricao) {
    throw new Error("Cliente e descrição são obrigatórios.");
  }

  const dados = {
    cliente,
    descricao,
    telefone_cliente: String(formData.get("telefone_cliente") || "").trim() || null,
    observacoes: String(formData.get("observacoes") || "").trim() || null,
    responsavel: String(formData.get("responsavel") || "").trim() || null,
    criado_por: String(formData.get("criado_por") || "").trim() || null,
    data_prazo: String(formData.get("data_prazo") || "").trim() || null,
  };

  const { data, error } = await supabaseAdmin
    .from("ordens_servico")
    .insert(dados)
    .select("id")
    .single();

  if (error) {
    throw new Error(`Erro ao criar OS: ${error.message}`);
  }

  revalidatePath("/");
  redirect(`/os/${data.id}`);
}

export async function atualizarStatusOS(osId: string, novoStatus: StatusOS) {
  const dados: Record<string, unknown> = { status: novoStatus };
  if (novoStatus === "entregue") {
    dados.data_entrega = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("ordens_servico")
    .update(dados)
    .eq("id", osId);

  if (error) {
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath(`/os/${osId}`);
}

// O valor da OS fica visível/editável direto na tela da OS, sem senha
// (decisão do usuário: só o controle de pagamento — quanto já foi pago,
// status de pagamento etc — continua atrás da senha do Financeiro).
// Por isso essa ação NÃO checa temSessaoFinanceiro().
export async function salvarValorOS(osId: string, formData: FormData) {
  const valor_total = Number(formData.get("valor_total") || 0);

  if (Number.isNaN(valor_total) || valor_total < 0) {
    throw new Error("Valor inválido.");
  }

  // Upsert parcial: só mexe em valor_total. Se já existir um registro
  // financeiro dessa OS (com valor_pago, status_pagamento etc), esses
  // outros campos não são tocados.
  const { error } = await supabaseAdmin
    .from("financeiro_os")
    .upsert({ os_id: osId, valor_total });

  if (error) {
    throw new Error(`Erro ao salvar valor: ${error.message}`);
  }

  revalidatePath(`/os/${osId}`);
  revalidatePath("/financeiro");
  revalidatePath(`/financeiro/${osId}`);
}

// ------------------------------------------------------------------
// Etapas de produção (checklist livre por OS)
// ------------------------------------------------------------------

export async function adicionarEtapa(osId: string, formData: FormData) {
  const titulo = String(formData.get("titulo") || "").trim();
  if (!titulo) return;

  const { count } = await supabaseAdmin
    .from("etapas_producao")
    .select("id", { count: "exact", head: true })
    .eq("os_id", osId);

  const { error } = await supabaseAdmin.from("etapas_producao").insert({
    os_id: osId,
    titulo,
    ordem: count ?? 0,
  });

  if (error) {
    throw new Error(`Erro ao adicionar etapa: ${error.message}`);
  }

  revalidatePath(`/os/${osId}`);
}

export async function alternarEtapa(
  etapaId: string,
  osId: string,
  concluidaAtual: boolean
) {
  const { error } = await supabaseAdmin
    .from("etapas_producao")
    .update({ concluida: !concluidaAtual })
    .eq("id", etapaId);

  if (error) {
    throw new Error(`Erro ao atualizar etapa: ${error.message}`);
  }

  revalidatePath(`/os/${osId}`);
}

export async function removerEtapa(etapaId: string, osId: string) {
  const { error } = await supabaseAdmin
    .from("etapas_producao")
    .delete()
    .eq("id", etapaId);

  if (error) {
    throw new Error(`Erro ao remover etapa: ${error.message}`);
  }

  revalidatePath(`/os/${osId}`);
}

// ------------------------------------------------------------------
// Financeiro
// ------------------------------------------------------------------

export async function loginFinanceiro(formData: FormData) {
  const senha = String(formData.get("senha") || "");
  const redirectParaOS = String(formData.get("redirect") || "");
  // Só seguimos um redirect de volta pra dentro do próprio /financeiro/...,
  // nunca para um endereço vindo de fora.
  const destino = redirectParaOS.startsWith("/financeiro/")
    ? redirectParaOS
    : "/financeiro";

  const { data, error } = await supabaseAdmin
    .from("config_financeiro")
    .select("senha_hash")
    .eq("id", 1)
    .single();

  if (error || !data) {
    redirect("/financeiro?erro=nao-configurado");
  }

  const confere = bcrypt.compareSync(senha, data.senha_hash);
  if (!confere) {
    const erroUrl = redirectParaOS
      ? `/financeiro?erro=senha-incorreta&redirect=${encodeURIComponent(redirectParaOS)}`
      : "/financeiro?erro=senha-incorreta";
    redirect(erroUrl);
  }

  await abrirSessaoFinanceiro();
  redirect(destino);
}

export async function sairFinanceiro() {
  await encerrarSessaoFinanceiro();
  redirect("/financeiro");
}

export async function salvarFinanceiroOS(osId: string, formData: FormData) {
  const valor_total = Number(formData.get("valor_total") || 0);
  const valor_pago = Number(formData.get("valor_pago") || 0);
  const status_pagamento = String(
    formData.get("status_pagamento") || "nao_pago"
  ) as StatusPagamento;
  const forma_pagamento =
    String(formData.get("forma_pagamento") || "").trim() || null;
  const observacoes_financeiras =
    String(formData.get("observacoes_financeiras") || "").trim() || null;

  const { error } = await supabaseAdmin.from("financeiro_os").upsert({
    os_id: osId,
    valor_total,
    valor_pago,
    status_pagamento,
    forma_pagamento,
    observacoes_financeiras,
  });

  if (error) {
    throw new Error(`Erro ao salvar dados financeiros: ${error.message}`);
  }

  revalidatePath("/financeiro");
  revalidatePath(`/financeiro/${osId}`);
}

// ------------------------------------------------------------------
// Acesso geral ao sistema (senha única, protege o site inteiro — ver
// middleware.ts). Diferente do Financeiro: aqui é só "consegue entrar
// ou não", sem ligação com valores/pagamento.
// ------------------------------------------------------------------

export async function entrarNoSistema(formData: FormData) {
  const senha = String(formData.get("senha") || "");
  const redirectPara = String(formData.get("redirect") || "");
  // Só seguimos um redirect de volta pro próprio site, nunca para um
  // endereço externo vindo do formulário.
  const destino =
    redirectPara.startsWith("/") && !redirectPara.startsWith("//")
      ? redirectPara
      : "/";

  const senhaCorreta = process.env.ACESSO_SENHA;
  if (!senhaCorreta) {
    redirect("/entrar?erro=nao-configurado");
  }

  if (!senhasConferem(senha, senhaCorreta)) {
    const erroUrl = redirectPara
      ? `/entrar?erro=senha-incorreta&redirect=${encodeURIComponent(redirectPara)}`
      : "/entrar?erro=senha-incorreta";
    redirect(erroUrl);
  }

  const token = await criarTokenAcesso();
  const store = await cookies();
  store.set(COOKIE_NAME_ACESSO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_COOKIE_SEGUNDOS,
  });

  redirect(destino);
}

export async function sairDoSistema() {
  const store = await cookies();
  store.delete(COOKIE_NAME_ACESSO);
  redirect("/entrar");
}
