import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import { getSupabaseClient } from './client';
import type { ResearchMaterial, StudyPointRow } from '@/types/study';

const emptyCollection = <T extends Geometry>():FeatureCollection<T> => ({ type:'FeatureCollection', features:[] });
type LineRow = { id:string; code:string; name:string; color_hex:string|null; inauguration_date:string|null; status:string; geom:Geometry };
type StationRow = { id:string; name:string; inauguration_date:string|null; status:string; geom:Point; metro_lines:{code:string;name:string}|null };

export async function loadMapCollections() {
  const client = getSupabaseClient();
  if (!client) return { lines:emptyCollection(), stations:emptyCollection<Point>(), points:emptyCollection<Point>() };
  const [{data:lineRowsRaw,error:lineError},{data:stationRowsRaw,error:stationError},{data:pointRowsRaw,error:pointError}] = await Promise.all([
    client.from('metro_lines').select('id,code,name,color_hex,inauguration_date,status,geom'),
    client.from('stations').select('id,name,inauguration_date,status,geom,metro_lines(code,name)'),
    client.from('study_points_with_metrics').select('*'),
  ]);
  const error = lineError ?? stationError ?? pointError;
  if (error) throw error;
  const lineRows=(lineRowsRaw ?? []) as unknown as LineRow[];
  const stationRows=(stationRowsRaw ?? []) as unknown as StationRow[];
  const pointRows=(pointRowsRaw ?? []) as unknown as StudyPointRow[];
  const lines:FeatureCollection = { type:'FeatureCollection', features:lineRows.map((row)=>({ type:'Feature', id:row.id, geometry:row.geom, properties:{ id:row.id, code:row.code, name:row.name, color:row.color_hex, inauguration_date:row.inauguration_date, status:row.status } })) };
  const stations:FeatureCollection<Point> = { type:'FeatureCollection', features:stationRows.map((row)=>({ type:'Feature', id:row.id, geometry:row.geom, properties:{ id:row.id, name:row.name, line:row.metro_lines?.name, line_code:row.metro_lines?.code, inauguration_date:row.inauguration_date, status:row.status } })) as Feature<Point>[] };
  const points:FeatureCollection<Point> = { type:'FeatureCollection', features:pointRows.map((row)=>({ type:'Feature', id:row.id, geometry:{type:'Point',coordinates:[row.longitude,row.latitude]}, properties:row })) as Feature<Point>[] };
  return { lines,stations,points };
}

export async function loadStudyPoints():Promise<StudyPointRow[]> {
  const client=getSupabaseClient(); if(!client) return [];
  const {data,error}=await client.from('study_points_with_metrics').select('*');
  if(error) throw error; return (data ?? []) as StudyPointRow[];
}

export async function loadResearchMaterials():Promise<ResearchMaterial[]> {
  const client=getSupabaseClient(); if(!client) return [];
  const {data,error}=await client.from('research_materials').select('id,title,description,material_type,storage_path,external_url,responsible,publication_date').order('publication_date',{ascending:false});
  if(error) throw error; return (data ?? []) as ResearchMaterial[];
}
