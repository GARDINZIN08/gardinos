# Gardin OS

Sistema simplificado de Ordens de Serviço, Produção, Entregas e Financeiro
da Gardin Comunicação Visual.

- O sistema inteiro é protegido por **uma senha única de acesso** (sem
  login individual — todo mundo que tem a senha entra com o mesmo acesso).
- Quem entra pode criar e ver Ordens de Serviço, incluindo o valor de cada uma.
- O controle de **pagamento** (quanto já foi pago, status) fica só na aba
  **Financeiro**, que pede uma segunda senha própria, separada da senha de acesso geral.

Stack: Next.js 14 (App Router) + TypeScript + Tailwind + Supabase (Postgres).

---

## 1. Instalar as dependências

Na pasta do projeto, no terminal:

```
npm install
```

## 2. Criar o projeto no Supabase

1. Acesse https://supabase.com e crie um novo projeto (gratuito).
2. Espere o projeto terminar de provisionar (1-2 minutos).
3. No menu lateral, abra **SQL Editor**, cole todo o conteúdo do arquivo
   `supabase/schema.sql` deste projeto e clique em **Run**.
   Isso cria todas as tabelas necessárias.
4. Ainda no Supabase, vá em **Project Settings → API** e copie:
   - **Project URL**
   - **service_role key** (em "Project API keys" — é a chave secreta, não a `anon`)

## 3. Configurar as variáveis de ambiente

Copie o arquivo de exemplo:

```
cp .env.example .env.local
```

Abra `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=a-service-role-key-que-voce-copiou
FINANCEIRO_SESSION_SECRET=um-valor-aleatorio-longo
ACESSO_SENHA=escolha-a-senha-que-vai-liberar-o-sistema-inteiro
```

Para gerar um valor aleatório para `FINANCEIRO_SESSION_SECRET`, rode:

```
openssl rand -hex 32
```

(No Windows, se não tiver `openssl`, pode usar qualquer texto longo e aleatório — só não compartilhe esse valor.)

`ACESSO_SENHA` é a senha que qualquer pessoa vai precisar digitar pra
conseguir abrir o sistema (é a primeira tela que aparece). Escolha uma
senha só sua e compartilhe apenas com quem deve ter acesso.

## 4. Definir a senha do Financeiro

Escolha a senha que vai proteger a aba Financeiro e gere o hash dela:

```
npm run hash-senha -- "a-senha-que-voce-quer"
```

O comando vai imprimir um comando SQL pronto, algo como:

```sql
insert into config_financeiro (id, senha_hash) values (1, '$2a$10$....')
on conflict (id) do update set senha_hash = excluded.senha_hash;
```

Copie esse comando, cole no **SQL Editor** do Supabase e rode. A partir
daí, essa é a senha que abre a aba Financeiro no sistema.

## 5. Rodar localmente

```
npm run dev
```

Abra http://localhost:3000 — deve aparecer a lista de Ordens de Serviço
(vazia no começo). Teste:

- Criar uma OS em "+ Nova OS"
- Abrir a OS e mudar o status / adicionar etapas de produção
- Entrar em "Financeiro" com a senha definida no passo 4, e lançar um valor

## 6. Subir para o GitHub

```
git init
git add .
git commit -m "Primeira versão do Gardin OS"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/gardin-os.git
git push -u origin main
```

(Troque a URL pelo repositório que você criar no GitHub. **Não** commite o
arquivo `.env.local` — ele já está no `.gitignore`.)

## 7. Colocar em produção (deploy)

O jeito mais simples é a [Vercel](https://vercel.com) (dos criadores do
Next.js, tem plano gratuito):

1. Crie conta na Vercel e conecte com seu GitHub.
2. "Add New Project" → selecione o repositório `gardin-os`.
3. Em "Environment Variables", adicione as mesmas quatro variáveis do
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `FINANCEIRO_SESSION_SECRET`, `ACESSO_SENHA`).
4. Clique em Deploy. Em poucos minutos você recebe uma URL pública
   (ex: `gardin-os.vercel.app`) para compartilhar com a equipe.

---

## Estrutura do projeto

```
app/
  page.tsx                 → lista de OS (colunas por status)
  nova/page.tsx             → formulário de nova OS
  os/[id]/page.tsx          → detalhe da OS: status, etapas de produção, valor, PDF
  financeiro/page.tsx       → login + lista com valores (protegida)
  financeiro/[id]/page.tsx  → editar valor/pagamento de uma OS
  entrar/page.tsx           → tela de senha de acesso geral (protege o site inteiro)
  api/os/[id]/pdf/route.ts  → gera o PDF (descritivo técnico + valor) de uma OS
middleware.ts                → exige a senha de acesso geral antes de qualquer página
lib/
  actions.ts                → todas as ações do sistema (criar OS, mudar status, salvar financeiro, login/logout...)
  supabaseAdmin.ts           → conexão com o Supabase (só roda no servidor)
  financeiroAuth.ts          → controla o "cadeado" da aba Financeiro
  acessoAuth.ts              → controla o "cadeado" de acesso ao sistema inteiro
  pdf/OrdemServicoPdf.tsx    → layout visual do PDF gerado
  tipos.ts                   → tipos e listas de status usados no app
components/                  → pedaços de tela reutilizáveis
supabase/schema.sql          → estrutura do banco de dados
```

## Como funciona a proteção

Existem duas camadas de senha, uma por cima da outra:

1. **Acesso ao sistema inteiro** (`ACESSO_SENHA`): antes de ver qualquer
   página, é preciso digitar essa senha uma vez. O `middleware.ts` checa
   isso em toda requisição, então nem a API que gera o PDF fica exposta
   sem essa senha. Depois de entrar, um cookie mantém o acesso liberado
   naquele navegador por 30 dias.
2. **Aba Financeiro** (senha definida no passo 4, guardada com hash no
   Supabase): mesmo já estando dentro do sistema, o controle de pagamento
   (quanto já foi pago, status) pede essa segunda senha, separada da
   primeira. O valor de cada OS (o que aparece na própria tela da OS e no
   PDF) NÃO fica atrás dessa segunda senha — só o controle de pagamento.

Em ambos os casos o sistema grava um cookie de sessão assinado (o
navegador não consegue forjar ou alterar esse cookie sem saber o segredo
`FINANCEIRO_SESSION_SECRET`). Os dados ficam em tabelas que só o servidor
do próprio app consegue ler — então mesmo alguém que tente acessar a API
do banco diretamente não consegue ver nada sem passar pelas senhas.

## Próximos passos possíveis (quando quiser evoluir)

- Anexar fotos/arquivos por OS (arte aprovada, foto do local, etc.)
- Notificação (WhatsApp/e-mail) quando uma OS muda de status
- Relatório financeiro por período
- Editar/excluir uma OS já criada
