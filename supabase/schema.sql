-- ============================================================
-- Gardin OS — schema inicial (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------

create type status_os as enum (
  'aguardando',      -- acabou de entrar, ainda não começou
  'em_producao',     -- em produção/execução
  'pronto',          -- pronto, aguardando entrega/retirada
  'entregue'         -- entregue ao cliente
);

create type status_pagamento as enum (
  'nao_pago',
  'pago_parcial',
  'pago'
);

-- ------------------------------------------------------------
-- TABELA PRINCIPAL: ordens_servico
-- Nunca guarda "valor" aqui por engano — valores ficam em financeiro_os.
-- Qualquer pessoa (sem login) pode criar/ler/atualizar isso.
-- ------------------------------------------------------------

create table ordens_servico (
  id uuid primary key default gen_random_uuid(),
  numero serial unique,                    -- número sequencial amigável (OS #123)
  cliente text not null,
  telefone_cliente text,
  descricao text not null,                 -- descrição do serviço/produto
  observacoes text,
  status status_os not null default 'aguardando',
  responsavel text,                        -- quem está tocando a produção (texto livre)
  data_criacao timestamptz not null default now(),
  data_prazo date,                         -- prazo combinado com o cliente
  data_entrega timestamptz,                -- preenchida quando marca como entregue
  criado_por text,                         -- nome de quem criou (texto livre, sem login)
  atualizado_em timestamptz not null default now()
);

create index idx_os_status on ordens_servico(status);
create index idx_os_data_criacao on ordens_servico(data_criacao desc);

-- Mantém atualizado_em em dia
create or replace function set_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_os_atualizado_em
before update on ordens_servico
for each row execute function set_atualizado_em();

-- ------------------------------------------------------------
-- ETAPAS DE PRODUÇÃO (opcional, checklist simples por OS)
-- ------------------------------------------------------------

create table etapas_producao (
  id uuid primary key default gen_random_uuid(),
  os_id uuid not null references ordens_servico(id) on delete cascade,
  titulo text not null,                    -- ex: "Serralheria", "Pintura", "Instalação"
  concluida boolean not null default false,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index idx_etapas_os_id on etapas_producao(os_id);

-- ------------------------------------------------------------
-- FINANCEIRO — valores e pagamento, isolado da tabela principal.
-- Só a API do financeiro (protegida por senha) lê/escreve aqui.
-- ------------------------------------------------------------

create table financeiro_os (
  os_id uuid primary key references ordens_servico(id) on delete cascade,
  valor_total numeric(12,2) not null default 0,
  valor_pago numeric(12,2) not null default 0,
  status_pagamento status_pagamento not null default 'nao_pago',
  forma_pagamento text,                    -- ex: pix, dinheiro, cartão
  observacoes_financeiras text,
  atualizado_em timestamptz not null default now()
);

create trigger trg_financeiro_atualizado_em
before update on financeiro_os
for each row execute function set_atualizado_em();

-- ------------------------------------------------------------
-- CONFIGURAÇÃO — senha do financeiro (hash, nunca texto puro)
-- Preenchida uma vez via SQL Editor (veja README para gerar o hash).
-- ------------------------------------------------------------

create table config_financeiro (
  id integer primary key default 1,
  senha_hash text not null,
  constraint somente_uma_linha check (id = 1)
);

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- O app usa a service role key só no servidor (Next.js API routes),
-- nunca no navegador — então RLS fica travado por padrão (deny all)
-- e o acesso é sempre controlado pelo backend do próprio app.
-- ------------------------------------------------------------

alter table ordens_servico enable row level security;
alter table etapas_producao enable row level security;
alter table financeiro_os enable row level security;
alter table config_financeiro enable row level security;

-- Nenhuma policy criada de propósito: só a service role (servidor) acessa.
