import type { FeatureCollection, Geometry, LineString, Point, Position } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';

export const layerIds = {
  line1:'metro-line-1', line2:'metro-line-2', stations:'metro-stations', points:'study-points',
  pointClusters:'study-point-clusters', pointClusterCount:'study-point-cluster-count',
  selectedPoint:'selected-study-point', selectedStation:'selected-nearest-station', stationConnection:'analysis-station-connection',
  stationConnectionLabel:'analysis-station-connection-label', lineConnection:'analysis-line-connection',
  lineConnectionLabel:'analysis-line-connection-label', buffers:'distance-buffers',
} as const;

export function addStudyLayers(map:MapLibreMap, data:{lines:FeatureCollection<Geometry>;stations:FeatureCollection<Point>;points:FeatureCollection<Point>}) {
  map.addSource('metro-lines',{type:'geojson',data:data.lines});
  map.addLayer({id:layerIds.line1,type:'line',source:'metro-lines',filter:['==',['get','code'],'L1'],paint:{'line-color':['coalesce',['get','color'],'#176b52'],'line-width':4,'line-opacity':.92}});
  map.addLayer({id:layerIds.line2,type:'line',source:'metro-lines',filter:['==',['get','code'],'L2'],paint:{'line-color':['coalesce',['get','color'],'#246db4'],'line-width':4,'line-opacity':.92}});
  map.addSource('metro-stations',{type:'geojson',data:data.stations});
  map.addLayer({id:layerIds.stations,type:'circle',source:'metro-stations',paint:{'circle-radius':6,'circle-color':'#24332e','circle-stroke-width':2,'circle-stroke-color':'#fff'}});
  map.addSource('study-points',{type:'geojson',data:data.points});
  map.addLayer({id:layerIds.pointClusters,type:'circle',source:'study-points',filter:['==',['get','kind'],'cluster'],paint:{'circle-color':['step',['get','point_count'],'#e59a62',100,'#d97835',750,'#b84e1e'],'circle-radius':['step',['get','point_count'],15,100,20,750,27],'circle-stroke-width':2,'circle-stroke-color':'#fff','circle-opacity':.9}});
  map.addLayer({id:layerIds.pointClusterCount,type:'symbol',source:'study-points',filter:['==',['get','kind'],'cluster'],layout:{'text-field':['get','point_count'],'text-size':11},paint:{'text-color':'#fff'}});
  map.addLayer({id:layerIds.points,type:'circle',source:'study-points',filter:['==',['get','kind'],'point'],paint:{'circle-radius':['interpolate',['linear'],['zoom'],14,4,16,6],'circle-color':'#d96f2d','circle-opacity':.82,'circle-stroke-width':1,'circle-stroke-color':'#fff'}});
  map.addSource('analysis-connections',{type:'geojson',data:emptyLines()});
  map.addLayer({id:layerIds.stationConnection,type:'line',source:'analysis-connections',filter:['==',['get','kind'],'station'],paint:{'line-color':'#26332f','line-width':2.5,'line-dasharray':[2,2]}});
  map.addLayer({id:layerIds.lineConnection,type:'line',source:'analysis-connections',filter:['==',['get','kind'],'line'],paint:{'line-color':'#d96f2d','line-width':3}});
  map.addLayer({id:layerIds.stationConnectionLabel,type:'symbol',source:'analysis-connections',filter:['==',['get','kind'],'station'],layout:{'symbol-placement':'line-center','text-field':['get','label'],'text-size':11},paint:{'text-color':'#26332f','text-halo-color':'#fff','text-halo-width':2}});
  map.addLayer({id:layerIds.lineConnectionLabel,type:'symbol',source:'analysis-connections',filter:['==',['get','kind'],'line'],layout:{'symbol-placement':'line-center','text-field':['get','label'],'text-size':11},paint:{'text-color':'#a94718','text-halo-color':'#fff','text-halo-width':2}});
  map.addSource('selected-study-point',{type:'geojson',data:emptyPoints()});
  map.addLayer({id:layerIds.selectedPoint,type:'circle',source:'selected-study-point',filter:['==',['get','role'],'point'],paint:{'circle-radius':9,'circle-color':'#d96f2d','circle-stroke-width':4,'circle-stroke-color':'#fff'}});
  map.addLayer({id:layerIds.selectedStation,type:'circle',source:'selected-study-point',filter:['==',['get','role'],'station'],paint:{'circle-radius':9,'circle-color':'#26332f','circle-stroke-width':4,'circle-stroke-color':'#fff'}});
  map.addSource('distance-buffers',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:layerIds.buffers,type:'fill',source:'distance-buffers',layout:{visibility:'none'},paint:{'fill-color':'#8c6bc2','fill-opacity':.12,'fill-outline-color':'#8c6bc2'}});
}

export function showPointAnalysis(map:MapLibreMap, origin:Position, station:Position, line:Position, stationDistance?:number, lineDistance?:number) {
  (map.getSource('analysis-connections') as GeoJSONSource).setData({type:'FeatureCollection',features:[
    {type:'Feature',properties:{kind:'station',label:formatMeters(stationDistance)},geometry:{type:'LineString',coordinates:[origin,station]}},
    {type:'Feature',properties:{kind:'line',label:formatMeters(lineDistance)},geometry:{type:'LineString',coordinates:[origin,line]}},
  ]});
  (map.getSource('selected-study-point') as GeoJSONSource).setData({type:'FeatureCollection',features:[
    {type:'Feature',properties:{role:'point'},geometry:{type:'Point',coordinates:origin}},
    {type:'Feature',properties:{role:'station'},geometry:{type:'Point',coordinates:station}},
  ]});
}

export function clearPointAnalysis(map:MapLibreMap) {
  (map.getSource('analysis-connections') as GeoJSONSource | undefined)?.setData(emptyLines());
  (map.getSource('selected-study-point') as GeoJSONSource | undefined)?.setData(emptyPoints());
}

export function setStudyLayerVisibility(map:MapLibreMap,key:'line1'|'line2'|'stations'|'points'|'buffers',visible:boolean) {
  const ids = key==='points' ? [layerIds.points,layerIds.pointClusters,layerIds.pointClusterCount] : [layerIds[key]];
  for(const id of ids) if(map.getLayer(id)) map.setLayoutProperty(id,'visibility',visible?'visible':'none');
}

function emptyLines():FeatureCollection<LineString> { return {type:'FeatureCollection',features:[]}; }
function emptyPoints():FeatureCollection<Point> { return {type:'FeatureCollection',features:[]}; }
function formatMeters(value?:number){return Number.isFinite(value)?`${Math.round(value!)} m`:'';}
