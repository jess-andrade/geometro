import type { Feature, FeatureCollection, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import { getSupabaseClient } from './client';
import { PROVISIONAL_TRACK, SHAPEFILE_TRACK, isTrackMethodVersion, type TrackMethodVersion } from '@/lib/geo/track-versions';
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
  StationTrackQa,
  StudyMapPoint,
  StudyPointFilters,
  StudyPointRow,
  StudySummary,
  ScatterPoint,
  TrackComparison,
  TrackComparisonPoint,
  TrackRangeTransition,
  TrackVersionInfo,
} from '@/types/study';

const emptyCollection = <T extends Geometry>(): FeatureCollection<T> => ({ type:'FeatureCollection', features:[] });

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Variáveis públicas do Supabase não configuradas.');
  return client;
}

/**
 * Catálogo de versões do traçado.
 * `versioned=false` significa que a migration shapefile-track-v1 ainda não foi aplicada
 * no banco: só existe provisional-track-v1 e as views legadas são usadas.
 */
export type TrackCatalog = { versioned:boolean; current:TrackMethodVersion; available:TrackMethodVersion[]; versions:TrackVersionInfo[] };

let catalogPromise:Promise<TrackCatalog>|null = null;

export function loadTrackCatalog():Promise<TrackCatalog> {
  catalogPromise ??= (async () => {
    const client = requireClient();
    const { data, error } = await client.from('v_metro_track_versions').select('*');
    if (error) {
      // PGRST205 = relação inexistente: banco ainda sem versionamento de traçado.
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { versioned:false, current:PROVISIONAL_TRACK, available:[PROVISIONAL_TRACK], versions:[] };
      }
      catalogPromise = null;
      throw error;
    }
    const versions = ((data ?? []) as unknown as TrackVersionInfo[]).filter((item) => item.validated);
    const available = versions.map((item) => item.method_version).filter(isTrackMethodVersion);
    const currentRow = versions.find((item) => item.is_current);
    const current = isTrackMethodVersion(currentRow?.method_version) ? currentRow.method_version : (available.includes(SHAPEFILE_TRACK) ? SHAPEFILE_TRACK : PROVISIONAL_TRACK);
    return { versioned:true, current, available:available.length ? available : [PROVISIONAL_TRACK], versions };
  })();
  return catalogPromise;
}

type LineRow = { id:string; metro_line_id?:string; code:string; name:string; color_hex:string|null; status:string; source_name:string|null; method_version?:string; geometry:Geometry };
type StationRow = { id:string; code:string|null; name:string; line_id:string; line_code:string; line_name:string; color_hex:string|null; inauguration_date:string|null; status:string; source_name:string|null; geometry:Point };

/** Linhas de todas as versões disponíveis (propriedade method_version em cada feature) + estações. */
export async function loadMapCollections(catalog:TrackCatalog) {
  const client = requireClient();
  const [lineResult, stationResult] = await Promise.all([
    catalog.versioned
      ? client.from('v_metro_line_versions_map').select('id,metro_line_id,code,name,color_hex,status,source_name,method_version,geometry').eq('validated',true).order('code')
      : client.from('v_metro_lines_map').select('id,code,name,color_hex,status,source_name,geometry').order('code'),
    client.from('v_stations_map').select('*').order('line_code').order('code'),
  ]);
  const error = lineResult.error ?? stationResult.error;
  if (error) throw error;
  const lineRows = (lineResult.data ?? []) as unknown as LineRow[];
  const stationRows = (stationResult.data ?? []) as unknown as StationRow[];
  const lines:FeatureCollection = { type:'FeatureCollection', features:lineRows.map((row) => ({ type:'Feature', id:row.id, geometry:row.geometry, properties:{ id:row.metro_line_id ?? row.id, code:row.code, name:row.name, color:row.color_hex, status:row.status, source_name:row.source_name, method_version:row.method_version ?? PROVISIONAL_TRACK } })) };
  const stations:FeatureCollection<Point> = { type:'FeatureCollection', features:stationRows.map((row) => ({ type:'Feature', id:row.id, geometry:row.geometry, properties:{ id:row.id, code:row.code, name:row.name, line:row.line_name, line_code:row.line_code, color:row.color_hex, inauguration_date:row.inauguration_date, status:row.status, source_name:row.source_name } })) as Feature<Point>[] };
  return { lines, stations, points:emptyCollection<Point>() };
}

