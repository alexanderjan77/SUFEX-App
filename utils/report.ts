import { FundTransaction, POISettings, TransactionNature } from "@/types";
import { formatDate } from "@/utils/format";

const BRASAO_B64 = "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Pnl/eriQvLDwG/eE8/s6uL5TAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAiM0lEQVR4XsXcBZid1bUG4I0X9+DuFLfirinBCRoo7kVTIARSJFjQEIqFEoKU4lakOAR3D168SIFixbnfu++c3tNhJJkml/U888zMmf/8/95rr/V931p7nyk//sx2SJ8+Pz75xBMtv7VvTz/99I99Djqo5befz8YsP6O98MIL5bPPPivDhg0re+25Z8urP7W999qrDLvnnvLZ55+XF/Oen9N+VoftvOOOZemlly5vvvlmefWVV8pVV15Z3nn77fLdd9+VL7/8srydn6+4/PLy6muvlbfeeqssu+yyZYftt295989jo81h1117bbn//vvLDz/80PLKf1qvrbcuG228cfk2znnpxRfLHHPMUT799NPy4EMPlVVXXrmsufrq5cEHHihffPFFmXWWWcqLueb7778vG260UX1ve/b4Y4+Va/Ps0WWjzWFjjDFG2W7bbcsJAwaU22+7rZx15pktfynlsUzqh0x+2mmnLT/Goc8//3yZc6654Gl5OY6ZddZZywILLFCCW/W1ueaeuwx/7rnq/BlmmKF888035Yknnmi5WynnDh5cU/aoI44o2/3mN+Wrf/2r5S+j3kaLw0SCyU43/fRlgQUXLAMHDiwvv/xyjbqDDjyw9O3Tp2zas2f56quvyt/ffbf84he/KOOPP34Zb7zxyu/79Sunn3FGGfSHP5TjjjmmjDvuuGWcccYpX339dXnvvffKv+KMTTbZpByw334lJFD+cv311XmnnnJKWepXvyoT5D5S3L1Hh40Wh4011ljljjvuKIcffnjpd+ihFXtWS4pJ0ddff72slJS76667yvvvv1/ejcMWWXTRGjWvvvpq2XqbbcrEE09cxh577LLr7ruXZ555piyavz83fHi5++676/WfB/yvue66Mtvss9fo2mCDDcpCCy9cjkyE9Y+Tr8/fLMLosDFQZcvPo8y2zaR322238qeLLy5vv/NO2XLLLcsDwaM34qxVVl21MiPMGjRoUJkt6Tff/PNXJ4maT4NZxxx9dBlzzDHLgYmgsfP9u6QiR191xRXlvjh9r9/+tr5viimnLBvGWbPHcatnQc4fMqSm9uabb15OOfnkcvEll7SMaNTZWL+Ptfw8ymyabt1qdP3yl78sv/71r8vxxx1X5p133jLn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";



export const ANNEXES: Array<{
  nature: TransactionNature;
  letter: string;
  formTitle: string;
  annex: string;
}> = [
  { nature: "GRATIFICACAO_FONTE", letter: "A", formTitle: "Gratificação de informantes e suas despesas", annex: "Anexo A" },
  { nature: "PESSOA_JURIDICA", letter: "B", formTitle: "Serviço de terceiros (pessoa jurídica)", annex: "Anexo B" },
  { nature: "PESSOA_FISICA", letter: "C", formTitle: "Serviço de terceiros (pessoa física)", annex: "Anexo C" },
  { nature: "MATERIAL_CONSUMO", letter: "D", formTitle: "Despesas com material de consumo", annex: "Anexo D" },
  { nature: "MATERIAL_PERMANENTE", letter: "G", formTitle: "Despesas com material permanente", annex: "Anexo G" },
  { nature: "DIFICIL_COMPROVACAO", letter: "J", formTitle: "Despesas de difícil comprovação", annex: "Anexo J" },
];

export const PLACEHOLDER_ANNEXES: Array<{ letter: string; formTitle: string }> = [
  { letter: "E", formTitle: "Passagens e despesas com locomoção" },
  { letter: "F", formTitle: "Diárias" },
  { letter: "H", formTitle: "Serviço de tecnologia da informação e comunicação - TIC (despesa corrente)" },
  { letter: "I", formTitle: "Serviços de tecnologia da informação e comunicação - TIC (despesa de capital)" },
];

