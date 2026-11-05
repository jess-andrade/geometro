'use client';

import { useEffect, useState } from 'react';
import { SHAPEFILE_TRACK } from '@/lib/geo/track-versions';
import { loadStationTrackQa, loadTrackCatalog, type TrackCatalog } from '@/lib/supabase/queries';
import type { StationTrackQa } from '@/types/study';

type Metadata = {
  incorporated_at?:string; transformation?:string; source_feature_count?:number; source_vertex_count?:number;
  crs?:{adopted?:string;label?:string;declared?:boolean;evidence?:string[]};
  classification_counts?:Record<string,number>; terminal_rule?:string; limitations?:string[];
  visual_qa?:{performed_at?:string;result?:string};
};

export function TrackRepresentation(){
  const [catalog,setCatalog]=useState<TrackCatalog|null>(null);
  const [qa,setQa]=useState<StationTrackQa[]>([]);
  const [failed,setFailed]=useState(false);
  useEffect(()=>{loadTrackCatalog().then((next)=>{setCatalog(next);return loadStationTrackQa(next).then(setQa);}).catch(()=>setFailed(true));},[]);

  const shapefile=catalog?.versions.find((item)=>item.method_version===SHAPEFILE_TRACK);
  const metadata=(shapefile?.validation_metadata??{}) as Metadata;
  const shapefileQa=qa.filter((item)=>item.method_version===SHAPEFILE_TRACK);
  const counts=metadata.classification_counts??{};

  return <>
    <p>O percurso do metrô utilizado no estudo é uma geometria vetorial detalhada derivada do arquivo <code>tracado_metro.shp</code>. Ela representa curvas, mudanças de direção e vias paralelas quando pertinentes.</p>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"><p className="text-xs font-semibold">Traçado oficial do estudo · <code>{SHAPEFILE_TRACK}</code></p><p className="mt-1 text-sm leading-6">Geometria vetorial detalhada utilizada para representar o percurso metroviário com maior precisão.</p><p className="mt-1 text-xs leading-5">O alinhamento foi validado contra as estações operacionais antes de a geometria ser adotada como referência atual do estudo.</p></div>
    {failed&&<p className="text-xs text-red-700">Não foi possível consultar os metadados do traçado.</p>}
    <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-[#e1e7e3] p-4 text-xs leading-5 sm:grid-cols-[170px_1fr]">
      <dt className="font-semibold text-[#32413b]">Fonte</dt><dd>Shapefile do traçado metroviário fornecido ao projeto (PolyLine, {metadata.source_feature_count??235} feições, {(metadata.source_vertex_count??2141).toLocaleString('pt-BR')} vértices, sem atributos).</dd>
      <dt className="font-semibold text-[#32413b]">Arquivo</dt><dd><code>tracado_metro.shp</code> — recebido sem <code>.prj</code>, <code>.dbf</code> e <code>.shx</code>.</dd>
      <dt className="font-semibold text-[#32413b]">CRS</dt><dd><code>{metadata.crs?.adopted??'EPSG:31984'}</code> ({metadata.crs?.label??'SIRGAS 2000 / UTM zone 24S'}) — inferido e validado, não declarado no arquivo. Evidências: as coordenadas coincidem com as UTM da planilha de estações do projeto (mediana 1,7 m) e, após a transformação, o deslocamento sistemático em relação à via no OpenStreetMap é de ~1,5 m; SAD69 e Córrego Alegre foram rejeitados.</dd>
      <dt className="font-semibold text-[#32413b]">Transformação</dt><dd>{metadata.transformation??'EPSG:31984 → EPSG:4326 com pyproj/PROJ'}; armazenado como <code>MultiLineString</code> SRID 4326, sem simplificação.</dd>
      <dt className="font-semibold text-[#32413b]">Classificação</dt><dd>{counts.L1??65} segmentos na Linha 1, {counts.L2??91} na Linha 2 e {counts['descartado']??79} descartados (pátio de Pirajá, ligações entre linhas em Acesso Norte, aparelhos de mudança de via e fragmentos fora do percurso). Sem união automática: cada segmento tem classe e motivo registrados. {metadata.terminal_rule?`Regra de terminais: ${metadata.terminal_rule} (Lapa e Águas Claras).`:''}</dd>
      <dt className="font-semibold text-[#32413b]">Incorporação</dt><dd>{formatDate(metadata.incorporated_at??'2026-11-05')}{shapefile?` · publicado no banco em ${formatDate(shapefile.created_at)}`:''}.</dd>
      <dt className="font-semibold text-[#32413b]">Validação</dt><dd>Distância de cada estação operacional ao traçado da própria linha: {shapefile?<>mediana <strong>{num(shapefile.station_qa_median_m)} m</strong>, P90 {num(shapefile.station_qa_p90_m)} m, máximo {num(shapefile.station_qa_max_m)} m ({shapefile.station_qa_n} estações, todas ≤ 25 m — “excelente”).</>:<>mediana 1,69 m, máximo 20,95 m (21 estações, todas ≤ 25 m — “excelente”).</>} Inspeção visual sobre o mapa OSM: {metadata.visual_qa?.result??'aprovada'}.</dd>
      <dt className="font-semibold text-[#32413b]">Versão oficial</dt><dd><code>{SHAPEFILE_TRACK}</code>, referência atual do estudo e da interface.</dd>
    </dl>
    {shapefileQa.length>0&&<details className="rounded-xl border border-[#e1e7e3] p-3 text-xs"><summary className="cursor-pointer font-semibold text-[#32413b]">Distância estação → traçado oficial ({shapefileQa.length} estações)</summary><table className="mt-2 w-full text-left"><thead><tr className="text-[10px] uppercase tracking-wide text-[#77827e]"><th className="py-1">Estação</th><th className="py-1">Linha</th><th className="py-1 text-right">Distância</th><th className="py-1 pl-3">Status</th></tr></thead><tbody>{shapefileQa.map((item)=><tr key={item.station_code} className="border-t border-[#edf0ee]"><td className="py-1">{item.station_name}</td><td className="py-1">{item.line_code}</td><td className="py-1 text-right font-mono">{num(item.distance_m)} m</td><td className="py-1 pl-3">{item.qa_status}</td></tr>)}</tbody></table></details>}
    <div><p className="text-xs font-semibold text-[#32413b]">Limitações</p><ul className="mt-1 list-disc space-y-1 pl-5 text-xs leading-5">{(metadata.limitations??[
      'Arquivo sem .prj/.dbf/.shx: CRS inferido e testado; sem atributo de linha.',
      'Classificação L1/L2 por corredor da rota OSM + estações; segmentos ambíguos listados para revisão.',
      'Via dupla: as duas vias paralelas foram mantidas; a distância usa a mais próxima.',
      'Sobras > 100 m após estações terminais (Lapa, Águas Claras) recortadas no ponto da estação.',
      'Estação Campo Grande (planejada) fora da validação; traçado não se estende até ela.',
    ]).map((item)=><li key={item}>{item}</li>)}</ul></div>
  </>;
}

function num(value:unknown){const number=Number(value);return Number.isFinite(number)?number.toLocaleString('pt-BR',{maximumFractionDigits:2}):'—';}
function formatDate(value:string){const date=new Date(value.length===10?`${value}T12:00:00`:value);return Number.isNaN(date.getTime())?value:date.toLocaleDateString('pt-BR');}
