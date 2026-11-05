'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BarChart3, BookOpenText, Database, Map } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export type GeoreferencingTab='mapa'|'dados'|'analises'|'metodologia';

const MapWorkspace=dynamic(()=>import('@/features/map/map-workspace').then((module)=>module.MapWorkspace),{loading:TabLoading});
const DataPage=dynamic(()=>import('@/features/data/data-page').then((module)=>module.DataPage),{loading:TabLoading});
const AnalysisPage=dynamic(()=>import('@/features/analysis/analysis-page').then((module)=>module.AnalysisPage),{loading:TabLoading});
const MethodologyPage=dynamic(()=>import('@/features/methodology/methodology-page').then((module)=>module.MethodologyPage),{loading:TabLoading});

const tabs=[
  {id:'mapa',label:'Mapa',icon:Map},
  {id:'dados',label:'Dados',icon:Database},
  {id:'analises',label:'Análises',icon:BarChart3},
  {id:'metodologia',label:'Metodologia do Georreferenciamento',icon:BookOpenText},
] satisfies Array<{id:GeoreferencingTab;label:string;icon:typeof Map}>;

export function GeoreferencingPage({activeTab}:{activeTab:GeoreferencingTab}){
  return <div className="min-w-0">
    <section className="px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8">
      <PageHeader eyebrow="Etapa espacial" title="Georreferenciamento" description="Mapa, base de dados, análises descritivas e metodologia reunidos em um único módulo."/>
      <nav aria-label="Seções do georreferenciamento" className="soft-scrollbar -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-1 rounded-2xl border border-[#dce4df] bg-white p-1.5 shadow-[0_8px_28px_rgb(30_48_41/5%)]">
          {tabs.map(({id,label,icon:Icon})=><Link key={id} href={`/georreferenciamento?tab=${id}`} aria-current={activeTab===id?'page':undefined} className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-semibold transition sm:text-sm ${activeTab===id?'bg-[#176b52] text-white shadow-sm':'text-[#66736e] hover:bg-[#eef3f0] hover:text-[#294139]'}`}><Icon size={15}/>{label}</Link>)}
        </div>
      </nav>
    </section>
    {activeTab==='mapa'&&<MapWorkspace/>}
    {activeTab==='dados'&&<DataPage/>}
    {activeTab==='analises'&&<AnalysisPage/>}
    {activeTab==='metodologia'&&<MethodologyPage/>}
  </div>;
}

function TabLoading(){return <div className="m-4 rounded-2xl border border-[#dce4df] bg-white p-8 text-center text-sm text-[#74807b] sm:m-6 lg:m-8">Carregando conteúdo da aba…</div>;}
