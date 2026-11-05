export type TrackMethodVersion = 'shapefile-track-v1' | 'provisional-track-v1';

export const SHAPEFILE_TRACK:TrackMethodVersion = 'shapefile-track-v1';
export const PROVISIONAL_TRACK:TrackMethodVersion = 'provisional-track-v1';

export const TRACK_VERSIONS:Record<TrackMethodVersion,{short:string;label:string;description:string;color:{L1:string;L2:string}}> = {
  'shapefile-track-v1':{
    short:'Validado',
    label:'Traçado validado',
    description:'Geometria vetorial detalhada (shapefile tracado_metro.shp) utilizada para representar o percurso real com maior precisão, com curvas e vias paralelas.',
    color:{L1:'#C63A22',L2:'#183A73'},
  },
  'provisional-track-v1':{
    short:'Provisório',
    label:'Traçado provisório',
    description:'Geometria simplificada construída a partir da ligação entre estações. Não representa as curvas da via.',
    color:{L1:'#e08a00',L2:'#8a4fd0'},
  },
};

export const TRACK_VERSION_ORDER:TrackMethodVersion[] = ['shapefile-track-v1','provisional-track-v1'];

export function isTrackMethodVersion(value:unknown):value is TrackMethodVersion {
  return value==='shapefile-track-v1'||value==='provisional-track-v1';
}

export function trackLabel(version:string|null|undefined) {
  return isTrackMethodVersion(version)?TRACK_VERSIONS[version].label:String(version??'—');
}
