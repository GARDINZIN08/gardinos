import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { OrdemServicoPdf } from "@/lib/pdf/OrdemServicoPdf";
import { EtapaProducao, OrdemServico } from "@/lib/tipos";

// @react-pdf/renderer usa APIs do Node — não roda no runtime "edge".
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: os, error: erroOS } = await supabaseAdmin
    .from("ordens_servico")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (erroOS) {
    return NextResponse.json(
      { erro: `Erro ao buscar OS: ${erroOS.message}` },
      { status: 500 }
    );
  }
  if (!os) {
    return NextResponse.json({ erro: "OS não encontrada." }, { status: 404 });
  }

  const [{ data: etapas }, { data: financeiro }] = await Promise.all([
    supabaseAdmin
      .from("etapas_producao")
      .select("*")
      .eq("os_id", params.id)
      .order("ordem", { ascending: true }),
    supabaseAdmin
      .from("financeiro_os")
      .select("valor_total")
      .eq("os_id", params.id)
      .maybeSingle(),
  ]);

  const buffer = await renderToBuffer(
    OrdemServicoPdf({
      os: os as OrdemServico,
      etapas: (etapas ?? []) as EtapaProducao[],
      valor: financeiro?.valor_total ?? 0,
    })
  );

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="OS-${os.numero}.pdf"`,
      // Sem isso, o navegador pode guardar o PDF em cache e mostrar um
      // valor antigo mesmo depois de editar o valor da OS.
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}
