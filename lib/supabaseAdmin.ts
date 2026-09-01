import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Este client usa a service role key e SÓ pode ser importado
// em código que roda no servidor (Server Components, Server Actions,
// Route Handlers). O pacote "server-only" garante isso em build time:
// se algum componente de cliente importar este arquivo, o build falha.
//
// A criação do client é "preguiçosa" (lazy): só acontece quando alguém
// realmente usa o banco, não no momento em que o arquivo é importado.
// Isso evita que `next build` quebre antes mesmo do .env.local existir
// (o build só verifica quais páginas existem, ele não deveria precisar
// de banco de dados de verdade pra isso).

let client: SupabaseClient | null = null;

function criarClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Variáveis de ambiente do Supabase ausentes. Confira o arquivo .env.local (veja .env.example)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    // Importante: o Next.js (App Router) intercepta o `fetch` global e,
    // dependendo da rota, pode guardar a resposta em cache (Data Cache) —
    // mesmo com `dynamic = "force-dynamic"` na rota que chamou. Isso fazia
    // o PDF (gerado numa Route Handler) mostrar um valor desatualizado
    // (R$ 0,00) mesmo depois de salvar um valor novo. Forçando
    // `cache: "no-store"` em toda chamada que o Supabase faz, garantimos
    // que ele SEMPRE busca o dado atual no banco, em qualquer parte do app.
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

/**
 * Proxy que cria o client de verdade só no primeiro uso (ex: `.from(...)`).
 * Continua podendo ser usado exatamente como `supabaseAdmin.from("tabela")...`
 * em qualquer lugar do app, sem mudar nada no resto do código.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      client = criarClient();
    }
    // Usamos `client` como receiver (em vez do proxy) e, se a propriedade
    // for um método, "prendemos" o `this` a ele — evita bugs sutis onde o
    // client internamente espera que `this` seja a instância real.
    const valor = Reflect.get(client, prop, client);
    return typeof valor === "function" ? valor.bind(client) : valor;
  },
});
