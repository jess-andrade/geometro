import type { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import { getSupabaseClient } from './client';
import type {
  DistanceRangeDistribution,
  DescriptiveStats,
  EcdfPoint,
  GroupComparison,
  GeocodingQualitySummary,
  HistogramBin,
  NearestLineDistribution,
  QuarantinedStudyPoint,
  ResearchMaterial,
  StudyMapPoint,
  StudyPointFilters,
  StudyPointRow,
  StudySummary,
  ScatterPoint,
} from '@/types/study';

const emptyCollection = <T extends Geometry>(): FeatureCollection<T> => ({ type:'FeatureCollection', features:[] });

type LineRow = { id:string; code:string; name:string; color_hex:string|null; status:string; source_name:string|null; geometry:Geometry };
type StationRow = { id:string; code:string|null; name:string; line_id:string; line_code:string; line_name:string; color_hex:string|null; inauguration_date:string|null; status:string; source_name:string|null; geometry:Point };

export async function loadMapCollections() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Variáveis públicas do Supabase não configuradas.');
  const [lineResult, stationResult] = await Promise.all([
    client.from('v_metro_lines_map').select('*').order('code'),
    client.from('v_stations_map').select('*').order('line_code').order('code'),
  ]);
  const error = lineResult.error ?? stationResult.error;
  if (error) throw error;
  const lineRows = (lineResult.data ?? []) as unknown as LineRow[];
  const stationRows = (stationResult.data ?? []) as unknown as StationRow[];
  const lines:FeatureCollection = { type:'FeatureCollection', features:lineRows.map((row) => ({ type:'Feature', id:row.id, geometry:row.geometry, properties:{ id:row.id, code:row.code, name:row.name, color:row.color_hex, status:row.status, source_name:row.source_name } })) };
  const stations:FeatureCollection<Point> = { type:'FeatureCollection', features:stationRows.map((row) => ({ type:'Feature', id:row.id, geometry:row.geometry, properties:{ id:row.id, code:row.code, name:row.name, line:row.line_name, line_code:row.line_code, color:row.color_hex, inauguration_date:row.inauguration_date, status:row.status, source_name:row.source_name } })) as Feature<Point>[] };
  return { lines, stations, points:emptyCollection<Point>() };
}

export async function loadStudyPointsViewport(bounds:{west:number;south:number;east:number;north:number},zoom:number,signal?:AbortSignal):Promise<FeatureCollection<Point>> {
  const client=getSupabaseClient();
  if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  let request=client.rpc('get_study_points_viewport',{p_west:bounds.west,p_south:bounds.south,p_east:bounds.east,p_north:bounds.north,p_zoom:Math.floor(zoom)});
  if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;
  if(error)throw error;
  return data as unknown as FeatureCollection<Point>;
}

export async function searchStudyPoints(query:string,signal?:AbortSignal) {
  const client=getSupabaseClient();
  if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  let request=client.rpc('search_study_points',{p_query:query,p_limit:8});
  if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;
  if(error)throw error;
  return (data??[]) as Array<{id:string;cep:string;street:string|null;locality:string|null;longitude:number;latitude:number}>;
}

export async function loadStudyMapPoint(id:string):Promise<StudyMapPoint> {
  const client=getSupabaseClient();
  if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.from('v_study_points_map').select('*').eq('id',id).single();
  if(error)throw error;
  return data as unknown as StudyMapPoint;
}

export async function loadStudySummary():Promise<StudySummary> {
  const client=getSupabaseClient();
  if(!client) throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.from('v_study_summary').select('*').single();
  if(error) throw error;
  return data as unknown as StudySummary;
}

export async function loadAnalysisDistributions():Promise<{ranges:DistanceRangeDistribution[];lines:NearestLineDistribution[]}> {
  const client=getSupabaseClient();
  if(!client) throw new Error('Variáveis públicas do Supabase não configuradas.');
  const [rangeResult,lineResult]=await Promise.all([
    client.from('v_distance_range_distribution').select('*').order('sort_order'),
    client.from('v_nearest_line_distribution').select('*').order('line_code'),
  ]);
  const error=rangeResult.error??lineResult.error;
  if(error) throw error;
  return {
    ranges:(rangeResult.data??[]) as unknown as DistanceRangeDistribution[],
    lines:(lineResult.data??[]) as unknown as NearestLineDistribution[],
  };
}

