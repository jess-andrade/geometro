import { BookOpenText, Clock3, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

const sections = [
  ['Objetivo','Investigar a relação entre a proximidade ao sistema metroviário de Salvador e padrões de valorização urbana.'],
  ['Unidade espacial','Observações georreferenciadas derivadas de CEP, logradouro ou outra unidade espacial. Um ponto não representa necessariamente um imóvel individual.'],
  ['Fontes de dados','Esta seção registrará origem, cobertura temporal, licenças e procedimentos de preparação de cada base importada.'],
  ['Georreferenciamento','As regras de transformação de endereços ou unidades espaciais em coordenadas serão documentadas com seus controles de qualidade.'],
  ['Distância até estação','Menor distância entre o ponto analisado e a estação de metrô mais próxima, calculada em metros.'],
  ['Distância até linha','Menor distância entre o ponto e o traçado ferroviário, usada como possível proxy de exposição à passagem de trens, ruído e vibração.'],
  ['Sistema de coordenadas','Armazenamento geográfico em WGS 84 (EPSG:4326); operações métricas executadas com geography ou projeção adequada no PostGIS.'],
  ['Zonas de influência','Faixas configuráveis de 0–50 m, 50–100 m, 100–250 m, 250–500 m, 500–1.000 m e acima de 1.000 m.'],
  ['Hipóteses econômicas','As hipóteses e estratégias de identificação serão incorporadas conforme o desenho da pesquisa evoluir.'],
  ['Limitações','Cobertura, precisão posicional, viés de geocodificação e interpretação causal deverão ser avaliados explicitamente.'],
];

export function MethodologyPage() {
  return <section className="animate-in p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Documento vivo" title="Metodologia" description="Premissas, decisões técnicas e limites do estudo reunidos em uma estrutura que pode evoluir com a pesquisa." actions={<span className="inline-flex items-center gap-2 rounded-full border border-[#dbe3de] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f6b66]"><Clock3 size={13}/>Versão 0.1</span>}/>
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,760px)]"><aside className="h-fit rounded-2xl border border-[#dfe5e1] bg-white p-3 xl:sticky xl:top-24"><p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-[.1em] text-[#8a9490]">Neste documento</p>{sections.map(([title],index)=><a key={title} href={`#metodo-${index}`} className="block rounded-lg px-2 py-2 text-xs font-medium text-[#65716c] hover:bg-[#eef3f0] hover:text-[#176b52]">{title}</a>)}</aside><article className="rounded-[22px] border border-[#dfe5e1] bg-white px-6 py-3 sm:px-9">{sections.map(([title,text],index)=><section key={title} id={`metodo-${index}`} className="border-b border-[#e8ece9] py-7 last:border-0"><div className="flex items-center gap-2"><span className="font-mono text-[10px] font-semibold text-[#8a9892]">{String(index+1).padStart(2,'0')}</span><h2 className="text-base font-semibold tracking-[-.02em]">{title}</h2></div><p className="mt-3 text-sm leading-7 text-[#66736e]">{text}</p></section>)}</article></div>
    <div className="mt-5 flex max-w-[1015px] items-start gap-3 rounded-2xl bg-[#1b2b25] p-4 text-white"><BookOpenText size={18} className="mt-0.5 shrink-0 text-[#8bc8ad]"/><div><p className="text-xs font-semibold">Metodologia em construção</p><p className="mt-1 text-[11px] leading-5 text-white/60">Datas, autores, fontes e mudanças entre versões serão registrados nas próximas etapas.</p></div><Info size={14} className="ml-auto text-white/35"/></div>
  </section>;
}