/** Zonas de distância pré-calculadas no banco (null quando o banco ainda não tem a migration). */
export async function loadTrackZones(catalog:TrackCatalog, version:TrackMethodVersion):Promise<FeatureCollection<Polygon|MultiPolygon>|null> {
  if (!catalog.versioned) return null;
  const { data, error } = await requireClient().from('v_track_distance_zones_map').select('zone_code,label,min_distance_m,max_distance_m,sort_order,geometry').eq('method_version',version).order('sort_order');
  if (error) throw error;
  type ZoneRow = { zone_code:string; label:string; min_distance_m:number; max_distance_m:number; sort_order:number; geometry:Polygon|MultiPolygon };
  return { type:'FeatureCollection', features:((data ?? []) as unknown as ZoneRow[]).map((row) => ({ type:'Feature', geometry:row.geometry, properties:{ code:row.zone_code, label:row.label, min:row.min_distance_m, max:row.max_distance_m } })) };
}

export async function loadStudyPointsViewport(catalog:TrackCatalog, version:TrackMethodVersion, bounds:{west:number;south:number;east:number;north:number}, zoom:number, signal?:AbortSignal):Promise<FeatureCollection<Point>> {
  const client = requireClient();
  const params = { p_west:bounds.west, p_south:bounds.south, p_east:bounds.east, p_north:bounds.north, p_zoom:Math.floor(zoom) };
  let request = catalog.versioned
    ? client.rpc('get_study_points_viewport_by_version', { ...params, p_method_version:version })
    : client.rpc('get_study_points_viewport', params);
  if (signal) request = request.abortSignal(signal);
  const { data, error } = await request;
  if (error) throw error;
  return data as unknown as FeatureCollection<Point>;
}

export async function searchStudyPoints(query:string,signal?:AbortSignal) {
  const client=requireClient();
  let request=client.rpc('search_study_points',{p_query:query,p_limit:8});
  if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;
  if(error)throw error;
  return (data??[]) as Array<{id:string;cep:string;street:string|null;locality:string|null;longitude:number;latitude:number}>;
}

export async function loadStudyMapPoint(catalog:TrackCatalog, version:TrackMethodVersion, id:string):Promise<StudyMapPoint> {
  const client=requireClient();
  const request = catalog.versioned
    ? client.from('v_study_points_map_by_version').select('*').eq('id',id).eq('method_version',version)
    : client.from('v_study_points_map').select('*').eq('id',id);
  const {data,error}=await request.single();
  if(error)throw error;
  return data as unknown as StudyMapPoint;
}

/** Resumo da versão atual (as views legadas refletem a versão padrão do banco). */
export async function loadStudySummary():Promise<StudySummary> {
  const {data,error}=await requireClient().from('v_study_summary').select('*').single();
  if(error) throw error;
  return data as unknown as StudySummary;
}

export async function loadAnalysisDistributions(catalog:TrackCatalog, version:TrackMethodVersion):Promise<{ranges:DistanceRangeDistribution[];lines:NearestLineDistribution[]}> {
  const client=requireClient();
  const [rangeResult,lineResult]=await Promise.all([
    catalog.versioned ? client.from('v_distance_range_distribution_by_version').select('*').eq('method_version',version).order('sort_order') : client.from('v_distance_range_distribution').select('*').order('sort_order'),
    catalog.versioned ? client.from('v_nearest_line_distribution_by_version').select('*').eq('method_version',version).order('line_code') : client.from('v_nearest_line_distribution').select('*').order('line_code'),
  ]);
  const error=rangeResult.error??lineResult.error;
  if(error) throw error;
  return {
    ranges:(rangeResult.data??[]) as unknown as DistanceRangeDistribution[],
    lines:(lineResult.data??[]) as unknown as NearestLineDistribution[],
  };
}

