'use client';

import type {
  GeoJSON as LeafletGeoJSON,
  LatLngBounds,
  LayerGroup,
  Map as LeafletMap,
  Marker,
  Path,
  TileLayer,
} from 'leaflet';
import type { Feature, FeatureCollection, Geometry, Point, Position } from 'geojson';
import { buffer, difference, featureCollection } from '@turf/turf';
import { Crosshair, Download, Info, Layers3, MapPin, MousePointer2, RotateCcw, Route, TrainFront, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { downloadPointsCsv } from '@/lib/csv/export-points';
import { fallbackBaseMap, primaryBaseMap } from '@/lib/map/basemap';
import { loadMapCollections, loadStudyMapPoint, loadStudyPointsViewport, searchStudyPoints } from '@/lib/supabase/queries';
import type { StudyMapPoint, StudyPointRow } from '@/types/study';

type LeafletModule = typeof import('leaflet');
type LayerKey = 'line1' | 'line2' | 'stations' | 'points' | 'buffers';
type AnalyzedPoint = {
  id:string; cep:string|null; street:string|null; locality:string|null; coordinates:Position;
  station:string; stationCoordinates:Position; stationDistance:number;
  line:string; lineCode:string; lineCoordinates:Position; lineDistance:number;
  range:string|null; methodVersion:string;
};

const FALLBACK_CENTER:[number,number]=[-12.945,-38.47];
const FALLBACK_ZOOM=12;

const layerOptions:Array<{key:LayerKey;label:string;color:string}>=[
  {key:'line1',label:'Linha 1',color:'#176b52'}, {key:'line2',label:'Linha 2',color:'#246db4'},
  {key:'stations',label:'Estações',color:'#26332f'}, {key:'points',label:'Pontos analisados',color:'#dc7a32'},
  {key:'buffers',label:'Zonas de distância',color:'#8c6bc2'},
];

export function MapWorkspace(){
  const mapContainer=useRef<HTMLDivElement>(null);
  const mapRef=useRef<LeafletMap|null>(null);
  const leafletRef=useRef<LeafletModule|null>(null);
  const tileLayerRef=useRef<TileLayer|null>(null);
  const layerRefs=useRef<Partial<Record<LayerKey,LayerGroup>>>({});
  const lineGeoJsonRefs=useRef<Partial<Record<'L1'|'L2',LeafletGeoJSON>>>({});
  const analysisLayerRef=useRef<LayerGroup|null>(null);
  const networkBoundsRef=useRef<LatLngBounds|null>(null);
  const visiblePointFeaturesRef=useRef<Feature<Point>[]>([]);
  const analyzeModeRef=useRef(false);
  const refreshViewportRef=useRef<()=>void>(()=>undefined);
  const [layers,setLayers]=useState<Record<LayerKey,boolean>>({line1:true,line2:true,stations:true,points:true,buffers:false});
  const [analyzeMode,setAnalyzeMode]=useState(false);
  const [point,setPoint]=useState<AnalyzedPoint|null>(null);
  const [mapReady,setMapReady]=useState(false);
  const [baseMapState,setBaseMapState]=useState<'loading'|'ready'|'error'>('loading');
  const [baseMapProvider,setBaseMapProvider]=useState<string>(primaryBaseMap.provider);
  const [baseMapError,setBaseMapError]=useState<string|null>(null);
  const [tileErrorCount,setTileErrorCount]=useState(0);
  const [fallbackTriggered,setFallbackTriggered]=useState(false);
  const [featureCount,setFeatureCount]=useState(0);
  const [pointCount,setPointCount]=useState(0);
  const [visiblePointCount,setVisiblePointCount]=useState(0);
  const [loadError,setLoadError]=useState<string|null>(null);
  const [loadingPoints,setLoadingPoints]=useState(true);
  const [viewportError,setViewportError]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [searchResults,setSearchResults]=useState<Array<{id:string;cep:string;street:string|null;locality:string|null;longitude:number;latitude:number}>>([]);
  const [searching,setSearching]=useState(false);
  const [boundsLabel,setBoundsLabel]=useState('carregando geometrias');

  const setNetworkFocus=useCallback((selected:AnalyzedPoint|null)=>{
    const L=leafletRef.current;
    if(!L)return;
    for(const code of ['L1','L2'] as const){
      lineGeoJsonRefs.current[code]?.eachLayer((layer)=>{
        if(layer instanceof L.Path)(layer as Path).setStyle({opacity:selected?(selected.lineCode===code?1:.18):.92,weight:selected&&selected.lineCode===code?7:4});
      });
    }
    layerRefs.current.stations?.eachLayer((layer)=>{
      if(layer instanceof L.Path)(layer as Path).setStyle({opacity:selected?.station?0.3:1,fillOpacity:selected?.station?0.3:1});
    });
    layerRefs.current.points?.eachLayer((layer)=>{
      if(layer instanceof L.Path)(layer as Path).setStyle({opacity:selected?.id?0.2:0.82,fillOpacity:selected?.id?0.2:0.82});
      else if(layer instanceof L.Marker)(layer as Marker).setOpacity(selected?.id?0.25:1);
    });
  },[]);

  const showAnalysis=useCallback((selected:AnalyzedPoint,focus=true)=>{
    const L=leafletRef.current;const map=mapRef.current;const group=analysisLayerRef.current;
    if(!L||!map||!group)return;
    group.clearLayers();
    const origin=toLatLng(selected.coordinates);const station=toLatLng(selected.stationCoordinates);const line=toLatLng(selected.lineCoordinates);
    L.polyline([origin,station],{pane:'selectionPane',color:'#26332f',weight:2.5,dashArray:'6 6'}).bindTooltip(meters(selected.stationDistance)).addTo(group);
    L.polyline([origin,line],{pane:'selectionPane',color:'#d96f2d',weight:3}).bindTooltip(meters(selected.lineDistance)).addTo(group);
    L.circleMarker(origin,{pane:'selectionPane',radius:9,color:'#fff',weight:4,fillColor:'#d96f2d',fillOpacity:1}).addTo(group);
    L.circleMarker(station,{pane:'selectionPane',radius:9,color:'#fff',weight:4,fillColor:'#26332f',fillOpacity:1}).addTo(group);
    L.circleMarker(line,{pane:'selectionPane',radius:6,color:'#fff',weight:3,fillColor:'#d96f2d',fillOpacity:1}).addTo(group);
    setNetworkFocus(selected);
    if(focus)map.flyTo(origin,Math.max(map.getZoom(),15),{duration:.8});
  },[setNetworkFocus]);

  const clearPoint=useCallback(()=>{
    setPoint(null);analysisLayerRef.current?.clearLayers();setNetworkFocus(null);
  },[setNetworkFocus]);

  useEffect(()=>{
    analyzeModeRef.current=analyzeMode;
    if(mapContainer.current)mapContainer.current.style.cursor=analyzeMode?'crosshair':'';
  },[analyzeMode]);

  useEffect(()=>{
    if(search.trim().length<2)return;
    const controller=new AbortController();
    const timer=setTimeout(()=>{
      setSearching(true);
      searchStudyPoints(search,controller.signal).then(setSearchResults).catch((error)=>{
        if(error?.name!=='AbortError')console.error('Falha na busca de pontos.',error);
      }).finally(()=>setSearching(false));
    },250);
    return()=>{clearTimeout(timer);controller.abort();};
  },[search]);

  useEffect(()=>{
    if(!mapContainer.current||mapRef.current)return;
    const container=mapContainer.current;
    let disposed=false;
    let viewportController:AbortController|null=null;
    let viewportTimer:ReturnType<typeof setTimeout>|null=null;
    let resizeObserver:ResizeObserver|null=null;

    const initialize=async()=>{
      try{
        const L=await import('leaflet');
        if(disposed||mapRef.current)return;
        leafletRef.current=L;
        const map=L.map(container,{center:FALLBACK_CENTER,zoom:FALLBACK_ZOOM,minZoom:9,zoomControl:true,attributionControl:true});
        mapRef.current=map;
        for(const [name,zIndex] of [['zonesPane',260],['pointsPane',360],['linesPane',460],['stationsPane',520],['selectionPane',620]] as const){
          const pane=map.createPane(name);pane.style.zIndex=String(zIndex);
        }
        let tileErrors=0;
        let fallbackActive=false;
        let fallbackRequested=false;
        let activeTileLayer:TileLayer|null=null;
        const activateBaseMap=async(source:typeof primaryBaseMap|typeof fallbackBaseMap,isFallback:boolean)=>{
          const probe=await probeBaseMap(source.tileUrl,FALLBACK_CENTER,FALLBACK_ZOOM);
          if(disposed)return;
          if(!probe.ok){
            tileErrors+=1;setTileErrorCount(tileErrors);
            console.error('[GeoMetrô mapa] fonte de tiles rejeitada no diagnóstico',{provider:source.provider,url:probe.url,reason:probe.reason,tileErrors,fallback:isFallback});
            if(!isFallback){fallbackRequested=true;await activateBaseMap(fallbackBaseMap,true);}
            else{
              if(activeTileLayer){activeTileLayer.off();map.removeLayer(activeTileLayer);activeTileLayer=null;tileLayerRef.current=null;}
              setFallbackTriggered(true);setBaseMapProvider(source.provider);setBaseMapState('error');setBaseMapError(`As duas fontes públicas falharam. ${source.provider}: ${probe.reason}`);
            }
            return;
          }
          if(activeTileLayer){activeTileLayer.off();map.removeLayer(activeTileLayer);}
          const nextLayer=L.tileLayer(source.tileUrl,{minZoom:0,maxZoom:19,tileSize:256,attribution:source.attribution});
          activeTileLayer=nextLayer;tileLayerRef.current=nextLayer;fallbackActive=isFallback;fallbackRequested=false;
          setBaseMapProvider(source.provider);setFallbackTriggered(isFallback);setBaseMapState('loading');setBaseMapError(null);
          nextLayer.once('tileload',(event)=>{
            console.info('[GeoMetrô mapa] tile Leaflet carregado',{provider:source.provider,src:(event.tile as HTMLImageElement).src,tileErrors,fallback:isFallback});
            setBaseMapState('ready');setBaseMapError(null);
          });
          nextLayer.on('tileerror',(event)=>{
            tileErrors+=1;setTileErrorCount(tileErrors);
            const tileSrc=(event.tile as HTMLImageElement).src;
            console.error('[GeoMetrô mapa] erro de tile',{provider:source.provider,src:tileSrc,tileErrors,fallback:isFallback});
            if(!fallbackActive&&!fallbackRequested){
              fallbackRequested=true;
              console.warn('[GeoMetrô mapa] fonte principal falhou; removendo-a e ativando OpenStreetMap France.');
              void activateBaseMap(fallbackBaseMap,true);
            }else if(tileErrors>=3){
              setBaseMapState('error');setBaseMapError(`As fontes ${primaryBaseMap.provider} e ${fallbackBaseMap.provider} apresentaram erros de tiles. Última URL: ${tileSrc}`);
            }
          });
          nextLayer.addTo(map);
        };
        await activateBaseMap(primaryBaseMap,false);

        const line1=L.layerGroup().addTo(map);const line2=L.layerGroup().addTo(map);const stations=L.layerGroup().addTo(map);const points=L.layerGroup().addTo(map);const buffers=L.layerGroup();const analysis=L.layerGroup().addTo(map);
        layerRefs.current={line1,line2,stations,points,buffers};analysisLayerRef.current=analysis;

        const data=await loadMapCollections();
        for(const code of ['L1','L2'] as const){
          const collection:FeatureCollection={type:'FeatureCollection',features:data.lines.features.filter((feature)=>feature.properties?.code===code)};
          const target=code==='L1'?line1:line2;
          const geoJson=L.geoJSON(collection as FeatureCollection<Geometry>,{
            pane:'linesPane',
            style:(feature)=>({color:String(feature?.properties?.color??(code==='L1'?'#176b52':'#246db4')),weight:4,opacity:.92}),
            onEachFeature:(feature,layer)=>{
              layer.bindTooltip(`<strong>${escapeHtml(String(feature.properties?.name??code))}</strong><br>Status: ${escapeHtml(statusLabel(feature.properties?.status))}<br>Fonte: ${escapeHtml(String(feature.properties?.source_name??'não informada'))}`);
            },
          }).addTo(target);
          lineGeoJsonRefs.current[code]=geoJson;
        }

        for(const feature of data.stations.features){
          if(feature.geometry.type!=='Point')continue;
          const properties=feature.properties??{};const latLng=toLatLng(feature.geometry.coordinates);
          const station=L.circleMarker(latLng,{pane:'stationsPane',radius:6,color:'#fff',weight:2.5,fillColor:String(properties.color??'#26332f'),fillOpacity:1});
          station.bindTooltip(`<strong>${escapeHtml(String(properties.name??'Estação'))}</strong><br>${escapeHtml(String(properties.line??''))}<br>${escapeHtml(statusLabel(properties.status))}`);
          station.bindPopup(`<strong>${escapeHtml(String(properties.name??'Estação'))}</strong><br>Linha: ${escapeHtml(String(properties.line??''))}<br>Inauguração: ${escapeHtml(formatDate(properties.inauguration_date))}<br>Status: ${escapeHtml(statusLabel(properties.status))}`);
          station.on('click',()=>map.flyTo(latLng,Math.max(map.getZoom(),14),{duration:.8}));station.addTo(stations);
        }

        const networkBounds=L.latLngBounds([]);
        for(const geoJson of Object.values(lineGeoJsonRefs.current))if(geoJson)networkBounds.extend(geoJson.getBounds());
        for(const feature of data.stations.features)if(feature.geometry.type==='Point')networkBounds.extend(toLatLng(feature.geometry.coordinates));
        if(networkBounds.isValid()){
          networkBoundsRef.current=networkBounds;
          const southWest=networkBounds.getSouthWest();const northEast=networkBounds.getNorthEast();
          setBoundsLabel(`${southWest.lat.toFixed(5)}, ${southWest.lng.toFixed(5)} → ${northEast.lat.toFixed(5)}, ${northEast.lng.toFixed(5)}`);
          map.fitBounds(networkBounds,{padding:[40,40],maxZoom:13});
        }

        const zoneDefinitions=[
          {outer:1000,inner:500,label:'Até 1.000 m do percurso',color:'#8bb7c7',opacity:.08},
          {outer:500,inner:250,label:'Até 500 m do percurso',color:'#78a5b8',opacity:.1},
          {outer:250,inner:100,label:'Até 250 m do percurso',color:'#6fa89c',opacity:.12},
          {outer:100,inner:50,label:'Até 100 m do percurso',color:'#d5a45f',opacity:.14},
          {outer:50,inner:0,label:'Até 50 m do percurso',color:'#c97842',opacity:.18},
        ];
        let zonePolygonCount=0;
        for(const lineFeature of data.lines.features){
          for(const zone of zoneDefinitions){
            const outer=buffer(lineFeature,zone.outer,{units:'meters'});if(!outer)continue;
            const geometry=zone.inner>0?difference(featureCollection([outer,buffer(lineFeature,zone.inner,{units:'meters'})!])):outer;
            if(!geometry)continue;
            L.geoJSON(geometry,{pane:'zonesPane',style:{color:zone.color,weight:1,opacity:.55,fillColor:zone.color,fillOpacity:zone.opacity}})
              .bindTooltip(`<strong>${zone.label}</strong><br>Área localizada a até ${zone.outer.toLocaleString('pt-BR')} metros do traçado utilizado na análise.<br><em>Faixa exploratória.</em>`)
              .addTo(buffers);
            zonePolygonCount+=1;
          }
        }
        console.info('[GeoMetrô mapa] rede e zonas Leaflet carregadas',{lines:data.lines.features.length,stations:data.stations.features.length,zonePolygons:zonePolygonCount,bounds:networkBounds.isValid()?networkBounds.toBBoxString():null});

        const renderViewport=(collection:FeatureCollection<Point>)=>{
          points.clearLayers();visiblePointFeaturesRef.current=[];
          let clusterCount=0;
          for(const feature of collection.features){
            if(feature.geometry.type!=='Point')continue;
            const properties=feature.properties??{};const latLng=toLatLng(feature.geometry.coordinates);
            if(properties.kind==='cluster'){
              clusterCount+=1;
              const count=Number(properties.point_count??0);
              const size=count>=750?54:count>=100?42:32;
              const marker=L.marker(latLng,{pane:'pointsPane',icon:L.divIcon({className:'geometro-cluster-icon',html:`<span>${count.toLocaleString('pt-BR')}</span>`,iconSize:[size,size],iconAnchor:[size/2,size/2]})});
              marker.bindTooltip(`${count.toLocaleString('pt-BR')} CEPs nesta área`);
              marker.on('click',()=>map.flyTo(latLng,Math.min(16,map.getZoom()+2),{duration:.6}));marker.addTo(points);
            }else{
              visiblePointFeaturesRef.current.push(feature);
              const marker=L.circleMarker(latLng,{pane:'pointsPane',radius:5,color:'#fff',weight:1.5,fillColor:'#d96f2d',fillOpacity:.82});
              marker.bindTooltip(pointTooltip(properties));
              marker.on('mouseover',()=>marker.setStyle({radius:7,fillOpacity:1}));
              marker.on('mouseout',()=>marker.setStyle({radius:5,fillOpacity:.82}));
              marker.on('click',()=>{
                if(!analyzeModeRef.current)return;
                const selected=featureToAnalyzedPoint(feature);if(!selected)return;
                setPoint(selected);showAnalysis(selected);
              });
              marker.addTo(points);
            }
          }
          setVisiblePointCount(visiblePointFeaturesRef.current.length);
          console.info('[GeoMetrô mapa] viewport Leaflet renderizado',{clusters:clusterCount,points:visiblePointFeaturesRef.current.length,zoom:map.getZoom()});
        };

        const refreshViewport=()=>{
          if(viewportTimer)clearTimeout(viewportTimer);
          viewportTimer=setTimeout(async()=>{
            viewportController?.abort();const controller=new AbortController();viewportController=controller;
            const bounds=map.getBounds();setLoadingPoints(true);setViewportError(null);
            try{
              const collection=await loadStudyPointsViewport({west:bounds.getWest(),south:bounds.getSouth(),east:bounds.getEast(),north:bounds.getNorth()},map.getZoom(),controller.signal);
              renderViewport(collection);
            }catch(error){
              if(!controller.signal.aborted&&!isAbortLike(error)){console.error('Falha ao carregar o viewport.',error);setViewportError('Falha ao carregar os pontos desta área.');}
            }finally{if(!controller.signal.aborted)setLoadingPoints(false);}
          },180);
        };
        refreshViewportRef.current=refreshViewport;map.on('moveend',refreshViewport);refreshViewport();

        setFeatureCount(data.lines.features.length+data.stations.features.length+20041);setPointCount(20041);setMapReady(true);
        const requestedPointId=new URLSearchParams(window.location.search).get('ponto');
        if(requestedPointId&&/^[0-9a-f-]{36}$/i.test(requestedPointId)){
          const row=await loadStudyMapPoint(requestedPointId);const selected=toAnalyzedPoint(row);
          setAnalyzeMode(true);setPoint(selected);showAnalysis(selected);
        }

        resizeObserver=new ResizeObserver(()=>map.invalidateSize({pan:false}));resizeObserver.observe(container);requestAnimationFrame(()=>map.invalidateSize());
      }catch(error){
        console.error('Não foi possível inicializar o mapa Leaflet.',error);if(!disposed){setLoadError('Não foi possível consultar as views do schema georref.');setMapReady(true);setLoadingPoints(false);}
      }
    };
    void initialize();
    return()=>{disposed=true;if(viewportTimer)clearTimeout(viewportTimer);viewportController?.abort();resizeObserver?.disconnect();mapRef.current?.remove();mapRef.current=null;leafletRef.current=null;};
  },[showAnalysis]);

  useEffect(()=>{
    const map=mapRef.current;if(!mapReady||!map)return;
    (Object.keys(layers) as LayerKey[]).forEach((key)=>{const layer=layerRefs.current[key];if(!layer)return;if(layers[key])layer.addTo(map);else layer.removeFrom(map);});
  },[layers,mapReady]);

  const activeLegend=useMemo(()=>layerOptions.filter((layer)=>layers[layer.key]),[layers]);
  const selectSearchResult=async(id:string)=>{
    try{const row=await loadStudyMapPoint(id);const selected=toAnalyzedPoint(row);setAnalyzeMode(true);setPoint(selected);setSearch('');setSearchResults([]);showAnalysis(selected);}
    catch(error){console.error('Falha ao abrir o ponto selecionado.',error);setViewportError('Não foi possível abrir o CEP selecionado.');}
  };
  const exportVisible=()=>{
    const rows=visiblePointFeaturesRef.current.map((feature)=>({...feature.properties,id:String(feature.id??feature.properties?.id??''),longitude:feature.geometry.coordinates[0],latitude:feature.geometry.coordinates[1]} as StudyPointRow));
    if(rows.length)downloadPointsCsv(rows,'geometro-pontos-visiveis.csv');
  };
  const resetBounds=()=>{const map=mapRef.current;const bounds=networkBoundsRef.current;if(map&&bounds)map.fitBounds(bounds,{padding:[40,40],maxZoom:13});};

  return <section className="animate-in p-4 sm:p-6 lg:p-7">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#77827e]"><span className="h-px w-5 bg-[#9aa59f]"/>Exploração espacial</div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-[28px]">Mapa do estudo</h1><p className="mt-1 text-sm text-[#6d7874]">Explore os 20.041 pontos válidos e suas relações com o metrô de Salvador.</p></div>
      <div className="flex flex-wrap items-center gap-2"><div className="flex rounded-xl border border-[#dce4df] bg-white p-1"><button onClick={()=>{setAnalyzeMode(false);clearPoint();}} aria-pressed={!analyzeMode} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${!analyzeMode?'bg-[#eaf3ee] text-[#176b52]':'text-[#6d7874]'}`}>Explorar Salvador</button><button onClick={()=>{setAnalyzeMode(true);clearPoint();}} aria-pressed={analyzeMode} className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${analyzeMode?'bg-[#176b52] text-white':'text-[#6d7874]'}`}><Crosshair size={14}/>Analisar ponto</button></div><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${featureCount&&!loadError?'border-emerald-200 bg-emerald-50 text-emerald-800':'border-amber-200 bg-amber-50 text-amber-800'}`}><span className={`h-1.5 w-1.5 rounded-full ${featureCount&&!loadError?'bg-emerald-500':'bg-amber-500'}`}/>{loadError??(featureCount?`${pointCount.toLocaleString('pt-BR')} pontos na base`:'Carregando dados reais')}</span><button disabled={!visiblePointCount} onClick={exportVisible} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce4df] bg-white text-[#58635f] disabled:text-[#b3bdb8]" aria-label="Exportar pontos visíveis"><Download size={15}/></button><button onClick={resetBounds} className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce4df] bg-white text-[#58635f]" aria-label="Enquadrar rede metroviária"><RotateCcw size={15}/></button></div></div>
    <div className="relative h-[calc(100vh-174px)] min-h-[620px] overflow-hidden rounded-[22px] border border-[#d8e0db] bg-[#e7ebe8] shadow-[0_16px_50px_rgb(24_43_36/8%)]">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" aria-label="Mapa Leaflet interativo do metrô de Salvador"/>
      {!mapReady&&<div className="pointer-events-none absolute inset-x-0 top-0 z-[900] grid place-items-center bg-white/85 py-2 text-xs font-medium text-[#68746f]">Carregando rede metroviária…</div>}
      <div className="absolute right-3 top-3 z-[900] w-[min(340px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-[0_10px_32px_rgb(25_45_37/15%)] backdrop-blur-md sm:right-4"><label className="flex items-center gap-2 rounded-xl border border-[#dce4df] bg-[#fafbfa] px-3"><Crosshair size={15} className="text-[#176b52]"/><input value={search} onChange={(event)=>{const value=event.target.value;setSearch(value);if(value.trim().length<2){setSearchResults([]);setSearching(false);}}} placeholder="Selecionar CEP, rua ou localidade" className="h-9 w-full bg-transparent text-xs outline-none"/></label>{(searching||searchResults.length>0)&&<div className="mt-2 max-h-56 overflow-auto rounded-xl border border-[#e2e8e4] bg-white p-1">{searching?<p className="p-2 text-xs text-[#7b8782]">Buscando…</p>:searchResults.map((result)=><button key={result.id} onClick={()=>selectSearchResult(result.id)} className="block w-full rounded-lg px-2 py-2 text-left hover:bg-[#f2f6f3]"><span className="block text-xs font-semibold text-[#35413d]">{result.cep} · {result.street??'Logradouro não informado'}</span><span className="text-[10px] text-[#7d8984]">{result.locality}</span></button>)}</div>}</div>
      {loadingPoints&&mapReady&&<div className="pointer-events-none absolute left-1/2 top-4 z-[850] -translate-x-1/2 rounded-full border border-[#dce4df] bg-white/95 px-3 py-1.5 text-[11px] font-medium text-[#64706b] shadow-sm">Atualizando área visível…</div>}
      {viewportError&&<div className="absolute left-1/2 top-14 z-[900] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 shadow-sm"><span>{viewportError}</span><button onClick={()=>refreshViewportRef.current()} className="font-semibold underline">Tentar novamente</button></div>}
      {baseMapState==='error'&&<div role="alert" className="absolute inset-x-3 top-20 z-[900] mx-auto max-w-xl rounded-2xl border border-red-200 bg-white/98 p-4 text-sm text-red-900 shadow-xl"><p className="font-semibold">Não foi possível carregar o mapa-base.</p><p className="mt-1 text-xs leading-5 text-red-700">{baseMapError}</p></div>}
      <div title={`Leaflet · ${baseMapProvider} · bounds ${boundsLabel}`} className="pointer-events-none absolute bottom-1 left-1/2 z-[900] -translate-x-1/2 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-medium text-[#5f6b66] shadow-sm">Fonte: {baseMapProvider} · erros: {tileErrorCount} · fallback: {fallbackTriggered?'acionado':'não acionado'}</div>
      <div className="absolute left-3 top-3 z-[900] w-[min(290px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 p-3.5 shadow-[0_10px_32px_rgb(25_45_37/15%)] backdrop-blur-md sm:left-4 sm:top-4"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><Layers3 size={16} className="text-[#176b52]"/><h2 className="text-sm font-semibold">Camadas do mapa</h2></div><span className="text-[10px] font-medium text-[#8a9490]">{activeLegend.length} ATIVAS</span></div><div className="space-y-1">{layerOptions.map((layer)=><div key={layer.key} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[#f3f6f4]"><button role="switch" aria-label={`${layers[layer.key]?'Ocultar':'Mostrar'} ${layer.label}`} aria-checked={layers[layer.key]} onClick={()=>setLayers((current)=>({...current,[layer.key]:!current[layer.key]}))} className={`relative h-5 w-9 rounded-full transition ${layers[layer.key]?'bg-[#276f59]':'bg-[#d5ddd8]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition ${layers[layer.key]?'left-[18px]':'left-0.5'}`}/></button><span className="h-2.5 w-2.5 rounded-full" style={{background:layer.color}}/><span className="text-xs font-medium text-[#45514d]">{layer.label}</span></div>)}</div></div>
      <div className="pointer-events-none absolute bottom-6 left-3 z-[900] max-w-[min(390px,calc(100%-24px))] rounded-2xl border border-white/80 bg-white/94 px-4 py-3 shadow-[0_10px_32px_rgb(25_45_37/14%)] backdrop-blur-md sm:left-4"><div className="mb-2 flex items-center gap-2"><Info size={13} className="text-[#176b52]"/><span className="text-[11px] font-semibold uppercase tracking-[.1em] text-[#65716c]">Legenda</span></div><div className="flex flex-wrap gap-x-4 gap-y-2">{activeLegend.map((item)=><span key={item.key} className="flex items-center gap-1.5 text-[11px] font-medium text-[#58635f]"><span className="h-2 w-2 rounded-full" style={{background:item.color}}/>{item.label}</span>)}</div><div className="mt-3 border-t border-[#e1e7e3] pt-3 text-[10px] leading-4 text-[#65716c]"><strong className="block text-[11px] text-[#35413d]">Como interpretar o mapa?</strong><p className="mt-1"><strong>Pontos analisados:</strong> cada ponto representa um CEP georreferenciado utilizado no estudo. Eles não representam necessariamente imóveis individuais.</p><p className="mt-1"><strong>Zonas de distância:</strong> mostram proximidade em relação ao percurso do metrô. São faixas exploratórias e não significam, por si só, efeito sobre valorização imobiliária.</p></div></div>
      <div className="pointer-events-none absolute left-3 top-[330px] z-[900] max-w-[290px] rounded-xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-[10px] leading-4 text-amber-900 shadow-sm sm:left-4"><strong>Traçado provisório:</strong> geometria baseada na ligação entre estações. As zonas usam o traçado provisório atualmente disponível.</div>
      {!point?<div className="pointer-events-none absolute bottom-6 right-3 z-[900] w-[min(340px,calc(100%-24px))] rounded-2xl border border-[#dbe3de] bg-[#17241f]/94 p-4 text-white shadow-xl backdrop-blur-md sm:right-16"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10"><MousePointer2 size={17}/></span><div><h3 className="text-sm font-semibold">{analyzeMode?'Selecione um ponto individual':'Analisar ponto'}</h3><p className="mt-1 text-xs leading-5 text-white/65">{analyzeMode?'Aproxime o mapa e clique em um ponto laranja para destacar suas conexões.':'Ative o modo de análise para visualizar a estação, a linha e os dois segmentos de proximidade.'}</p></div></div></div>:
        <div className="absolute bottom-6 right-3 z-[900] w-[min(370px,calc(100%-24px))] rounded-2xl border border-[#dbe3de] bg-white/96 p-4 shadow-[0_16px_44px_rgb(20_39_32/22%)] backdrop-blur-md sm:right-16"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0e7] text-[#bd5b20]"><MapPin size={16}/></span><div><p className="text-sm font-semibold">{point.street??`CEP ${point.cep}`}</p><p className="text-[11px] text-[#7b8581]">{point.locality} · {point.cep}</p></div></div><button onClick={clearPoint} className="rounded-lg p-1.5 text-[#7b8581] hover:bg-[#eef2ef]" aria-label="Limpar análise"><X size={15}/></button></div><div className="mt-3 grid grid-cols-2 gap-2"><Metric icon={<TrainFront size={14}/>} label="Estação mais próxima" value={`${point.station} · ${meters(point.stationDistance)}`}/><Metric icon={<Route size={14}/>} label="Linha mais próxima" value={`${point.line} · ${meters(point.lineDistance)}`}/></div><p className="mt-3 flex items-start gap-2 text-[11px] leading-4 text-[#77827e]"><Info size={13} className="mt-0.5 shrink-0"/><span><strong>Distância ao percurso:</strong> {point.range??'não classificada'}. Conexão escura até a estação; conexão laranja até o ponto mais próximo do traçado provisório.</span></p></div>}
    </div>
  </section>;
}

function Metric({icon,label,value}:{icon:ReactNode;label:string;value:string}){return <div className="rounded-xl border border-[#e0e6e2] p-3"><span className="mb-2 flex items-center gap-1.5 text-[#73807b]">{icon}<span className="text-[10px] font-medium">{label}</span></span><p className="text-xs font-semibold text-[#37433f]">{value}</p></div>;}
function meters(value:number){return `${Math.round(value).toLocaleString('pt-BR')} m`;}
function toLatLng(position:Position):[number,number]{return[Number(position[1]),Number(position[0])];}
function stringOrNull(value:unknown){return value===null||value===undefined||value===''?null:String(value);}
function parsePoint(value:unknown):Point|null{if(value&&typeof value==='object'&&(value as Point).type==='Point')return value as Point;if(typeof value==='string'){try{const parsed=JSON.parse(value) as Point;return parsed.type==='Point'?parsed:null;}catch{return null;}}return null;}
function toAnalyzedPoint(row:StudyMapPoint):AnalyzedPoint{return{id:row.id,cep:row.cep,street:row.street,locality:row.locality,coordinates:row.geometry.coordinates,station:row.nearest_station_name,stationCoordinates:[row.nearest_station_longitude,row.nearest_station_latitude],stationDistance:row.distance_station_m,line:row.nearest_line_name,lineCode:row.nearest_line_code,lineCoordinates:row.closest_point.coordinates,lineDistance:row.distance_line_m,range:row.distance_line_range,methodVersion:row.method_version};}
function featureToAnalyzedPoint(feature:Feature<Point>):AnalyzedPoint|null{const properties=feature.properties??{};const closest=parsePoint(properties.closest_point);const station:[number,number]=[Number(properties.nearest_station_longitude),Number(properties.nearest_station_latitude)];if(!closest||station.some((value)=>!Number.isFinite(value)))return null;return{id:String(feature.id??properties.id),cep:stringOrNull(properties.cep),street:stringOrNull(properties.street),locality:stringOrNull(properties.locality),coordinates:feature.geometry.coordinates,station:String(properties.nearest_station_name),stationCoordinates:station,stationDistance:Number(properties.distance_station_m),line:String(properties.nearest_line_name),lineCode:String(properties.nearest_line_code),lineCoordinates:closest.coordinates,lineDistance:Number(properties.distance_line_m),range:stringOrNull(properties.distance_line_range),methodVersion:String(properties.method_version)};}
function pointTooltip(properties:Record<string,unknown>){return `<strong>${escapeHtml(String(properties.street??properties.cep??'Ponto analisado'))}</strong><br>CEP: ${escapeHtml(String(properties.cep??'não informado'))}<br>Estação: ${escapeHtml(String(properties.nearest_station_name??''))}<br>Distância: ${escapeHtml(formatDistance(properties.distance_station_m)??'')}`;}
function formatDistance(value:unknown){const number=Number(value);return Number.isFinite(number)?meters(number):null;}
function formatDate(value:unknown){if(!value)return'Não informada';const date=new Date(`${String(value)}T00:00:00`);return Number.isNaN(date.getTime())?'Não informada':date.toLocaleDateString('pt-BR');}
function statusLabel(value:unknown){return({active:'Operacional',planned:'Planejada',under_construction:'Em construção',inactive:'Inativa'} as Record<string,string>)[String(value)]??String(value??'Não informado');}
function escapeHtml(value:string){return value.replace(/[&<>'"]/g,(character)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]??character));}
function isAbortLike(error:unknown){const candidate=error as {name?:unknown;message?:unknown;details?:unknown;hint?:unknown};return[candidate?.name,candidate?.message,candidate?.details,candidate?.hint].some((value)=>typeof value==='string'&&/abort/i.test(value));}
async function probeBaseMap(template:string,center:[number,number],zoom:number):Promise<{ok:boolean;url:string;reason:string}> {
  const latitudeRadians=center[0]*Math.PI/180;
  const scale=2**zoom;
  const x=Math.floor((center[1]+180)/360*scale);
  const y=Math.floor((1-Math.asinh(Math.tan(latitudeRadians))/Math.PI)/2*scale);
  const url=template.replace('{s}','a').replace('{z}',String(zoom)).replace('{x}',String(x)).replace('{y}',String(y));
  try{
    const response=await fetch(url,{cache:'no-store'});
    const contentType=response.headers.get('content-type')?.toLowerCase()??'';
    if(response.status===401||response.status===403)return{ok:false,url,reason:`HTTP ${response.status}: acesso recusado`};
    if(!response.ok)return{ok:false,url,reason:`HTTP ${response.status}`};
    if(!contentType.startsWith('image/')){
      const body=(await response.text()).slice(0,300);
      const apiKeyMessage=/api\s*key\s*required|access[_ -]?token|unauthorized|forbidden/i.test(body);
      return{ok:false,url,reason:apiKeyMessage?'resposta exige chave ou token':`content-type inválido (${contentType||'ausente'})`};
    }
    return{ok:true,url,reason:`HTTP ${response.status}, ${contentType}`};
  }catch(error){return{ok:false,url,reason:error instanceof Error?error.message:'falha de rede'};}
}
