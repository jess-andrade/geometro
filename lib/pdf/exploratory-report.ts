import { jsPDF } from 'jspdf';
import source from '@/data/exploratory.json';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const GREEN = '#176b52';
const DARK = '#17372d';
const MUTED = '#5f6f66';
const AMBER = '#a66b22';

type Point = { x: number; y: number };

const data = source;
const number = (value: number | null | undefined, digits = 0) =>
  value === null || value === undefined || !Number.isFinite(value)
    ? '—'
    : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);

export async function downloadExploratoryReport() {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = 18;
  };
  const ensure = (height: number) => {
    if (y + height > PAGE_HEIGHT - 18) addPage();
  };
  const text = (value: string, options?: { size?: number; color?: string; bold?: boolean; indent?: number; gap?: number }) => {
    const size = options?.size ?? 9;
    const indent = options?.indent ?? 0;
    const lines = doc.splitTextToSize(value, CONTENT_WIDTH - indent) as string[];
    const height = lines.length * (size * 0.42) + (options?.gap ?? 2);
    ensure(height);
    doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(options?.color ?? '#26362f');
    doc.text(lines, MARGIN + indent, y);
    y += height;
  };
  const heading = (index: number, title: string) => {
    ensure(15);
    if (y > 20) y += 3;
    doc.setFillColor(GREEN);
    doc.roundedRect(MARGIN, y - 4, 8, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor('#ffffff');
    doc.text(String(index).padStart(2, '0'), MARGIN + 4, y + 1.3, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(DARK);
    doc.text(title, MARGIN + 12, y + 1.8);
    y += 12;
  };
  const bullet = (value: string) => {
    ensure(8);
    doc.setFillColor(GREEN);
    doc.circle(MARGIN + 1.4, y - 1.2, 0.8, 'F');
    text(value, { indent: 5, size: 8.7, gap: 2.2 });
  };
  const labelValue = (label: string, value: string) => {
    ensure(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(DARK);
    doc.text(`${label}:`, MARGIN, y);
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(MUTED);
    doc.text(value, MARGIN + labelWidth, y);
    y += 6;
  };
  const chartFrame = (title: string, height = 58) => {
    ensure(height + 13);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(DARK);
    doc.text(title, MARGIN, y);
    y += 5;
    const origin: Point = { x: MARGIN + 9, y: y + height - 8 };
    doc.setDrawColor('#dce5df');
    doc.setFillColor('#fbfcfb');
    doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 2, 2, 'FD');
    return { origin, width: CONTENT_WIDTH - 16, height: height - 15, totalHeight: height };
  };
  const lineChart = (title: string, rows: Array<{ label: string; value: number }>, eventLabels: string[] = []) => {
    const frame = chartFrame(title);
    const values = rows.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const points = rows.map((row, index) => ({
      x: frame.origin.x + (index / Math.max(rows.length - 1, 1)) * frame.width,
      y: frame.origin.y - ((row.value - min) / range) * frame.height,
    }));
    doc.setDrawColor('#d9e2dc');
    doc.line(frame.origin.x, frame.origin.y, frame.origin.x + frame.width, frame.origin.y);
    eventLabels.forEach((label) => {
      const index = rows.findIndex((row) => row.label === label);
      if (index < 0) return;
      const x = points[index].x;
      doc.setDrawColor('#c38b4d');
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.line(x, frame.origin.y - frame.height, x, frame.origin.y);
      doc.setLineDashPattern([], 0);
    });
    doc.setDrawColor(GREEN);
    doc.setLineWidth(0.8);
    points.slice(1).forEach((point, index) => doc.line(points[index].x, points[index].y, point.x, point.y));
    doc.setFillColor(GREEN);
    points.forEach((point) => doc.circle(point.x, point.y, 0.9, 'F'));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(MUTED);
    rows.forEach((row, index) => {
      if (index % Math.ceil(rows.length / 7) === 0 || index === rows.length - 1) doc.text(row.label, points[index].x, frame.origin.y + 4, { align: 'center' });
    });
    doc.text(number(max, 0), frame.origin.x - 2, frame.origin.y - frame.height + 1, { align: 'right' });
    doc.text(number(min, 0), frame.origin.x - 2, frame.origin.y, { align: 'right' });
    y += frame.totalHeight + 7;
  };
  const barChart = (title: string, rows: Array<{ label: string; value: number }>, colors?: string[]) => {
    const frame = chartFrame(title);
    const max = Math.max(...rows.map((row) => row.value), 1);
    const slot = frame.width / rows.length;
    const barWidth = Math.min(slot * 0.62, 18);
    doc.setDrawColor('#d9e2dc');
    doc.line(frame.origin.x, frame.origin.y, frame.origin.x + frame.width, frame.origin.y);
    rows.forEach((row, index) => {
      const height = (row.value / max) * frame.height;
      const x = frame.origin.x + slot * index + (slot - barWidth) / 2;
      doc.setFillColor(colors?.[index] ?? GREEN);
      doc.roundedRect(x, frame.origin.y - height, barWidth, height, 1, 1, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(MUTED);
      doc.text(row.label, x + barWidth / 2, frame.origin.y + 4, { align: 'center' });
      doc.text(number(row.value), x + barWidth / 2, frame.origin.y - height - 2, { align: 'center' });
    });
    y += frame.totalHeight + 7;
  };

  // Capa
  doc.setFillColor(DARK);
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
  doc.setFillColor('#235442');
  doc.circle(190, 20, 54, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#b8dfc9');
  doc.setFontSize(10);
  doc.text('LABORATÓRIO DE INVESTIGAÇÃO', MARGIN, 55);
  doc.setTextColor('#ffffff');
  doc.setFontSize(30);
  doc.text('Pesquisa Exploratória', MARGIN, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(18);
  doc.text('Projeto Metrô — Salvador', MARGIN, 88);
  doc.setFillColor('#d99a49');
  doc.roundedRect(MARGIN, 104, 37, 9, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('EM CONSTRUÇÃO', MARGIN + 18.5, 109.8, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor('#d8e8df');
  doc.text('Jessica Andrade', MARGIN, 132);
  doc.text('Análise de 06/11/2026', MARGIN, 140);
  const disclaimer = 'Este documento apresenta resultados descritivos e exploratórios. Associações observadas não substituem as estimações oficiais nem implicam causalidade.';
  doc.setFontSize(9);
  doc.setTextColor('#bfd1c7');
  doc.text(doc.splitTextToSize(disclaimer, 130), MARGIN, 250);

  addPage();
  heading(1, 'Resumo da pesquisa');
  labelValue('Período', data.panel.period);
  labelValue('Unidade', data.panel.unit);
  labelValue('Total de CEPs', number(data.panel.ceps));
  labelValue('Observações CEP × ano', number(data.panel.observations));
  labelValue('CEPs balanceados', number(data.panel.balanced_ceps));
  labelValue('Estações', `${number(data.treatment.operational_stations)} operacionais; ${number(data.treatment.station_catalog_rows)} no cadastro`);
  labelValue('Outcomes', '4 reconstruídos; FAAR pendente de fórmula documentada');
  text(disclaimer, { size: 8.5, color: AMBER, bold: true, gap: 5 });

  heading(2, 'Principais descobertas');
  data.insights.filter((item) => item.destaque).forEach((item) => {
    text(item.titulo, { bold: true, size: 9.2, color: DARK, gap: 1.5 });
    text(item.evidencia, { size: 8.4, color: MUTED, indent: 3, gap: 3 });
  });

  heading(3, 'Qualidade dos dados');
  bullet(`A base contém ${number(data.panel.ceps)} CEPs; ${number(data.panel.balanced_ceps)} aparecem nos 14 anos e ${number(data.panel.nonbalanced_ceps)} compõem o painel não balanceado.`);
  Object.entries(data.eda.quality.fields).forEach(([key, item]) => {
    const label = ({ nearest_distance_m: 'Distância', vv_medio_inscricao: 'Valor venal', soma_area_construida: 'Área construída', soma_area_terreno: 'Área do terreno', qtde_inscricoes: 'Inscrições', qtde_transacoes_itiv: 'Transações' } as Record<string, string>)[key] ?? key;
    bullet(`${label}: ${number(item.missing_panel)} ausências e ${number(item.zero_panel)} zeros no painel; ${number(item.missing_source_cells)} células brutas ausentes.`);
  });
  const annual = data.eda.quality.annual;
  const change2014 = annual.find((item) => item.year === 2014);
  const change2023 = annual.find((item) => item.year === 2023);
  bullet(`Mudanças importantes: em 2014 entraram ${number(change2014?.entries)} CEPs; em 2023 entraram ${number(change2023?.entries)} e saíram ${number(change2023?.exits)}.`);
  lineChart('Composição anual do painel', annual.map((item) => ({ label: String(item.year), value: item.cep_year_rows })));
  const outcome = data.eda.outcomes.vv_medio_inscricao;
  barChart('Distribuição do valor venal por inscrição — contagem por faixa até P99', outcome.histogram.bins.slice(0, 10).map((item, index) => ({ label: String(index + 1), value: item.n })));

  heading(4, 'Espaço e metrô');
  bullet(`A matriz reúne ${number(data.treatment.matrix_ceps)} CEPs. A distância mediana à estação mais próxima é ${number(data.eda.space.distance_summary.median)} m.`);
  bullet(`Linha mais próxima: ${data.eda.space.nearest_lines.map((item) => `${item.nearest_line}: ${number(item.ceps)} CEPs`).join('; ')}.`);
  bullet(`${number(data.eda.space.distance_outliers.above_100km)} CEPs estão a mais de 100 km; a maior distância exige verificação geográfica.`);
  barChart('CEPs por distância cumulativa', data.eda.space.cumulative_radii.map((item) => ({ label: `${item.radius_m}m`, value: item.ceps })));
  const lineRows = ['Linha 1', 'Linha 2'].map((line) => ({
    label: line.replace('Linha ', 'L'),
    value: data.eda.space.line_comparison_2013_1200m[line as 'Linha 1' | 'Linha 2'].profile_2013.vv_medio_inscricao.median ?? 0,
  }));
  barChart('Linha 1 × Linha 2 — mediana do valor venal/inscrição em 2013', lineRows, ['#277d9b', '#a26eae']);

  heading(5, 'Evolução temporal');
  bullet('As séries são descritivas: mudanças de composição, cadastro e avaliação podem coincidir com a expansão da rede. As marcas de abertura contextualizam, mas não identificam causalidade.');
  const timeRows = data.eda.time.all_ceps.map((item) => ({ label: String(item.year), value: item.outcomes.vv_medio_inscricao.median ?? 0 }));
  lineChart('Mediana anual do valor venal por inscrição', timeRows, data.eda.time.opening_events.map((item) => String(item.year)));
  data.eda.time.opening_events.forEach((item) => bullet(`${item.year}: ${item.stations.join(', ')} (${number(item.count)} inaugurações no cadastro).`));

  heading(6, 'Insights mais relevantes');
  data.insights.filter((item) => item.destaque || ['Forte', 'Alerta metodológico'].includes(item.nivel)).forEach((item) => {
    text(`${item.categoria} · ${item.nivel} — ${item.titulo}`, { bold: true, size: 8.8, color: DARK, gap: 1.5 });
    text(`Evidência: ${item.evidencia}`, { size: 8.2, color: MUTED, indent: 3, gap: 1.5 });
    text(`Próximo passo: ${item.proximo_passo}`, { size: 8.2, color: GREEN, indent: 3, gap: 3 });
  });

  heading(7, 'Estimações exploratórias');
  labelValue('Metodologia analisada', data.methodology.exploratory);
  data.estimates.slice(0, 6).forEach((item) => {
    const interval = item.ci_low === undefined ? item.uncertainty ?? 'incerteza não calculada' : `IC 95% [${number(item.ci_low, 2)}; ${number(item.ci_high, 2)}]`;
    bullet(`${item.method}; ${item.outcome}; ${item.radius_m} m; ${item.timing}: ATT ${number(item.att, 2)}; N ${number(item.n)}; ${interval}.`);
  });
  text(`Limitação: ${data.methodology.recommendation}`, { size: 8.5, color: AMBER, bold: true });

  const eventStudy = data.treatment.sample.event_studies.soma_area_construida;
  if (eventStudy?.length) lineChart('Event study exploratório — área construída', eventStudy.map((item) => ({ label: String(item.relative_year), value: item.att })));

  heading(8, 'Robustez');
  Object.entries(data.treatment.sample.pretrends).forEach(([outcomeKey, result]) => bullet(`${outcomeKey}: teste conjunto exploratório de pré-tendências, p-valor ${number(result.joint_p_value, 3)}. O teste não valida tendências paralelas por si só.`));
  Object.entries(data.treatment.sample.sensitivity).forEach(([outcomeKey, rows]) => {
    rows.slice(0, 5).forEach((row) => bullet(`${outcomeKey} · ${row.transformation}: ATT grupo-tempo ${number(row.cs_att, 2)}; imputação ${number(row.imputation_att, 2)}; ${number(row.ceps)} CEPs.`));
  });

  heading(9, 'Recomendações');
  text('Dados', { bold: true, size: 10, color: DARK });
  data.recommendations.dados.forEach((item) => bullet(`${item.titulo} — ${item.status}.`));
  text('Metodologia e econometria', { bold: true, size: 10, color: DARK });
  data.recommendations.econometricas.forEach((item) => bullet(`${item.titulo} — ${item.status}.`));

  heading(10, 'O que ainda não sabemos');
  data.unknowns.forEach((item) => bullet(item.pergunta));
  text('Este relatório registra o estado atual da investigação. Resultados, testes e recomendações poderão ser atualizados durante o desenvolvimento.', { size: 8.5, color: AMBER, bold: true, gap: 4 });

  const pages = doc.getNumberOfPages();
  for (let page = 2; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor('#dfe6e1');
    doc.line(MARGIN, PAGE_HEIGHT - 12, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor('#718078');
    doc.text('GeoMetrô Salvador · Pesquisa Exploratória · 06/11/2026', MARGIN, PAGE_HEIGHT - 7);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 7, { align: 'right' });
  }

  doc.save('pesquisa_exploratoria_geometro_2026-11-06.pdf');
}
