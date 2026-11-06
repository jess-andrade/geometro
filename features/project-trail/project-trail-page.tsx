'use client';

import { ArrowDown, ArrowRight, Check, ChevronDown, ExternalLink, Layers3, Milestone, Route, Sparkles, Target } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { PROJECT_DRIVE_URL, trailSections, type TrailSection, type TrailStage } from '@/data/project-trail';
import { StageLibrary } from './stage-library';

type Filter='todas'|'processo'|'resultados';

export function ProjectTrailPage(){
  const [filter,setFilter]=useState<Filter>('todas');
  const [open,setOpen]=useState<Set<string>>(()=>new Set(['georreferenciamento']));
  const visible=useMemo(()=>trailSections.filter((section)=>filter==='todas'||(filter==='resultados'?section.status==='Resultados disponíveis':section.status==='Concluída')),[filter]);
  const toggle=(slug:string)=>setOpen((current)=>{const next=new Set(current);if(next.has(slug))next.delete(slug);else next.add(slug);return next;});
  const jump=(section:TrailSection)=>{setFilter('todas');setOpen((current)=>new Set(current).add(section.slug));requestAnimationFrame(()=>document.getElementById(section.slug)?.scrollIntoView({behavior:'smooth',block:'start'}));};

  return <section className="animate-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="relative overflow-hidden rounded-[30px] bg-[#17372d] px-5 py-7 text-white shadow-[0_22px_70px_rgba(20,48,39,.15)] sm:px-8 sm:py-9">
      <div aria-hidden className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-white/10"/><div aria-hidden className="absolute -bottom-44 right-32 h-72 w-72 rounded-full border border-white/[.07]"/>
      <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.17em] text-[#a9cbbd]"><Milestone size={15}/>A história da pesquisa</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Trilha do Projeto</h1><p className="mt-3 max-w-3xl text-base leading-7 text-[#d8e6e0]">Da base original aos resultados: um percurso navegável pelas decisões, transformações e entregas do GeoMetrô Salvador.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[#a9beb6]">Abra uma macroetapa para acompanhar entrada, processo e saída; depois explore os marcos e a biblioteca de arquivos daquela fase.</p></div>
        <a href={PROJECT_DRIVE_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold transition hover:bg-white/15">Pasta geral no Drive <ExternalLink size={14}/></a>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-4">{[
        ['6','macroetapas'],['13','marcos documentados'],['2011–2024','período da base'],['5','outcomes estimados'],
      ].map(([value,label])=><div key={label} className="bg-white/[.055] px-4 py-4"><p className="text-lg font-semibold">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[.11em] text-[#9fb6ad]">{label}</p></div>)}</div>
    </header>

    <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6" aria-label="Visão geral das macroetapas">{trailSections.map((section)=><button key={section.slug} onClick={()=>jump(section)} className="group rounded-2xl border border-[#dce4df] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className="flex items-center justify-between"><span className="grid h-8 w-8 place-items-center rounded-xl text-xs font-bold" style={{backgroundColor:section.soft,color:section.color}}>{section.number}</span><ArrowRight size={14} className="text-[#a3ada8] transition-transform group-hover:translate-x-0.5"/></span><strong className="mt-3 block text-xs leading-5">{section.title}</strong><small className="mt-1 block text-[10px] text-[#89948f]">{section.stages.length} {section.stages.length===1?'marco':'marcos'}</small></button>)}</section>

    <section className="sticky top-0 z-20 -mx-4 mt-5 border-y border-[#dce4df] bg-[#f5f7f4]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"><div className="soft-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filtrar etapas">{([['todas','Toda a trilha'],['processo','Etapas concluídas'],['resultados','Resultados disponíveis']] as const).map(([key,label])=><button key={key} onClick={()=>setFilter(key)} className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${filter===key?'bg-[#19382e] text-white':'border border-[#d8e1dc] bg-white text-[#65716c] hover:border-[#8eaaa0]'}`}>{label}</button>)}</div><div className="flex items-center gap-2"><button onClick={()=>setOpen(new Set(visible.map((section)=>section.slug)))} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[#176b52] hover:bg-[#e7f0eb]">Expandir todas</button><span className="h-4 w-px bg-[#d5ded9]"/><button onClick={()=>setOpen(new Set())} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[#65716c] hover:bg-[#e9eeeb]">Recolher todas</button></div></div>
    </section>

    <div className="mx-auto mt-8 max-w-6xl">{visible.map((section,index)=><MacroStage key={section.slug} section={section} isOpen={open.has(section.slug)} isLast={index===visible.length-1} onToggle={()=>toggle(section.slug)}/>)}</div>
  </section>;
}

function MacroStage({section,isOpen,isLast,onToggle}:{section:TrailSection;isOpen:boolean;isLast:boolean;onToggle:()=>void}){
  return <article id={section.slug} className="scroll-mt-32 grid grid-cols-[44px_minmax(0,1fr)] gap-3 sm:grid-cols-[64px_minmax(0,1fr)] sm:gap-5">
    <div className="relative flex justify-center"><span style={{backgroundColor:section.color}} className="relative z-10 grid h-11 w-11 place-items-center rounded-2xl text-sm font-bold text-white shadow-[0_0_0_6px_#f5f7f4] sm:h-[52px] sm:w-[52px]">{section.number}</span>{!isLast&&<span aria-hidden className="absolute bottom-0 top-11 w-px bg-[#cbd8d2] sm:top-[52px]"/>}</div>
    <div className={`mb-6 overflow-hidden rounded-[24px] border bg-white transition ${isOpen?'border-[#b8c9c1] shadow-[0_16px_42px_rgba(25,55,46,.08)]':'border-[#dce4df] hover:border-[#c1cfc8]'}`}>
      <button onClick={onToggle} aria-expanded={isOpen} aria-controls={`${section.slug}-content`} className="flex w-full items-start gap-4 p-5 text-left sm:p-6">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.11em]" style={{backgroundColor:section.soft,color:section.color}}>{section.kicker}</span><Status status={section.status}/></div><h2 className="mt-3 text-xl font-semibold tracking-[-.035em] sm:text-2xl">{section.title}</h2><p className="mt-2 max-w-3xl text-xs leading-5 text-[#68746f] sm:text-sm sm:leading-6">{section.summary}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold uppercase tracking-[.08em] text-[#8b9691]"><span>{section.stages.length} {section.stages.length===1?'marco':'marcos'}</span><span>Biblioteca própria</span></div></div><ChevronDown size={19} className={`mt-1 shrink-0 text-[#70807a] transition-transform ${isOpen?'rotate-180':''}`}/>
      </button>
      {isOpen&&<div id={`${section.slug}-content`} className="border-t border-[#e3e9e5] px-5 pb-6 pt-5 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-3"><StoryCard title="Entrada" icon={<ArrowDown size={15}/>} color={section.color}>{section.input}</StoryCard><StoryCard title="Processo" icon={<Route size={15}/>} color={section.color}>{section.process}</StoryCard><StoryCard title="Saída" icon={<ArrowRight size={15}/>} color={section.color}>{section.output}</StoryCard></div>
        <div className="mt-3 flex items-start gap-3 rounded-2xl p-4" style={{backgroundColor:section.soft}}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white" style={{color:section.color}}><Sparkles size={17}/></span><div><p className="text-[9px] font-bold uppercase tracking-[.12em]" style={{color:section.color}}>Produto da etapa</p><p className="mt-1 text-xs font-semibold text-[#35413d]">{section.product}</p></div></div>
        <div className="mt-6"><div className="flex items-center gap-2"><Layers3 size={15} style={{color:section.color}}/><h3 className="text-[10px] font-bold uppercase tracking-[.13em] text-[#65716c]">Marcos e subetapas</h3><span className="h-px flex-1 bg-[#e0e6e2]"/></div><div className="mt-3 space-y-2">{section.stages.map((stage,index)=><Substage key={stage.id} stage={stage} index={index+1} color={section.color} soft={section.soft}/>)}</div></div>
        <StageLibrary stage={section.slug} color={section.color} title={section.title}/>
      </div>}
    </div>
  </article>;
}

function Substage({stage,index,color,soft}:{stage:TrailStage;index:number;color:string;soft:string}){
  const [open,setOpen]=useState(false);
  return <article className="overflow-hidden rounded-2xl border border-[#dfe6e2] bg-[#fbfcfb]"><button onClick={()=>setOpen((value)=>!value)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[10px] font-bold" style={{backgroundColor:soft,color}}>{String(index).padStart(2,'0')}</span><span className="min-w-0 flex-1"><strong className="block text-xs sm:text-sm">{stage.title}</strong><span className="mt-1 block text-[11px] leading-5 text-[#74807b]">{stage.summary}</span></span><ChevronDown size={16} className={`mt-1 shrink-0 text-[#87928d] transition-transform ${open?'rotate-180':''}`}/></button>{open&&<div className="border-t border-[#e4e9e6] bg-white p-4"><div className="grid gap-3 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-xl bg-[#f5f7f5] p-3"><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.1em] text-[#71807a]"><Target size={12}/>Objetivo</p><p className="mt-2 text-[11px] leading-5 text-[#5f6c67]">{stage.objective}</p></div><div className="rounded-xl border border-[#e1e7e3] bg-white p-3"><p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#71807a]">Como foi feito</p><ol className="mt-2 space-y-2">{stage.procedure.map((item,step)=><li key={item} className="flex gap-2 text-[11px] leading-5 text-[#5f6c67]"><span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-bold" style={{backgroundColor:soft,color}}>{step+1}</span>{item}</li>)}</ol></div></div><div className="mt-3 grid gap-3 md:grid-cols-2"><Mini title="Entrada">{stage.input}</Mini><Mini title="Entrega">{stage.outputs.join(' · ')}</Mini></div>{stage.materials.length>0&&<p className="mt-3 text-[10px] leading-5 text-[#7d8984]"><strong>Citados na documentação:</strong> {stage.materials.map((material)=>material.name).join(' · ')}</p>}{stage.note&&<p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[10px] leading-5 text-amber-950"><strong>Nota metodológica.</strong> {stage.note}</p>}{stage.link&&<a href={stage.link.href} className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{color}}>{stage.link.label}<ArrowRight size={12}/></a>}</div>}</article>;
}

function StoryCard({title,icon,color,children}:{title:string;icon:ReactNode;color:string;children:ReactNode}){return <section className="rounded-2xl border border-[#e0e6e2] p-4"><h3 className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.12em]" style={{color}}>{icon}{title}</h3><p className="mt-2 text-[11px] leading-5 text-[#5f6c67]">{children}</p></section>}
function Mini({title,children}:{title:string;children:ReactNode}){return <div className="rounded-xl border border-[#e3e8e5] p-3"><strong className="text-[9px] uppercase tracking-[.1em] text-[#7a8580]">{title}</strong><p className="mt-1 text-[10px] leading-5 text-[#626f69]">{children}</p></div>}
function Status({status}:{status:TrailSection['status']}){return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] ${status==='Resultados disponíveis'?'bg-violet-50 text-violet-700':'bg-emerald-50 text-emerald-700'}`}><Check size={10}/>{status}</span>}
