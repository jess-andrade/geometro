import type { StudyPointRow } from '@/types/study';

const headers=['cep','logradouro','localidade','latitude','longitude','etapa_georreferenciamento','precisao_geocodificacao','nearest_station','nearest_station_line','distance_station_m','station_distance_method','nearest_line','distance_line_m','distance_line_range','line_method_version','quality_status','source_file','source_ref','created_at'];
const escapeCell=(value:unknown)=>`"${String(value??'').replaceAll('"','""')}"`;

export function downloadPointsCsv(points:StudyPointRow[],filename='geometro-pontos.csv'){
  const rows=points.map((point)=>[point.cep,point.street,point.locality,point.latitude,point.longitude,point.georeferencing_stage,point.geocoding_precision,point.nearest_station_name,point.nearest_station_line,point.distance_station_m,point.station_distance_method,point.nearest_line_name,point.distance_line_m,point.distance_line_range,point.method_version,point.quality_status,point.source_file,point.source_ref,point.created_at]);
  const csv='\uFEFF'+[headers,...rows].map((row)=>row.map(escapeCell).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=filename;link.click();URL.revokeObjectURL(url);
}
