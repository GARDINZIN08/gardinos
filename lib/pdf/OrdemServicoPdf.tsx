import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { EtapaProducao, OrdemServico, STATUS_OS_LABEL } from "@/lib/tipos";

// Documento no padrão visual da Gardin Comunicação Visual:
// faixa preta no topo, detalhes em dourado, tabela de informações
// com rótulos em fundo amarelo, e uma faixa de valor no rodapé.

const DOURADO = "#D4AF37";
const PRETO = "#111111";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: PRETO,
  },
  headerBar: {
    backgroundColor: PRETO,
    color: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerNome: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.2,
  },
  headerSub: {
    fontSize: 9,
    marginTop: 2,
    color: "#DDDDDD",
  },
  headerTituloBloco: {
    alignItems: "flex-end",
  },
  headerTitulo: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  headerSubTitulo: {
    fontSize: 9,
    marginTop: 2,
    color: "#DDDDDD",
    maxWidth: 220,
    textAlign: "right",
  },
  faixaDourada: {
    height: 6,
    backgroundColor: DOURADO,
    marginBottom: 16,
  },
  tabelaInfo: {
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 16,
  },
  linhaInfo: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  linhaInfoUltima: {
    flexDirection: "row",
  },
  celulaLabel: {
    width: 110,
    backgroundColor: DOURADO,
    padding: 6,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  celulaValor: {
    flex: 1,
    padding: 6,
    fontSize: 9,
  },
  secaoTitulo: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
    marginTop: 4,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 3,
    paddingRight: 4,
  },
  bulletMarcador: {
    width: 10,
    fontSize: 9,
  },
  bulletTexto: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.4,
  },
  etapaLinha: {
    flexDirection: "row",
    marginBottom: 3,
  },
  etapaCaixa: {
    width: 10,
    fontSize: 9,
  },
  etapaTexto: {
    fontSize: 9,
  },
  faixaValor: {
    backgroundColor: DOURADO,
    marginTop: 20,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  faixaValorLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },
  faixaValorValor: {
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
  },
  rodape: {
    marginTop: 24,
    fontSize: 8,
    color: "#888888",
  },
});

function formatarData(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR");
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Quebra um texto livre em linhas/bullets: cada linha não-vazia vira um item.
function paraLinhas(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function OrdemServicoPdf({
  os,
  etapas,
  valor,
}: {
  os: OrdemServico;
  etapas: EtapaProducao[];
  valor: number;
}) {
  const linhasDescricao = paraLinhas(os.descricao);
  const linhasObservacoes = paraLinhas(os.observacoes);

  return (
    <Document title={`OS ${os.numero} - ${os.cliente}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.headerNome}>GARDIN</Text>
            <Text style={styles.headerNome}>COMUNICAÇÃO VISUAL</Text>
          </View>
          <View style={styles.headerTituloBloco}>
            <Text style={styles.headerTitulo}>ORDEM DE SERVIÇO</Text>
            <Text style={styles.headerSubTitulo}>Nº {os.numero}</Text>
          </View>
        </View>
        <View style={styles.faixaDourada} />

        <View style={styles.tabelaInfo}>
          <View style={styles.linhaInfo}>
            <Text style={styles.celulaLabel}>CLIENTE</Text>
            <Text style={styles.celulaValor}>{os.cliente}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.celulaLabel}>DATA</Text>
            <Text style={styles.celulaValor}>
              {formatarData(os.data_criacao)}
            </Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.celulaLabel}>PRAZO</Text>
            <Text style={styles.celulaValor}>{formatarData(os.data_prazo)}</Text>
          </View>
          <View style={styles.linhaInfo}>
            <Text style={styles.celulaLabel}>STATUS</Text>
            <Text style={styles.celulaValor}>{STATUS_OS_LABEL[os.status]}</Text>
          </View>
          <View style={styles.linhaInfoUltima}>
            <Text style={styles.celulaLabel}>RESPONSÁVEL</Text>
            <Text style={styles.celulaValor}>{os.responsavel || "—"}</Text>
          </View>
        </View>

        <Text style={styles.secaoTitulo}>DESCRITIVO TÉCNICO</Text>
        {linhasDescricao.length > 0 ? (
          linhasDescricao.map((linha, i) => (
            <View style={styles.bullet} key={`d-${i}`}>
              <Text style={styles.bulletMarcador}>•</Text>
              <Text style={styles.bulletTexto}>{linha}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.bulletTexto}>—</Text>
        )}

        {linhasObservacoes.length > 0 && (
          <>
            <Text style={styles.secaoTitulo}>OBSERVAÇÕES</Text>
            {linhasObservacoes.map((linha, i) => (
              <View style={styles.bullet} key={`o-${i}`}>
                <Text style={styles.bulletMarcador}>•</Text>
                <Text style={styles.bulletTexto}>{linha}</Text>
              </View>
            ))}
          </>
        )}

        {etapas.length > 0 && (
          <>
            <Text style={styles.secaoTitulo}>ETAPAS DE PRODUÇÃO</Text>
            {etapas.map((etapa) => (
              <View style={styles.etapaLinha} key={etapa.id}>
                <Text style={styles.etapaCaixa}>
                  {etapa.concluida ? "[X]" : "[ ]"}
                </Text>
                <Text style={styles.etapaTexto}>{etapa.titulo}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.faixaValor}>
          <Text style={styles.faixaValorLabel}>VALOR</Text>
          <Text style={styles.faixaValorValor}>{formatarMoeda(valor)}</Text>
        </View>

        <Text style={styles.rodape}>
          Gardin Comunicação Visual — documento gerado em{" "}
          {new Date().toLocaleString("pt-BR")}
        </Text>
      </Page>
    </Document>
  );
}
