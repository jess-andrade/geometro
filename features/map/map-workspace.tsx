'use client';

import { Map as MapLibreMap, Marker, NavigationControl, Popup as MaplibrePopup } from 'maplibre-gl';
import { Crosshair, Download, Info, Layers3, MapPin, MousePointer2, RotateCcw, TrainFront, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addStudyLayers, layerIds, setStudyLayerVisibility } from './map-layers';
import { loadMapCollections } from '@/lib/supabase/queries';
import { analysisPoint, nearestMetroLine, nearestStation } from '@/lib/geo/temporary-analysis';
import type { Feature, LineString, MultiLineString, Point } from 'geojson';
import { downloadPointsCsv } from '@/lib/csv/export-points';
import type { StudyPointRow } from '@/types/study';

type LayerKey = 'line1' | 'line2' | 'stations' | 'points' | 'buffers';
type ClickPoint = { latitude:number; longitude:number; station:string | null; stationDistance:number | null; line:string | null; lineDistance:number | null; range:string | null };
const layerOptions: Array<{ key: LayerKey; label: string; color: string }> = [
  { key:'line1', label:'Linha 1', color:'#176b52' },
  { key:'line2', label:'Linha 2', color:'#246db4' },
  { key:'stations', label:'Estações', color:'#26332f' },
  { key:'points', label:'Pontos analisados', color:'#dc7a32' },
  { key:'buffers', label:'Zonas de distância', color:'#8c6bc2' },
];