export async function loadDescriptiveStats(catalog:TrackCatalog, version:TrackMethodVersion):Promise<DescriptiveStats[]> {
  const client=requireClient();
  const request=catalog.versioned ? client.from('v_distance_descriptive_stats_by_version').select('*').eq('method_version',version) : client.from('v_distance_descriptive_stats').select('*');
  const {data,error}=await request.order('metric');if(error)throw error;
  return (data??[]) as unknown as DescriptiveStats[];
}

export async function loadHistogram(catalog:TrackCatalog, version:TrackMethodVersion, metric:'station'|'track',binWidth:number,signal?:AbortSignal):Promise<HistogramBin[]> {
  const client=requireClient();
  let request=catalog.versioned
    ? client.rpc('get_distance_histogram_by_version',{p_metric:metric,p_bin_width_m:binWidth,p_method_version:version})
    : client.rpc('get_distance_histogram',{p_metric:metric,p_bin_width_m:binWidth});
  if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;if(error)throw error;return (data??[]) as unknown as HistogramBin[];
}

export async function loadEcdf(catalog:TrackCatalog, version:TrackMethodVersion, metric:'station'|'track',step=250):Promise<EcdfPoint[]> {
  const client=requireClient();
  const {data,error}=catalog.versioned
    ? await client.rpc('get_distance_ecdf_by_version',{p_metric:metric,p_step_m:step,p_method_version:version})
    : await client.rpc('get_distance_ecdf',{p_metric:metric,p_step_m:step});
  if(error)throw error;
  return (data??[]) as unknown as EcdfPoint[];
}

export async function loadScatterAndComparisons(catalog:TrackCatalog, version:TrackMethodVersion):Promise<{scatter:ScatterPoint[];groups:GroupComparison[]}> {
  const client=requireClient();
  const [scatterResult,groupResult]=await Promise.all([
    catalog.versioned ? client.from('v_analysis_scatter_sample_by_version').select('*').eq('method_version',version).order('sample_order') : client.from('v_analysis_scatter_sample').select('*').order('sample_order'),
    catalog.versioned ? client.from('v_analysis_group_comparison_by_version').select('*').eq('method_version',version) : client.from('v_analysis_group_comparison').select('*'),
  ]);const error=scatterResult.error??groupResult.error;if(error)throw error;
  return {scatter:(scatterResult.data??[]) as unknown as ScatterPoint[],groups:(groupResult.data??[]) as unknown as GroupComparison[]};
}

/** Impacto provisional-track-v1 × shapefile-track-v1 (null se o banco ainda não tem as duas versões). */
export async function loadTrackComparison(catalog:TrackCatalog):Promise<{summary:TrackComparison;sample:TrackComparisonPoint[];transitions:TrackRangeTransition[]}|null> {
  if(!catalog.versioned||!catalog.available.includes(SHAPEFILE_TRACK)||!catalog.available.includes(PROVISIONAL_TRACK))return null;
  const client=requireClient();
  const [summaryResult,sampleResult,transitionResult]=await Promise.all([
    client.from('v_track_version_comparison').select('*').single(),
    client.from('v_track_version_comparison_sample').select('*'),
    client.from('v_track_version_range_transitions').select('*').order('provisional_sort').order('shapefile_sort'),
  ]);
  const error=summaryResult.error??sampleResult.error??transitionResult.error;if(error)throw error;
  return {
    summary:summaryResult.data as unknown as TrackComparison,
    sample:(sampleResult.data??[]) as unknown as TrackComparisonPoint[],
    transitions:(transitionResult.data??[]) as unknown as TrackRangeTransition[],
  };
}

export async function loadStationTrackQa(catalog:TrackCatalog):Promise<StationTrackQa[]> {
  if(!catalog.versioned)return [];
  const {data,error}=await requireClient().from('v_metro_track_station_qa').select('*').order('distance_m',{ascending:false});
  if(error)throw error;
  return (data??[]) as unknown as StationTrackQa[];
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
  let request = client.from('v_study_points_data').select('*', { count:'exact' }).eq('method_version',SHAPEFILE_TRACK);
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