export function money(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

export function buildHTML(
  transactions: FundTransaction[],
  poi: POISettings,
  totalWithdrawals: number,
  totalExpenses: number,
): string {
  const withdrawals = transactions.filter((t) => t.type === "WITHDRAWAL");
  const devolver = Math.max(0, totalWithdrawals - totalExpenses);
  const saldoNaoSacado = Math.max(0, (poi.valorSolicitado || 0) - totalWithdrawals);

  const saqueRows = withdrawals
    .map(
      (t) => `<tr>
        <td class="lbl">Data:</td><td>${formatDate(t.timestamp)}</td>
        <td class="lbl">Valor (R$):</td><td>R$ ${money(t.amount)}</td>
        <td class="lbl">Comprovante no SEI nº:</td><td>${t.documentNumber || "—"}</td>
      </tr>`
    )
    .join("");

  type AnnexEntry = { letter: string; formTitle: string; total: number; rowsHtml: string };

  const trackedEntries: AnnexEntry[] = ANNEXES.map(({ nature, letter, formTitle }) => {
    const items = transactions.filter((t) => t.type === "EXPENSE" && t.nature === nature);
    const total = items.reduce((s, t) => s + t.amount, 0);
    const rowsHtml =
      items
        .map(
          (t) => `<tr>
        <td>${formatDate(t.timestamp)}</td>
        <td>${t.documentNumber || ""}</td>
        <td>${t.description || ""}</td>
        <td style="text-align:right">R$ ${money(t.amount)}</td>
      </tr>`
        )
        .join("") || `<tr><td colspan="4" class="empty">—</td></tr>`;
    return { letter, formTitle, total, rowsHtml };
  });

  const placeholderEntries: AnnexEntry[] = PLACEHOLDER_ANNEXES.map(({ letter, formTitle }) => ({
    letter,
    formTitle,
    total: 0,
    rowsHtml: `<tr><td colspan="4" class="empty">—</td></tr>`,
  }));

  const allEntries = [...trackedEntries, ...placeholderEntries].sort((a, b) =>
    a.letter.localeCompare(b.letter),
  );

  const totalDespesas = trackedEntries.reduce((s, e) => s + e.total, 0);

  const annexSections = allEntries
    .map(
      ({ letter, formTitle, total, rowsHtml }) => `<div class="section">
      <h3>${letter} - ${formTitle}</h3>
      <table>
        <thead><tr><th>Data</th><th>SEI nº</th><th>Descrição da Despesa</th><th>Valor (R$)</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
        <tfoot><tr><td colspan="3" style="text-align:center"><strong>TOTAL</strong></td><td style="text-align:right"><strong>R$ ${money(total)}</strong></td></tr></tfoot>
      </table>
    </div>`,
    )
    .join("");

  const superintendenciaLine = poi.superintendenciaUf
    ? `SUPERINTENDÊNCIA DA POLÍCIA RODOVIÁRIA FEDERAL NO ${poi.superintendenciaUf.toUpperCase()}`
    : `SUPERINTENDÊNCIA DA POLÍCIA RODOVIÁRIA FEDERAL`;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 24px; }
  .letterhead { text-align: center; font-size: 11px; line-height: 1.5; margin-bottom: 10px; }
  .letterhead strong { display: block; }
  h1 { font-size: 15px; text-align: center; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
  h3 { font-size: 12px; margin: 18px 0 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  table.header-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; vertical-align: top; }
  table.header-table .field-label { font-weight: bold; display: block; margin-bottom: 2px; }
  table.saque-table td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; }
  table.saque-table .lbl { font-weight: bold; white-space: nowrap; width: 1%; }
  .section table { border: 1px solid #000; }
  .section th { border: 1px solid #000; padding: 5px 8px; text-align: left; font-size: 11px; }
  .section td { border: 1px solid #000; padding: 5px 8px; font-size: 11px; }
  .section tfoot td { font-weight: bold; }
  .section .empty { text-align: center; color: #888; }
  .section { page-break-inside: avoid; }
  .total-despesas { border: 1px solid #000; border-top: none; padding: 8px; font-weight: bold; text-align: right; font-size: 12px; }
  .closing-table td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; vertical-align: top; }
  .closing-table .field-label { font-weight: bold; display: block; margin-bottom: 2px; }
  .approvals { margin-top: 26px; display: flex; gap: 30px; }
  .approval-box { flex: 1; border: 1px solid #000; padding: 10px; font-size: 10.5px; }
  .approval-box .name-line { border-bottom: 1px solid #000; min-height: 18px; margin-bottom: 4px; font-weight: bold; }
  .approval-box .role { font-weight: bold; margin-top: 6px; }
  .observacao { margin-top: 24px; font-size: 10px; color: #333; }
</style>
</head><body>
<div class="letterhead">
  <img src="data:image/png;base64,${BRASAO_B64}" alt="Brasão da República" style="width:72px;height:72px;display:block;margin:0 auto 8px;" />
  <strong>MINISTÉRIO DA JUSTIÇA E SEGURANÇA PÚBLICA</strong>
  <strong>POLÍCIA RODOVIÁRIA FEDERAL</strong>
  <strong>${superintendenciaLine}</strong>
</div>

<h1>Relatório de Receitas/Despesas (SUFEX)</h1>

<table class="header-table">
  <tr>
    <td style="width:40%"><span class="field-label">Autorização de Suprimento de Fundos nº</span>${poi.poiNumber || "—"}</td>
    <td style="width:30%"><span class="field-label">Processo nº</span>${poi.seiNumber || "—"}</td>
    <td style="width:30%"><span class="field-label">Valor Solicitado</span>R$ ${money(poi.valorSolicitado || 0)}</td>
  </tr>
  <tr>
    <td colspan="3"><span class="field-label">Número do REMI</span>${poi.remiNumber || "—"}</td>
  </tr>
</table>

<h3 style="margin-top:14px;">Saques Realizados &nbsp;|&nbsp; <span style="font-weight:normal;">Valor Total Sacado: <strong>R$ ${money(totalWithdrawals)}</strong></span></h3>
<table class="saque-table">
  ${saqueRows || `<tr><td colspan="6" style="text-align:center;color:#888;">Nenhum saque registrado</td></tr>`}
</table>

${annexSections}
<div class="total-despesas">VALOR TOTAL DAS DESPESAS: R$ ${money(totalDespesas)}</div>

<table class="closing-table" style="margin-top:16px;">
  <tr>
    <td style="width:34%"><span class="field-label">Saldo Devolvido via GRU (valor sacado e não utilizado)</span>R$ ${money(devolver)}</td>
    <td style="width:33%"><span class="field-label">Comprovante no SEI nº</span>${poi.gruSeiNumber || "—"}</td>
    <td style="width:33%"><span class="field-label">Saldo no Banco do Brasil (valor não sacado)</span>R$ ${money(saldoNaoSacado)}</td>
  </tr>
</table>

<div class="approvals">
  <div class="approval-box">
    <div class="name-line">${[poi.supridoName, poi.supridoMatricula].filter(Boolean).join(" - ") || "—"}</div>
    (Nome completo e matrícula do suprido)
    <div class="role">RESPONSÁVEL PELA PRESTAÇÃO DE CONTAS</div>
  </div>
  <div class="approval-box">
    <div class="name-line">${[poi.solicitanteName, poi.solicitanteMatricula, poi.solicitanteCargo].filter(Boolean).join(" - ") || "—"}</div>
    (Nome completo, matrícula e cargo do solicitante)
    <div class="role">De acordo.</div>
    Considerando que as despesas especificadas foram realizadas em benefício da ação de Inteligência
    previstas na Solicitação de Suprimento de Fundos Excepcional em Regime Especial de Execução nº
    ${poi.seiNumber || "____"}, referindo as informações contidas neste demonstrativo.
  </div>
</div>

<div class="observacao">
  Observação: Este documento deve ser assinado eletronicamente por todos os servidores mencionados.
  Ressalte-se que todos os comprovantes juntados ao processo devem ser atestados pelo Suprido.
</div>
</body></html>`;
}
