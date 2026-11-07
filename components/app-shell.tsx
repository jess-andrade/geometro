'use client';

import { Calculator, FileStack, FlaskConical, LayoutDashboard, MapPinned, Menu, Milestone, PanelLeftClose, PanelLeftOpen, Search, TrainFront, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export type Section = 'visao-geral' | 'georreferenciamento' | 'trilha' | 'estimacoes' | 'pesquisa-exploratoria' | 'materiais';
const items: Array<{ id: Section; label: string; icon: typeof MapPinned }> = [
  { id:'visao-geral', label:'Visão Geral', icon:LayoutDashboard },
  { id:'georreferenciamento', label:'Georreferenciamento', icon:MapPinned },
  { id:'trilha', label:'Trilha do Projeto', icon:Milestone },
  { id:'estimacoes', label:'Estimações', icon:Calculator },
  { id:'pesquisa-exploratoria', label:'Pesquisa Exploratória', icon:FlaskConical },
  { id:'materiais', label:'Materiais', icon:FileStack },
];

export function AppShell({ active, children }: { active: Section; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{
    const timer=window.setTimeout(()=>setCollapsed(window.localStorage.getItem('sidebarCollapsed')==='true'),0);
    return()=>window.clearTimeout(timer);
  },[]);
  const toggleCollapsed=()=>setCollapsed((current)=>{
    const next=!current;
    window.localStorage.setItem('sidebarCollapsed',String(next));
    return next;
  });
  const activeLabel = items.find((item) => item.id === active)?.label ?? 'Visão Geral';
  const hrefFor = (id: Section) => id === 'visao-geral' ? '/' : `/${id}`;
  return (
    <div className={`min-h-screen bg-[#f5f7f4] lg:grid ${collapsed?'lg:grid-cols-[76px_minmax(0,1fr)]':'lg:grid-cols-[252px_minmax(0,1fr)]'} transition-[grid-template-columns] duration-200`}>
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed?'lg:w-[76px] lg:px-2':'lg:w-[252px] lg:px-4'} fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#dde4df] bg-[#fbfcfa] px-4 py-5 transition-[transform,width,padding] duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#176b52] text-white shadow-sm"><TrainFront size={19}/></span><div className={collapsed?'lg:hidden':''}><p className="text-[15px] font-semibold tracking-[-.02em]">GeoMetrô</p><p className="text-[11px] font-medium text-[#7a8580]">SALVADOR</p></div></div>
          <button className="rounded-lg p-2 text-[#66716d] hover:bg-[#edf1ee] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18}/></button>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Navegação principal">
          {items.map(({ id, label, icon: Icon }) => <a key={id} href={hrefFor(id)} title={collapsed?label:undefined} aria-label={collapsed?label:undefined} className={`flex items-center gap-3 rounded-xl py-2.5 text-sm transition ${collapsed?'lg:justify-center lg:px-2':'px-3'} ${active === id ? 'bg-[#e4efe9] font-semibold text-[#155b47]' : 'font-medium text-[#5f6a66] hover:bg-[#eef2ef] hover:text-[#28332f]'}`}><Icon className="shrink-0" size={17} strokeWidth={active===id?2.2:1.8}/><span className={collapsed?'lg:hidden':''}>{label}</span></a>)}
        </nav>
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed?'Expandir menu lateral':'Recolher menu lateral'} title={collapsed?'Expandir menu lateral':'Recolher menu lateral'} className="mt-auto hidden items-center justify-center gap-2 rounded-xl border border-[#dce4df] bg-white px-3 py-2.5 text-xs font-semibold text-[#5f6a66] hover:bg-[#eef2ef] lg:flex">{collapsed?<PanelLeftOpen size={17}/>:<><PanelLeftClose size={17}/><span>Recolher menu</span></>}</button>
        <div title={collapsed?'Base geográfica validada':undefined} className={`mt-3 rounded-2xl border border-[#dde5e0] bg-white ${collapsed?'lg:grid lg:place-items-center lg:p-3':'p-3.5'}`}><div className="flex items-center justify-between"><span className={`text-xs font-semibold ${collapsed?'lg:hidden':''}`}>Base de pesquisa</span><span className="h-2 w-2 rounded-full bg-emerald-500"/></div><p className={`mt-1.5 text-xs leading-5 text-[#75807c] ${collapsed?'lg:hidden':''}`}>Base geográfica validada e disponível para consulta.</p></div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/25 backdrop-blur-[1px] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar navegação"/>}
      <div className="min-w-0">
        <header className="flex h-[68px] items-center gap-3 border-b border-[#dfe5e1] bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button className="rounded-xl border border-[#dfe5e1] bg-white p-2.5 text-[#596561] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={18}/></button>
          <div className="hidden items-center gap-2 text-sm text-[#7a8580] sm:flex">{collapsed?<PanelLeftOpen size={16}/>:<PanelLeftClose size={16}/>}<span>Estudo metroviário</span><span className="text-[#c1c9c5]">/</span><strong className="font-medium text-[#28332f]">{activeLabel}</strong></div>
          <button className="ml-auto hidden min-w-[220px] items-center gap-2 rounded-xl border border-[#dfe5e1] bg-[#fafbfa] px-3 py-2 text-left text-xs text-[#8a9490] sm:flex"><Search size={14}/>Buscar na plataforma <kbd className="ml-auto rounded border border-[#dde4df] bg-white px-1.5 py-0.5 text-[10px]">⌘ K</kbd></button>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#23312c] text-[11px] font-semibold text-white">GS</div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
