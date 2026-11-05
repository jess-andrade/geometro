'use client';

import {
  ArrowDown, ArrowRight, BarChart3, Blocks, Check, ChevronDown, CircleDot, Database,
  ExternalLink, FileCode2, FileSpreadsheet, GitBranch, MapPin, Milestone, Network,
  PanelTop, Route, Ruler, SearchCheck, Sigma, Sparkles, Target, TrainFront,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { outcomeData, outcomeOrder } from '@/data/estimacoes';
import { PROJECT_DRIVE_URL, trailStages, type TrailPhase, type TrailStage } from '@/data/project-trail';

type Filter='todas'|TrailPhase;

const phaseLabels:Record<Filter,string>={todas:'Todas',georreferenciamento:'Georreferenciamento',espacial:'Preparação espacial',estimacao:'Estimação',resultados:'Resultados'};
const phaseMeta:Record<TrailPhase,{label:string;color:string;soft:string}>={
  georreferenciamento:{label:'Georreferenciamento',color:'#176b52',soft:'#e8f2ed'},
  espacial:{label:'Preparação espacial',color:'#287c88',soft:'#e7f2f3'},
  estimacao:{label:'Estimação econométrica',color:'#9a5b2d',soft:'#f8eee6'},
  resultados:{label:'Resultados',color:'#6551a3',soft:'#efecf8'},
};
const stageIcons=[Database,Blocks,MapPin,SearchCheck,Target,GitBranch,TrainFront,Ruler,PanelTop,Network,Sigma,BarChart3,Sparkles];

export function ProjectTrailPage(){
  const [filter,setFilter]=useState<Filter>('todas');
  const [open,setOpen]=useState<Set<string>>(()=>new Set(['base-original']));
  const visible=useMemo(()=>filter==='todas'?trailStages:trailStages.filter(stage=>stage.phase===filter),[filter]);
  const toggle=(id:string)=>setOpen(current=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const setAll=(expanded:boolean)=>setOpen(expanded?new Set(visible.map(stage=>stage.id)):new Set());
  const jump=(id:string)=>{setOpen(current=>new Set(current).add(id));requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}));};

  return <section className="animate-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header className="relative overflow-hidden rounded-[28px] bg-[#17372d] px-5 py-7 text-white shadow-[0_20px_60px_rgba(20,48,39,.14)] sm:px-8 sm:py-9">
      <div aria-hidden className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"/><div aria-hidden className="absolute -right-8 -top-12 h-48 w-48 rounded-full border border-white/10"/>
      <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div><p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.16em] text-[#a9cbbd]"><Milestone size={15}/>Trajetória da pesquisa</p><h1 className="mt-3 text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Trilha do Projeto</h1><p className="mt-3 max-w-3xl text-base leading-7 text-[#d8e6e0]">Da base original ao georreferenciamento e às estimações do impacto do metrô de Salvador.</p><p className="mt-2 max-w-3xl text-sm leading-6 text-[#a9beb6]">Explore as etapas da pesquisa, os dados produzidos, as decisões metodológicas e os resultados acumulados ao longo do projeto.</p></div>
        <a href={PROJECT_DRIVE_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold transition hover:bg-white/15">Abrir pasta do projeto no Drive <ExternalLink size={14}/></a>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 xl:grid-cols-5">{[
        ['Base','2011–2024'],['Unidade espacial','CEP'],['Georreferenciamento','4 etapas'],['Estimações','5 outcomes'],['Software','Stata'],
      ].map(([label,value])=><div key={label} className="bg-white/[.055] px-4 py-3.5"><p className="text-[10px] uppercase tracking-[.12em] text-[#9fb6ad]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>)}</div>
    </header>

    <section className="sticky top-0 z-20 -mx-4 mt-5 border-y border-[#dce4df] bg-[#f5f7f4]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="soft-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar fases">{(Object.keys(phaseLabels) as Filter[]).map(key=><button key={key} onClick={()=>setFilter(key)} className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${filter===key?'bg-[#19382e] text-white':'border border-[#d8e1dc] bg-white text-[#65716c] hover:border-[#8eaaa0]'}`}>{phaseLabels[key]}</button>)}</div>
        <div className="flex items-center gap-2"><button onClick={()=>setAll(true)} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[#176b52] hover:bg-[#e7f0eb]">Expandir todas</button><span className="h-4 w-px bg-[#d5ded9]"/><button onClick={()=>setAll(false)} className="rounded-lg px-3 py-2 text-[11px] font-semibold text-[#65716c] hover:bg-[#e9eeeb]">Recolher todas</button></div>
      </div>
    </section>

    <nav className="mt-5 rounded-[22px] border border-[#dce4df] bg-white p-4" aria-label="Navegação rápida da trilha">
      <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#7a8580]">Navegação rápida</p><p className="mt-1 text-xs text-[#68746f]">13 marcos conectados da base aos resultados.</p></div><span className="text-xs font-semibold text-[#176b52]">100% documentado</span></div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7ede9]"><div className="h-full w-full rounded-full bg-gradient-to-r from-[#176b52] via-[#287c88] to-[#6551a3]"/></div>
      <div className="soft-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">{[
        ['base-original','1','Base'],['organizacao-ceps','2–6','Georreferenciamento'],['representacao-metro','7–8','Distâncias'],['preparacao-econometrica','9–10','Preparação'],['estrategia','11','Stata'],['estimacoes-stata','12','Outcomes'],['resultados','13','Resultados'],
      ].map(([id,n,label])=><button key={id} onClick={()=>jump(id)} className="group flex shrink-0 items-center gap-2 rounded-xl border border-[#e0e6e2] px-3 py-2 text-left hover:border-[#a8bdb4] hover:bg-[#f7f9f7]"><span className="grid h-6 min-w-6 place-items-center rounded-md bg-[#edf2ef] px-1.5 text-[10px] font-bold text-[#176b52] group-hover:bg-[#dfece5]">{n}</span><span className="text-[11px] font-semibold text-[#56625d]">{label}</span></button>)}</div>
    </nav>

    <div className="mx-auto mt-7 max-w-6xl">
      {visible.map((stage,index)=><TimelineStage key={stage.id} stage={stage} isOpen={open.has(stage.id)} isLast={index===visible.length-1} onToggle={()=>toggle(stage.id)}/>) }
    </div>
  </section>;
}

function TimelineStage({stage,isOpen,isLast,onToggle}:{stage:TrailStage;isOpen:boolean;isLast:boolean;onToggle:()=>void}){
  const Icon=stageIcons[stage.number-1]??CircleDot;const phase=phaseMeta[stage.phase];
  return <article id={stage.id} className="scroll-mt-36 grid grid-cols-[42px_minmax(0,1fr)] gap-3 sm:grid-cols-[58px_minmax(0,1fr)] sm:gap-5">
    <div className="relative flex justify-center"><span style={{background:phase.color}} className="relative z-10 grid h-10 w-10 place-items-center rounded-full text-white shadow-[0_0_0_5px_#f5f7f4] sm:h-12 sm:w-12"><Icon size={18}/></span>{!isLast&&<span aria-hidden className="absolute bottom-0 top-10 w-px bg-[#cbd8d2] sm:top-12"/>}</div>
    <div className={`mb-5 overflow-hidden rounded-[22px] border bg-white transition-all ${isOpen?'border-[#b9ccc3] shadow-[0_14px_35px_rgba(25,55,46,.08)]':'border-[#dce4df] hover:border-[#c3d1ca]'}`}>
      <button onClick={onToggle} aria-expanded={isOpen} aria-controls={`${stage.id}-content`} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span style={{background:phase.soft,color:phase.color}} className="rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.11em]">{phase.label}</span><StatusBadge status={stage.status}/></div><h2 className="mt-2.5 text-base font-semibold tracking-[-.025em] sm:text-lg"><span className="mr-2 text-[#9ba6a1]">{String(stage.number).padStart(2,'0')}</span>{stage.title}</h2><p className="mt-1 text-xs leading-5 text-[#68746f] sm:text-sm">{stage.summary}</p><p className="mt-2 text-[10px] font-medium uppercase tracking-[.09em] text-[#8b9691]">{stage.meta}</p></div><ChevronDown size={18} className={`mt-1 shrink-0 text-[#70807a] transition-transform ${isOpen?'rotate-180':''}`}/>
      </button>
      {isOpen&&<div id={`${stage.id}-content`} className="border-t border-[#e4e9e6] px-4 pb-5 pt-5 sm:px-5 sm:pb-6">
        <StageVisual stage={stage}/>
        <div className="mt-5 grid gap-3 lg:grid-cols-3"><Detail title="Objetivo" icon={<Target size={15}/>}><p>{stage.objective}</p></Detail><Detail title="Entrada" icon={<ArrowDown size={15}/>}><p>{stage.input}</p></Detail><Detail title="Saída para a próxima etapa" icon={<ArrowRight size={15}/>}><ul>{stage.outputs.map(item=><li key={item}>{item}</li>)}</ul></Detail></div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_.65fr]"><Detail title="Como foi feito" icon={<Route size={15}/>}><ol>{stage.procedure.map((item,index)=><li key={item}><span>{index+1}</span>{item}</li>)}</ol></Detail><Detail title="Ferramentas" icon={<Blocks size={15}/>}><div className="flex flex-wrap gap-1.5">{stage.tools.map(tool=><span key={tool} className="rounded-lg border border-[#dce4df] bg-[#f8faf8] px-2.5 py-1.5 text-[10px] font-semibold text-[#56645f]">{tool}</span>)}</div></Detail></div>
        {stage.variables&&<div className="mt-3 rounded-2xl bg-[#f3f6f4] p-4"><h3 className="text-[10px] font-semibold uppercase tracking-[.12em] text-[#6f7c77]">Variáveis e classificações criadas</h3><div className="mt-2.5 flex flex-wrap gap-1.5">{stage.variables.map(variable=><code key={variable} className="rounded-md bg-white px-2 py-1 text-[10px] text-[#3f514a] shadow-sm">{variable}</code>)}</div></div>}
        {stage.note&&<p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-950"><strong>Nota metodológica.</strong> {stage.note}</p>}
        <div className="mt-4 flex flex-col gap-4 border-t border-[#e6ebe8] pt-4 sm:flex-row sm:items-end sm:justify-between"><Materials items={stage.materials}/>{stage.link&&<a href={stage.link.href} className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl bg-[#176b52] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#125b45]">{stage.link.label}<ArrowRight size={14}/></a>}</div>
      </div>}
    </div>
  </article>;
}

function StatusBadge({status}:{status:TrailStage['status']}){return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.09em] ${status==='Resultado disponível'?'bg-violet-50 text-violet-700':'bg-emerald-50 text-emerald-700'}`}><Check size={10}/>{status}</span>}
function Detail({title,icon,children}:{title:string;icon:ReactNode;children:ReactNode}){return <section className="rounded-2xl border border-[#e0e6e2] p-4"><h3 className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.11em] text-[#66736e]">{icon}{title}</h3><div className="mt-2 text-[11px] leading-5 text-[#5e6b66] [&_li]:mt-1.5 [&_ol_span]:mr-2 [&_ol_span]:inline-grid [&_ol_span]:h-5 [&_ol_span]:w-5 [&_ol_span]:place-items-center [&_ol_span]:rounded-full [&_ol_span]:bg-[#e8f1ec] [&_ol_span]:text-[9px] [&_ol_span]:font-bold [&_ol_span]:text-[#176b52] [&_ul_li]:before:mr-2 [&_ul_li]:before:text-[#176b52] [&_ul_li]:before:content-['→']">{children}</div></section>}
function Materials({items}:{items:TrailStage['materials']}){return <div><h3 className="text-[10px] font-semibold uppercase tracking-[.11em] text-[#74807b]">Materiais desta etapa</h3>{items.length?<div className="mt-2 flex flex-wrap gap-2">{items.map(item=><span key={item.name} title="Arquivo documentado; URL individual não cadastrada" className="inline-flex items-center gap-2 rounded-lg border border-[#dfe6e2] bg-white px-2.5 py-1.5 text-[10px] text-[#5d6964]">{item.type.includes('Script')?<FileCode2 size={12}/>:<FileSpreadsheet size={12}/>}<strong className="font-medium">{item.name}</strong><em className="not-italic text-[#919b96]">· {item.type}</em></span>)}</div>:<p className="mt-1.5 text-[10px] text-[#909a95]">Sem URL individual cadastrada; consulte a pasta geral do projeto.</p>}</div>}

function StageVisual({stage}:{stage:TrailStage}){
  if(stage.visual==='table')return <div className="overflow-hidden rounded-2xl border border-[#dfe6e2]"><div className="grid grid-cols-[.65fr_1fr_1fr] bg-[#edf3ef] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[#69766f]"><span>Exercício</span><span>CEP</span><span>Valor venal</span></div>{[['2011','40000-000','R$ •••••'],['2018','40010-000','R$ •••••'],['2024','41740-000','R$ •••••']].map(row=><div key={row[0]} className="grid grid-cols-[.65fr_1fr_1fr] border-t border-[#e7ece9] px-3 py-2 text-[10px] text-[#65716c]">{row.map(cell=><span key={cell}>{cell}</span>)}</div>)}</div>;
  if(stage.visual==='coverage')return <div className="rounded-2xl bg-[#eff5f1] p-4"><div className="grid gap-4 sm:grid-cols-3">{[['75,22','Etapa inicial'],['85,75','Após enriquecimento'],['89,78','Após validação']].map(([value,label],index)=><div key={label}><div className="flex items-end justify-between"><strong className="text-lg text-[#176b52]">{value}%</strong><span className="text-[9px] text-[#7d8984]">{index+1}/3</span></div><div className="mt-2 h-2 rounded-full bg-white"><div className="h-full rounded-full bg-[#42a27d]" style={{width:`${value}%`}}/></div><p className="mt-2 text-[10px] text-[#65716c]">{label}</p></div>)}</div></div>;
  if(stage.visual==='metro')return <div className="relative overflow-hidden rounded-2xl bg-[#eaf2ee] p-5"><div className="absolute inset-0 opacity-50" style={{backgroundImage:'linear-gradient(#d4e1db 1px, transparent 1px),linear-gradient(90deg,#d4e1db 1px,transparent 1px)',backgroundSize:'24px 24px'}}/><svg viewBox="0 0 700 110" className="relative h-24 w-full" aria-label="Esquema das linhas 1 e 2"><path d="M30 72 C150 70 200 18 320 40 S500 85 670 38" fill="none" stroke="#176b52" strokeWidth="7" strokeLinecap="round"/><path d="M190 90 C260 80 300 52 350 43 S500 20 650 72" fill="none" stroke="#287c88" strokeWidth="7" strokeLinecap="round"/>{[80,190,320,455,590].map(x=><circle key={x} cx={x} cy={x===190?70:x===320?40:x===455?64:x===590?54:70} r="7" fill="white" stroke="#253b33" strokeWidth="3"/>)}</svg><div className="relative mt-2 flex flex-wrap gap-3 text-[10px] font-semibold"><span className="text-[#176b52]">— Linha 1</span><span className="text-[#287c88]">— Linha 2</span><span className="text-[#68746f]">● estações</span></div></div>;
  if(stage.visual==='distance')return <div className="grid gap-3 sm:grid-cols-2"><Schematic title="Acesso ao sistema" icon={<MapPin size={18}/>} labels={['CEP','estação mais próxima']}/><Schematic title="Proximidade à infraestrutura" icon={<TrainFront size={18}/>} labels={['CEP','traçado metroviário']}/></div>;
  if(stage.visual==='funnel')return <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#eff4f1] p-4 text-center">{[['20.041 CEPs','Base espacial atual','100%'],['10.756 CEPs','Regras econométricas','72%'],['150.584 observações','CEP × ano','50%']].map(([value,label,width])=><div key={value} className="rounded-xl bg-white px-4 py-2 shadow-sm" style={{width}}><strong className="text-sm text-[#19382e]">{value}</strong><p className="text-[9px] text-[#7a8580]">{label}</p></div>)}</div>;
  if(stage.visual==='strategy')return <div className="rounded-2xl bg-[#f6f0eb] p-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#9a5b2d] text-white"><TrainFront size={18}/></span><div className="h-1 flex-1 rounded-full bg-gradient-to-r from-[#b96e37] to-[#ead4c4]"/></div><div className="mt-3 grid grid-cols-5 gap-1 text-center sm:grid-cols-10">{[200,400,600,800,1000,1200,1400,1600,1800,2000].map(radius=><div key={radius}><span className="mx-auto block h-2 w-px bg-[#9a5b2d]"/><span className="text-[8px] font-semibold text-[#6f5948]">{radius}</span></div>)}</div><p className="mt-2 text-right text-[9px] text-[#806b5a]">distância ao metrô (m)</p></div>;
  if(stage.visual==='outcomes'||stage.visual==='results')return <OutcomeGrid compact={stage.visual==='results'}/>;
  if(stage.visual==='panel')return <Flow items={['Base georreferenciada','Distâncias','Painel CEP × ano','Stata .dta']}/>;
  if(stage.visual==='merge')return <Flow items={['Base original','Coordenadas + precisão','Etapa de origem','Base final']}/>;
  if(stage.visual==='split')return <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><Metric value="15.600" label="localizados"/><span className="hidden self-center text-[#9aa59f] sm:block">+</span><Metric value="5.139" label="pendentes"/></div>;
  return <Flow items={stage.visual==='flow'?['Base anual','CEPs únicos por ano','Lista consolidada']:['Entrada','Processamento','Saída']}/>;
}

function Metric({value,label}:{value:string;label:string}){return <div className="rounded-2xl bg-[#eff5f1] p-4 text-center"><strong className="text-xl text-[#176b52]">{value}</strong><p className="mt-1 text-[10px] uppercase tracking-wide text-[#69766f]">{label}</p></div>}
function Flow({items}:{items:string[]}){return <div className="flex flex-col items-stretch gap-2 rounded-2xl bg-[#f1f5f2] p-4 sm:flex-row sm:items-center">{items.map((item,index)=><div key={item} className="contents"><span className="flex-1 rounded-xl bg-white px-3 py-3 text-center text-[10px] font-semibold text-[#53615c] shadow-sm">{item}</span>{index<items.length-1&&<ArrowRight size={14} className="mx-auto rotate-90 text-[#87a095] sm:rotate-0"/>}</div>)}</div>}
function Schematic({title,icon,labels}:{title:string;icon:ReactNode;labels:string[]}){return <div className="rounded-2xl bg-[#eff5f1] p-4"><p className="text-[10px] font-semibold text-[#65716c]">{title}</p><div className="mt-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#176b52] bg-white text-[#176b52]"><CircleDot size={16}/></span><span className="relative h-px flex-1 border-t border-dashed border-[#7b9b8e]"><em className="absolute left-1/2 top-[-16px] -translate-x-1/2 text-[8px] not-italic text-[#6a7772]">distância</em></span><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#176b52] text-white">{icon}</span></div><div className="mt-2 flex justify-between text-[9px] text-[#74807b]"><span>{labels[0]}</span><span>{labels[1]}</span></div></div>}

function OutcomeGrid({compact}:{compact:boolean}){return <div><div className="mb-3 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[.12em] text-[#7a8580]"><span className="rounded-lg bg-[#19382e] px-2.5 py-1.5 text-white">Mesmo nó de estimação</span><span className="h-px flex-1 bg-[#cad8d1]"/><GitBranch size={14}/><span>5 outcomes</span></div><div className="relative grid gap-3 md:grid-cols-2 xl:grid-cols-5">{outcomeOrder.map((key,index)=>{const data=outcomeData[key];const rows=data.results.filter(row=>row.estimator==='REG'&&row.control_strategy==='complementar').sort((a,b)=>a.radius_m-b.radius_m);const info=outcomeInfo(key);return <article key={key} className="rounded-2xl border border-[#dfe6e2] bg-white p-3.5"><div className="flex items-start justify-between"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e8f1ec] text-[10px] font-bold text-[#176b52]">{index+1}</span><span className="rounded-full bg-violet-50 px-2 py-1 text-[8px] font-bold uppercase text-violet-700">disponível</span></div><h4 className="mt-3 min-h-8 text-xs font-semibold leading-4">{shortOutcome(key)}</h4>{!compact&&<><p className="mt-1 min-h-8 text-[9px] leading-4 text-[#74807b]">{info.description}</p><code className="mt-2 block truncate rounded bg-[#f2f5f3] px-2 py-1 text-[8px] text-[#52615b]" title={info.variable}>{info.variable}</code><MiniChart values={rows.map(row=>row.att)}/></>}<p className="mt-2 text-[9px] leading-4 text-[#7b8681]">10 raios · REG + DRIPW<br/>{data.unit}</p><a href="/estimacoes" className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#176b52]">{compact?'Abrir em Estimações':'Ver resultados'}<ArrowRight size={11}/></a></article>})}</div></div>}
function MiniChart({values}:{values:number[]}){const min=Math.min(...values),max=Math.max(...values),span=max-min||1;const points=values.map((value,index)=>`${(index/(values.length-1))*100},${28-((value-min)/span)*22}`).join(' ');return <svg viewBox="0 0 100 32" className="mt-3 h-8 w-full overflow-visible" preserveAspectRatio="none" aria-label="Prévia do gradiente publicado"><line x1="0" x2="100" y1="28" y2="28" stroke="#dce4df"/><polyline points={points} fill="none" stroke="#176b52" strokeWidth="2" vectorEffect="non-scaling-stroke"/></svg>}
function shortOutcome(key:string){return key==='faar'?'FAAR':key==='area_construida'?'Área construída total':key==='inscricoes'?'Quantidade de inscrições':key==='transacoes_itiv'?'Transações imobiliárias':'Valor venal médio'}
function outcomeInfo(key:string){
  if(key==='faar')return {variable:'faar',description:'Coeficiente de Aproveitamento / FAAR.'};
  if(key==='area_construida')return {variable:'soma_area_construida',description:'Área construída total em m² por CEP.'};
  if(key==='inscricoes')return {variable:'qtde_inscricoes',description:'Inscrições imobiliárias ativas por CEP.'};
  if(key==='transacoes_itiv')return {variable:'qtde_transacoes_itiv',description:'Fluxo do mercado formal de compra e venda.'};
  return {variable:'soma_valor_venal_iptu / qtde_inscricoes',description:'Valor venal médio (R$); distribuição bastante assimétrica.'};
}