export async function loadDescriptiveStats():Promise<DescriptiveStats[]> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.from('v_distance_descriptive_stats').select('*').order('metric');if(error)throw error;
  return (data??[]) as unknown as DescriptiveStats[];
}

export async function loadHistogram(metric:'station'|'track',binWidth:number,signal?:AbortSignal):Promise<HistogramBin[]> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  let request=client.rpc('get_distance_histogram',{p_metric:metric,p_bin_width_m:binWidth});if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;if(error)throw error;return (data??[]) as unknown as HistogramBin[];
}

export async function loadEcdf(metric:'station'|'track',step=250):Promise<EcdfPoint[]> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.rpc('get_distance_ecdf',{p_metric:metric,p_step_m:step});if(error)throw error;
  return (data??[]) as unknown as EcdfPoint[];
}

export async function loadScatterAndComparisons():Promise<{scatter:ScatterPoint[];groups:GroupComparison[]}> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const [scatterResult,groupResult]=await Promise.all([
    client.from('v_analysis_scatter_sample').select('*').order('sample_order'),
    client.from('v_analysis_group_comparison').select('*'),
  ]);const error=scatterResult.error??groupResult.error;if(error)throw error;
  return {scatter:(scatterResult.data??[]) as unknown as ScatterPoint[],groups:(groupResult.data??[]) as unknown as GroupComparison[]};
}

export async function loadGeocodingQualitySummary():Promise<GeocodingQualitySummary[]> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.from('v_geocoding_quality_summary').select('*');if(error)throw error;
  return (data??[]) as unknown as GeocodingQualitySummary[];
}

export async function loadQuarantinedStudyPoints():Promise<QuarantinedStudyPoint[]> {
  const client=getSupabaseClient();if(!client)throw new Error('Variáveis públicas do Supabase não configuradas.');
  const {data,error}=await client.from('v_study_points_quarantine_public').select('*').order('quarantined_at',{ascending:false});if(error)throw error;
  return (data??[]) as unknown as QuarantinedStudyPoint[];
}

export async function loadStudyPoints(filters:StudyPointFilters):Promise<{rows:StudyPointRow[];count:number}> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Variáveis públicas do Supabase não configuradas.');
  const from = filters.page * filters.pageSize;
  const to = from + filters.pageSize - 1;
  let request = client.from('v_study_points_data').select('*', { count:'exact' });
  const term = filters.query.trim().replace(/[%_,().]/g, ' ');
  if (term) request = request.or(`cep.ilike.%${term}%,street.ilike.%${term}%,locality.ilike.%${term}%`);
  if (filters.line) request = request.eq('nearest_line_name', filters.line);
  if (filters.distanceRange) request = request.eq('distance_line_range', filters.distanceRange);
  const {data,error,count} = await request.order(filters.sort, { ascending:filters.ascending, nullsFirst:false }).range(from,to);
  if (error) throw error;
  return { rows:(data ?? []) as unknown as StudyPointRow[], count:count ?? 0 };
}

export async function loadStudyPointFilterOptions() {
  const client = getSupabaseClient();
  if (!client) return { lines:[] as string[], ranges:[] as string[] };
  const [lineResult,rangeResult] = await Promise.all([
    client.from('v_metro_lines_map').select('name').order('code'),
    client.from('distance_ranges').select('label').order('sort_order'),
  ]);
  const error = lineResult.error ?? rangeResult.error;
  if (error) throw error;
  return { lines:(lineResult.data ?? []).map((item)=>item.name), ranges:(rangeResult.data ?? []).map((item)=>item.label) };
}

export async function loadAllStudyPointsForExport(filters:StudyPointFilters) {
  const allRows:StudyPointRow[] = [];
  let page=0;
  while (true) {
    const result=await loadStudyPoints({...filters,page,pageSize:1000});
    allRows.push(...result.rows);
    if(allRows.length>=result.count || result.rows.length<1000) break;
    page+=1;
  }
  return allRows;
}

export async function loadResearchMaterials():Promise<ResearchMaterial[]> {
  const client=getSupabaseClient(); if(!client) return [];
  const {data,error}=await client.from('research_materials').select('id,title,description,material_type,storage_path,external_url,responsible,publication_date,uploader_name,file_size_bytes,created_at').order('created_at',{ascending:false});
  if(error) throw error; return (data ?? []) as ResearchMaterial[];
}
