import type { FeatureCollection, Geometry, Point } from 'geojson';
import type { Map as MapLibreMap } from 'maplibre-gl';

export const layerIds = { line1:'metro-line-1', line2:'metro-line-2', stations:'metro-stations', points:'study-points', buffers:'distance-buffers' } as const;

export function addStudyLayers(map:MapLibreMap, data:{lines:FeatureCollection<Geometry>;stations:FeatureCollection<Point>;points:FeatureCollection<Point>}) {
  map.addSource('metro-lines',{type:'geojson',data:data.lines});
  map.addLayer({id:layerIds.line1,type:'line',source:'metro-lines',filter:['==',['get','code'],'L1'],paint:{'line-color':['coalesce',['get','color'],'#176b52'],'line-width':4,'line-opacity':.92}});
  map.addLayer({id:layerIds.line2,type:'line',source:'metro-lines',filter:['==',['get','code'],'L2'],paint:{'line-color':['coalesce',['get','color'],'#246db4'],'line-width':4,'line-opacity':.92}});
  map.addSource('metro-stations',{type:'geojson',data:data.stations});
  map.addLayer({id:layerIds.stations,type:'circle',source:'metro-stations',paint:{'circle-radius':6,'circle-color':'#24332e','circle-stroke-width':2,'circle-stroke-color':'#fff'}});
  map.addSource('study-points',{type:'geojson',data:data.points});
  map.addLayer({id:layerIds.points,type:'circle',source:'study-points',paint:{'circle-radius':4,'circle-color':'#d96f2d','circle-opacity':.82,'circle-stroke-width':1,'circle-stroke-color':'#fff'}});
  map.addSource('distance-buffers',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:layerIds.buffers,type:'fill',source:'distance-buffers',layout:{visibility:'none'},paint:{'fill-color':'#8c6bc2','fill-opacity':.12,'fill-outline-color':'#8c6bc2'}});
}

export function setStudyLayerVisibility(map:MapLibreMap,key:keyof typeof layerIds,visible:boolean) {
  const id=layerIds[key]; if(map.getLayer(id)) map.setLayoutProperty(id,'visibility',visible?'visible':'none');
}