export function MapWorkspace() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const collectionsRef = useRef<Awaited<ReturnType<typeof loadMapCollections>> | null>(null);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({ line1:true, line2:true, stations:true, points:true, buffers:false });
  const [point, setPoint] = useState<ClickPoint | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [featureCount, setFeatureCount] = useState(0);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new MapLibreMap({
      container: mapContainer.current,
      center: [-38.5016, -12.9714], zoom: 11.25, minZoom: 9,
      style: { version:8, sources:{ osm:{ type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256, attribution:'© OpenStreetMap contributors' } }, layers:[{ id:'osm', type:'raster', source:'osm', paint:{ 'raster-saturation':-0.62, 'raster-contrast':0.04, 'raster-brightness-max':0.94 } }] },
    });
    map.addControl(new NavigationControl({ showCompass:false }), 'bottom-right');
    map.on('load', async () => {
      try {
        const data = await loadMapCollections();
        collectionsRef.current = data;
        addStudyLayers(map, data);
        setFeatureCount(data.lines.features.length + data.stations.features.length + data.points.features.length);
        const popup = new MaplibrePopup({ closeButton:false, closeOnClick:false, offset:10 });
        const interactiveLayers = Object.values(layerIds).filter((id) => id !== layerIds.buffers);
        for (const id of interactiveLayers) {
          map.on('mouseenter', id, () => { map.getCanvas().style.cursor='pointer'; });
          map.on('mouseleave', id, () => { map.getCanvas().style.cursor=''; popup.remove(); });
          map.on('mousemove', id, (event) => {
            const feature=event.features?.[0];
            if(feature) popup.setLngLat(event.lngLat).setDOMContent(popupContent(id, feature.properties ?? {})).addTo(map);
          });
        }
      } catch (error) {
        console.error('Não foi possível carregar as camadas do Supabase.',error);
      } finally { setMapReady(true); }
    });
    map.on('click', (event) => {
      const origin=analysisPoint(event.lngLat.lng,event.lngLat.lat);
      const stationResult=nearestStation(origin,(collectionsRef.current?.stations.features ?? []) as Feature<Point>[]);
      const lineResult=nearestMetroLine(origin,(collectionsRef.current?.lines.features ?? []) as Feature<LineString | MultiLineString>[]);
      const next = { longitude:event.lngLat.lng, latitude:event.lngLat.lat, station:String(stationResult?.station.properties?.name ?? '') || null, stationDistance:stationResult?.distanceM ?? null, line:String(lineResult?.line.properties?.name ?? '') || null, lineDistance:lineResult?.distanceM ?? null, range:lineResult?.range.label ?? null };
      setPoint(next); markerRef.current?.remove();
      const node = document.createElement('div');
      node.className = 'h-5 w-5 rounded-full border-[3px] border-white bg-[#d96f2d] shadow-[0_3px_12px_rgb(0_0_0/30%)]';
      markerRef.current = new Marker({ element:node }).setLngLat(event.lngLat).addTo(map);
    });
    mapRef.current = map;
    return () => { markerRef.current?.remove(); map.remove(); mapRef.current=null; };
  }, []);

  useEffect(() => {
    const map=mapRef.current;
    if(!mapReady || !map) return;
    (Object.keys(layers) as LayerKey[]).forEach((key)=>setStudyLayerVisibility(map,key,layers[key]));
  }, [layers,mapReady]);

  const activeLegend = useMemo(() => layerOptions.filter((layer) => layers[layer.key]), [layers]);
  const clearPoint = () => { setPoint(null); markerRef.current?.remove(); markerRef.current=null; };
  const exportVisible = () => {
    const map=mapRef.current; if(!map || !map.getLayer(layerIds.points)) return;
    const seen=new Set<string>();
    const rows=map.queryRenderedFeatures({layers:[layerIds.points]}).flatMap((feature) => {
      const id=String(feature.id ?? feature.properties?.id ?? ''); if(!id || seen.has(id)) return [];
      seen.add(id); const coordinates=feature.geometry.type==='Point'?feature.geometry.coordinates:[null,null];
      return [{...feature.properties,id,longitude:Number(coordinates[0]),latitude:Number(coordinates[1])} as StudyPointRow];
    });
    if(rows.length) downloadPointsCsv(rows,'geometro-pontos-visiveis.csv');
  };

  return (
    <section className="animate-in p-4 sm:p-6 lg:p-7">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#77827e]"><span className="h-px w-5 bg-[#9aa59f]"/>Exploração espacial</div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-[28px]">Mapa do estudo</h1><p className="mt-1 text-sm text-[#6d7874]">Explore relações de proximidade com o sistema metroviário de Salvador.</p></div>
        <div className="flex items-center gap-2"><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${featureCount?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-200 bg-amber-50 text-amber-800'}`}><span className={`h-1.5 w-1.5 rounded-full ${featureCount?'bg-emerald-500':'bg-amber-500'}`}/>{featureCount?`${featureCount} feições carregadas`:'Sem dados importados'}</span><button disabled={!featureCount} onClick={exportVisible} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce4df] bg-white text-[#58635f] hover:bg-[#f2f5f3] disabled:cursor-not-allowed disabled:text-[#b3bdb8]" aria-label="Exportar pontos visíveis no mapa"><Download size={15}/></button><button onClick={() => mapRef.current?.flyTo({ center:[-38.5016,-12.9714], zoom:11.25, duration:900 })} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce4df] bg-white text-[#58635f] hover:bg-[#f2f5f3]" aria-label="Redefinir enquadramento"><RotateCcw size={15}/></button></div>
      </div>
      <div className="relative h-[calc(100vh-174px)] min-h-[620px] overflow-hidden rounded-[22px] border border-[#d8e0db] bg-[#e7ebe8] shadow-[0_16px_50px_rgb(24_43_36/8%)]">
        <div ref={mapContainer} className="absolute inset-0" aria-label="Mapa interativo de Salvador"/>
        {!mapReady && <div className="absolute inset-0 grid place-items-center bg-[#edf1ee]"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#b8c5bf] border-t-[#176b52]"/><p className="mt-3 text-xs font-medium text-[#68746f]">Preparando o mapa…</p></div></div>}
        <div className="absolute left-3 top-3 w-[min(290px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 p-3.5 shadow-[0_10px_32px_rgb(25_45_37/15%)] backdrop-blur-md sm:left-4 sm:top-4">
          <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Layers3 size={16} className="text-[#176b52]"/><h2 className="text-sm font-semibold">Camadas do mapa</h2></div><span className="text-[10px] font-medium text-[#8a9490]">{activeLegend.length} ATIVAS</span></div>
          <div className="space-y-1">{layerOptions.map((layer) => <div key={layer.key} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#f3f6f4]"><button role="switch" aria-label={`${layers[layer.key]?'Ocultar':'Mostrar'} ${layer.label}`} aria-checked={layers[layer.key]} onClick={() => setLayers((current) => ({ ...current, [layer.key]:!current[layer.key] }))} className={`relative h-5 w-9 rounded-full transition ${layers[layer.key]?'bg-[#276f59]':'bg-[#d5ddd8]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${layers[layer.key]?'left-[18px]':'left-0.5'}`}/></button><span className="h-2.5 w-2.5 rounded-full" style={{ background:layer.color }}/><span className="text-xs font-medium text-[#45514d]">{layer.label}</span></div>)}</div>
        </div>
        <div className="absolute bottom-6 left-3 max-w-[calc(100%-24px)] rounded-2xl border border-white/80 bg-white/94 px-4 py-3 shadow-[0_10px_32px_rgb(25_45_37/14%)] backdrop-blur-md sm:left-4">
          <div className="mb-2 flex items-center gap-2"><Info size={13} className="text-[#176b52]"/><span className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#65716c]">Legenda</span></div><div className="flex flex-wrap gap-x-4 gap-y-2">{activeLegend.map((item) => <span key={item.key} className="flex items-center gap-1.5 text-[11px] font-medium text-[#58635f]"><span className="h-2 w-2 rounded-full" style={{ background:item.color }}/>{item.label}</span>)}</div>
        </div>
        {!point ? <div className="absolute bottom-6 right-3 w-[min(330px,calc(100%-24px))] rounded-2xl border border-[#dbe3de] bg-[#17241f]/94 p-4 text-white shadow-xl backdrop-blur-md sm:right-16"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><MousePointer2 size={17}/></span><div><h3 className="text-sm font-semibold">Analise qualquer localização</h3><p className="mt-1 text-xs leading-5 text-white/65">Clique livremente no mapa. O ponto será preparado para o cálculo de proximidade assim que as linhas e estações forem importadas.</p></div></div></div> :
          <div className="absolute bottom-6 right-3 w-[min(350px,calc(100%-24px))] rounded-2xl border border-[#dbe3de] bg-white/96 p-4 shadow-[0_16px_44px_rgb(20_39_32/22%)] backdrop-blur-md sm:right-16"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0e7] text-[#bd5b20]"><Crosshair size={16}/></span><div><p className="text-sm font-semibold">Ponto temporário</p><p className="text-[11px] text-[#7b8581]">Análise instantânea</p></div></div><button onClick={clearPoint} className="rounded-lg p-1.5 text-[#7b8581] hover:bg-[#eef2ef]" aria-label="Remover ponto"><X size={15}/></button></div><div className="mt-3 rounded-xl bg-[#f1f4f2] px-3 py-2 font-mono text-[11px] text-[#52605b]">{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</div><div className="mt-3 grid grid-cols-2 gap-2"><Metric icon={<TrainFront size={14}/>} label="Estação mais próxima" value={point.station ? `${point.station} · ${Math.round(point.stationDistance!)} m` : 'Sem dados'}/><Metric icon={<MapPin size={14}/>} label="Linha mais próxima" value={point.line ? `${point.line} · ${Math.round(point.lineDistance!)} m` : 'Sem dados'}/></div><p className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-[#77827e]"><Info size={13} className="mt-0.5 shrink-0"/>{point.range ? `Faixa de proximidade: ${point.range}.` : 'Importe a rede metroviária para habilitar distâncias e faixas de proximidade.'}</p></div>}
      </div>
    </section>
  );
}

function Metric({ icon, label, value }: { icon:ReactNode; label:string; value:string }) {
  return <div className="rounded-xl border border-[#e0e6e2] p-3"><span className="mb-2 flex items-center gap-1.5 text-[#73807b]">{icon}<span className="text-[10px] font-medium">{label}</span></span><p className="text-xs font-semibold text-[#37433f]">{value}</p></div>;
}

function popupContent(layerId:string, properties:Record<string,unknown>) {
  const root=document.createElement('div'); root.style.cssText='min-width:190px;padding:4px 2px;font-family:Arial,sans-serif';
  const title=document.createElement('strong'); title.style.cssText='display:block;font-size:12px;color:#26332e;margin-bottom:5px';
  title.textContent=String(properties.name ?? properties.street ?? properties.cep ?? 'Ponto analisado'); root.appendChild(title);
  const fields = layerId===layerIds.stations
    ? [['Linha',properties.line],['Inauguração',properties.inauguration_date],['Status',properties.status]]
    : layerId===layerIds.points
      ? [['CEP',properties.cep],['Localidade',properties.locality],['Estação mais próxima',properties.nearest_station],['Distância da estação',formatDistance(properties.distance_station_m)],['Linha mais próxima',properties.nearest_line],['Distância da linha',formatDistance(properties.distance_line_m)]]
      : [['Código',properties.code],['Status',properties.status],['Inauguração',properties.inauguration_date]];
  for(const [label,value] of fields) { if(value===null || value===undefined || value==='') continue; const row=document.createElement('div'); row.style.cssText='display:flex;justify-content:space-between;gap:12px;font-size:10px;line-height:18px;color:#68746f'; const left=document.createElement('span'); left.textContent=String(label); const right=document.createElement('b'); right.style.color='#37433f'; right.textContent=String(value); row.append(left,right); root.appendChild(row); }
  return root;
}

function formatDistance(value:unknown) { const number=Number(value); return Number.isFinite(number)?`${Math.round(number)} m`:null; }
