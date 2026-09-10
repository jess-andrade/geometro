'use client';

import { ArrowDownUp, Download, Filter, Search, TableProperties } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { loadStudyPoints } from '@/lib/supabase/queries';
import { downloadPointsCsv } from '@/lib/csv/export-points';
import type { StudyPointRow } from '@/types/study';

const columns = ['CEP','Logradouro','Localidade','Coordenadas','Estação mais próxima','Distância da estação','Linha mais próxima','Distância da linha','Faixa'];

export function DataPage() {
  const [query,setQuery]=useState('');
  const [rows,setRows]=useState<StudyPointRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string | null>(null);
  const [scope,setScope]=useState<'all'|'filtered'>('filtered');
  useEffect(()=>{ loadStudyPoints().then(setRows).catch(()=>setError('Não foi possível consultar a base.')).finally(()=>setLoading(false)); },[]);
  const filtered=useMemo(()=>{ const term=query.trim().toLocaleLowerCase('pt-BR'); if(!term)return rows; return rows.filter((row)=>[row.cep,row.street,row.locality].some((value)=>value?.toLocaleLowerCase('pt-BR').includes(term))); },[query,rows]);
  const exportRows=scope==='all'?rows:filtered;

  return <section className="animate-in p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Base georreferenciada" title="Dados" description="Consulte, filtre e exporte as observações e suas métricas espaciais." actions={<div className="flex items-center rounded-xl border border-[#d9e1dc] bg-white p-1"><select value={scope} onChange={(e)=>setScope(e.target.value as 'all'|'filtered')} className="bg-transparent px-2 text-xs font-medium text-[#5c6964] outline-none"><option value="filtered">Pontos filtrados</option><option value="all">Todos os pontos</option></select><button disabled={!exportRows.length} onClick={()=>downloadPointsCsv(exportRows)} className="inline-flex items-center gap-2 rounded-lg bg-[#176b52] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#b8c8c1]"><Download size={14}/>Exportar CSV</button></div>}/>
    <div className="rounded-[22px] border border-[#dce4df] bg-white shadow-[0_12px_40px_rgb(30_48_41/5%)]"><div className="flex flex-col gap-3 border-b border-[#e3e8e5] p-4 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-[#dce4df] bg-[#fafbfa] px-3"><Search size={15} className="text-[#82908a]"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar por CEP, logradouro ou localidade" className="h-10 w-full bg-transparent text-xs outline-none placeholder:text-[#9ca6a1]"/></label><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce4df] px-3.5 py-2.5 text-xs font-semibold text-[#596560]"><Filter size={14}/>Filtros <span className="rounded-full bg-[#edf2ef] px-1.5 py-0.5 text-[10px]">0</span></button></div>
      <div className="soft-scrollbar overflow-x-auto"><table className="w-full min-w-[1120px] border-collapse"><thead><tr>{columns.map((column)=><th key={column} className="border-b border-[#e6ebe8] bg-[#fafbfa] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[.06em] text-[#74807b]"><button className="inline-flex items-center gap-1.5">{column}<ArrowDownUp size={11}/></button></th>)}</tr></thead>{filtered.length>0&&<tbody>{filtered.map((row)=><tr key={row.id} className="border-b border-[#edf0ee] text-xs text-[#4b5853] hover:bg-[#fafcfb]"><Cell>{row.cep}</Cell><Cell>{row.street}</Cell><Cell>{row.locality}</Cell><Cell mono>{row.latitude.toFixed(5)}, {row.longitude.toFixed(5)}</Cell><Cell>{row.nearest_station}</Cell><Cell>{meters(row.distance_station_m)}</Cell><Cell>{row.nearest_line}</Cell><Cell>{meters(row.distance_line_m)}</Cell><Cell>{row.distance_line_range}</Cell></tr>)}</tbody>}</table></div>
      {!filtered.length&&<div className="p-4"><EmptyState icon={TableProperties} title={loading?'Carregando observações…':error ?? (query?'Nenhum ponto corresponde à busca':'A base ainda está vazia')} description={loading?'Consultando o schema georref.':error?'Confirme as variáveis de ambiente, o schema exposto e as políticas de leitura.':query?'Revise o termo pesquisado ou limpe os filtros.':'Importe pontos georreferenciados para visualizar e exportar as métricas do estudo.'} action={query&&!loading?<button onClick={()=>setQuery('')} className="text-xs font-semibold text-[#176b52]">Limpar busca</button>:undefined}/></div>}
      <div className="flex items-center justify-between border-t border-[#e3e8e5] px-4 py-3 text-[11px] text-[#7c8883]"><span>{filtered.length} {filtered.length===1?'observação':'observações'}</span><span>Página 1 de 1</span></div>
    </div></section>;
}

function Cell({children,mono=false}:{children:React.ReactNode;mono?:boolean}) { return <td className={`px-4 py-3 ${mono?'font-mono text-[10px]':''}`}>{children ?? '—'}</td>; }
function meters(value:number|null) { return value===null?'—':`${Math.round(value).toLocaleString('pt-BR')} m`; }
