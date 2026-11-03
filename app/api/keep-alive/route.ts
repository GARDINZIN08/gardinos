import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Endpoint chamado periodicamente pelo cron da Vercel (veja vercel.json)
// só para manter o projeto Supabase gratuito ativo, evitando que ele
// pause sozinho por inatividade (o que derruba o site inteiro).
// Protegido por CRON_SECRET para não ficar aberto publicamente, mesmo
// não expondo nenhum dado sensível.
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
          return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

    const { error } = await supabaseAdmin
      .from("ordens_servico")
      .select("id")
      .limit(1);

    if (error) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  }
