// Gera o hash da senha do Financeiro para colar na tabela config_financeiro.
// Uso:  npm run hash-senha -- "minha-senha-aqui"

import bcrypt from "bcryptjs";

const senha = process.argv[2];

if (!senha) {
  console.error('Uso: npm run hash-senha -- "minha-senha-aqui"');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);

console.log("\nHash gerado (copie o valor abaixo):\n");
console.log(hash);
console.log(
  "\nCole esse valor no SQL Editor do Supabase, por exemplo:\n\n" +
    `insert into config_financeiro (id, senha_hash) values (1, '${hash}')\n` +
    "on conflict (id) do update set senha_hash = excluded.senha_hash;\n"
);
