import type { StudyPointRow } from '@/types/study';

const headers = ['cep','logradouro','localidade','latitude','longitude','nearest_station','distance_station_m','nearest_line','distance_line_m','distance_line_range'];
const escapeCell = (value:unknown) => `"${String(value ?? '').replaceAll('"','""')}"`;

export function downloadPointsCsv(points:StudyPointRow[], filename='geometro-pontos.csv') {
  const rows = points.map((point) => [point.cep,point.street,point.locality,point.latitude,point.longitude,point.nearest_station,point.distance_station_m,point.nearest_line,point.distance_line_m,point.distance_line_range]);
  const csv = '\uFEFF' + [headers,...rows].map((row)=>row.map(escapeCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link = document.createElement('a'); link.href=url; link.download=filename; link.click(); URL.revokeObjectURL(url);
}
