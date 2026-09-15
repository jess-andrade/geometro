'use client';

import { ArrowRight, BookOpenText, Database, Map, Route, TrainFront } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { loadStudySummary } from '@/lib/supabase/queries';
import type { StudySummary } from '@/types/study';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function OverviewPage() {
  const [summary,setSummary]=useState<StudySummary|null>(null);
  const [error,setError]=useState(false);
  useEffect(()=>{loadStudySummary().then(setSummary).catch(()=>setError(true));},[]);
  const cards=[
    {label:'Linhas cadastradas',value:number(summary?.line_count),icon:Route,note:'L1 e L2 · traçado provisório'},
    {label:'Estações na matriz',value:number(summary?.station_count),icon:TrainFront,note:'21 operacionais e 1 planejada'},
    {label:'Pontos analisados',value:number(summary?.point_count),icon:Database,note:'2 outliers em quarentena'},
    {label:'Versão do método',value:summary?.method_version??'—',icon:BookOpenText,note:'Distância à linha via PostGIS'},
  ];
  return <section className="animate-in p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Visão geral" title="Projeto Metrô - UFBA" description="Plataforma de apoio ao estudo de georreferenciamento e proximidade ao sistema metroviário de Salvador." actions={<Link href="/?secao=mapa" className="inline-flex items-center gap-2 rounded-xl bg-[#176b52] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#125b45]">Abrir mapa <ArrowRight size={15}/></Link>}/>
    {error&&<p className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">Não foi possível carregar o resumo validado.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,icon:Icon,note})=><article key={label} className="rounded-2xl border border-[#dfe5e1] bg-white p-5"><div className="flex items-center justify-between"><span className="text-xs font-medium text-[#6f7a76]">{label}</span><Icon size={16} className="text-[#7b8983]"/></div><p className="mt-5 text-3xl font-semibold tracking-[-.05em]">{value}</p><p className="mt-1 text-[11px] text-[#8a9490]">{note}</p></article>)}</div>
    <div className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]"><article className="overflow-hidden rounded-[22px] border border-[#dbe3de] bg-[#1b2b25] p-6 text-white sm:p-8"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/75"><Map size={13}/> Base validada</span><h2 className="mt-6 max-w-xl text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Da estação ao trilho: duas escalas de proximidade.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">A plataforma distingue a distância original da matriz até a estação e a distância PostGIS até o traçado ferroviário. As observações são pontos georreferenciados — não necessariamente imóveis individuais.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><Metric title="Distância da estação" median={summary?.median_station_distance_m}/><Metric title="Distância da linha" median={summary?.median_line_distance_m}/></div></article>
      <article className="rounded-[22px] border border-[#dfe5e1] bg-white p-6"><h2 className="text-sm font-semibold">Estado da base</h2><ol className="mt-5 space-y-5">{['Linhas L1 e L2 disponíveis','22 estações vinculadas','20.041 pontos carregados','Métricas espaciais calculadas'].map((text)=><li key={text} className="flex gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#edf3ef] text-[11px] font-semibold text-[#176b52]">✓</span><div><p className="text-xs font-semibold text-[#43504b]">{text}</p><p className="mt-1 text-[11px] text-[#8a9490]">Concluído</p></div></li>)}</ol><p className="mt-5 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-900"><strong>Nota:</strong> o traçado atual é provisório e está identificado como <code>provisional-track-v1</code>.</p></article></div>
  </section>;
}

function Metric({title,median}:{title:string;median?:number}){return <div className="rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold">{title}</p><p className="mt-2 text-xl font-semibold">{median===undefined?'—':`${Math.round(median).toLocaleString('pt-BR')} m`}</p><p className="mt-1 text-[11px] text-white/50">Mediana da base válida</p></div>;}
function number(value:number|undefined){return value===undefined?'—':value.toLocaleString('pt-BR');}
