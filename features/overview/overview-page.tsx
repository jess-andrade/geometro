import { ArrowRight, BookOpenText, Database, Map, Route, TrainFront } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

const cards = [
  { label:'Linhas cadastradas', value:'—', icon:Route, note:'Aguardando importação' },
  { label:'Estações cadastradas', value:'—', icon:TrainFront, note:'Aguardando importação' },
  { label:'Pontos analisados', value:'0', icon:Database, note:'Base ainda vazia' },
  { label:'Versão do método', value:'v0.1', icon:BookOpenText, note:'Parâmetros exploratórios' },
];

export function OverviewPage() {
  return <section className="animate-in p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Visão geral" title="Pesquisa urbana, vista no território" description="Um ambiente único para organizar dados, medir proximidades e documentar como o metrô se relaciona com a dinâmica urbana de Salvador." actions={<Link href="/?secao=mapa" className="inline-flex items-center gap-2 rounded-xl bg-[#176b52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#125b45]">Abrir mapa <ArrowRight size={15}/></Link>}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,icon:Icon,note}) => <article key={label} className="rounded-2xl border border-[#dfe5e1] bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#6f7a76]">{label}</span><Icon size={16} className="text-[#7b8983]"/></div><p className="mt-5 text-3xl font-semibold tracking-[-.05em]">{value}</p><p className="mt-1 text-[11px] text-[#8a9490]">{note}</p></article>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]"><article className="overflow-hidden rounded-[22px] border border-[#dbe3de] bg-[#1b2b25] p-6 text-white sm:p-8"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/75"><Map size={13}/> Núcleo do estudo</span><h2 className="mt-6 max-w-xl text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Da estação ao trilho: duas escalas de proximidade.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">A plataforma distingue acesso ao transporte e exposição ao traçado ferroviário, preservando cada observação como ponto georreferenciado — não necessariamente como imóvel individual.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold">Distância da estação</p><p className="mt-1 text-xs leading-5 text-white/55">Menor distância até a estação mais próxima.</p></div><div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold">Distância da linha</p><p className="mt-1 text-xs leading-5 text-white/55">Menor distância até o traçado ferroviário.</p></div></div></article>
      <article className="rounded-[22px] border border-[#dfe5e1] bg-white p-6"><h2 className="text-sm font-semibold">Próximos passos da base</h2><ol className="mt-5 space-y-5">{['Importar traçados das linhas','Cadastrar estações e atributos','Carregar pontos georreferenciados','Calcular métricas espaciais'].map((text,index)=><li key={text} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#edf3ef] text-[11px] font-semibold text-[#176b52]">{index+1}</span><div><p className="text-xs font-semibold text-[#43504b]">{text}</p><p className="mt-1 text-[11px] text-[#8a9490]">Pendente</p></div></li>)}</ol></article></div>
  </section>;
}
