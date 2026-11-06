import type { Point } from 'geojson';

export type StudyPointRow = {
  id: string;
  cep: string | null;
  street: string | null;
  locality: string | null;
  source_ref: string | null;
  latitude: number;
  longitude: number;
  nearest_station_id: string | null;
  nearest_station_name: string | null;
  nearest_station_line: string | null;
  distance_station_m: number | null;
  nearest_line_id: string | null;
  nearest_line_name: string | null;
  distance_line_m: number | null;
  distance_line_range: string | null;
  source_metadata: Record<string, unknown>;
  created_at: string;
  method_version: string;
  station_distance_method: string;
  source_file: string | null;
  georeferencing_stage: string | null;
  geocoding_precision: string | null;
  quality_status: string;
};

export type StudyMapPoint = {
  id: string;
  cep: string | null;
  street: string | null;
  locality: string | null;
  geometry: Point;
  nearest_station_id: string;
  nearest_station_name: string;
  nearest_station_longitude: number;
  nearest_station_latitude: number;
  distance_station_m: number;
  nearest_line_id: string;
  nearest_line_code: string;
  nearest_line_name: string;
  distance_line_m: number;
  distance_line_range_code: string | null;
  distance_line_range: string | null;
  closest_point: Point;
  method_version: string;
};

export type StudySummary = {
  line_count: number;
  station_count: number;
  point_count: number;
  min_station_distance_m: number;
  median_station_distance_m: number;
  max_station_distance_m: number;
  min_line_distance_m: number;
  median_line_distance_m: number;
  max_line_distance_m: number;
  method_version: string;
  provisional_track: boolean;
};

export type DistanceRangeDistribution = {
  code: string;
  label: string;
  sort_order: number;
  point_count: number;
  percentage: number;
};

export type NearestLineDistribution = {
  line_id: string;
  line_code: string;
  line_name: string;
  point_count: number;
};

export type DescriptiveStats = {
  metric:'station'|'track'; n:number; mean_m:number; stddev_m:number; min_m:number;
  p10_m:number; p25_m:number; p50_m:number; p75_m:number; p90_m:number; p95_m:number; max_m:number;
  method_version:string;
};

export type HistogramBin = {metric:'station'|'track';bin_width_m:number;bin_start_m:number;bin_end_m:number;n:number;total_n:number;percentage:number};
export type EcdfPoint = {metric:'station'|'track';threshold_m:number;cumulative_n:number;total_n:number;cumulative_percentage:number};
export type ScatterPoint = {point_id:string;distance_line_m:number;distance_station_m:number;nearest_line_id:string;sample_order:number;population_n:number};
export type TrackComparison = {
  point_count:number;mean_delta_m:number;median_delta_m:number;mean_absolute_delta_m:number;median_absolute_delta_m:number;
  p90_absolute_delta_m:number;p95_absolute_delta_m:number;max_absolute_delta_m:number;min_delta_m:number;max_delta_m:number;
  closer_count:number;farther_count:number;changed_distance_range_count:number;changed_nearest_line_count:number;
  changed_within_100m_count:number;changed_within_200m_count:number;changed_within_300m_count:number;
  entered_within_100m_count:number;left_within_100m_count:number;
  previous_method_version:string;current_method_version:string;
};
export type TrackComparisonPoint = {point_id:string;provisional_distance_m:number;shapefile_distance_m:number;delta_m:number;provisional_line_code:string;shapefile_line_code:string;changed_range:boolean};
export type TrackRangeTransition = {provisional_range:string;provisional_label:string;provisional_sort:number;shapefile_range:string;shapefile_label:string;shapefile_sort:number;point_count:number};
export type TrackVersionInfo = {
  method_version:string;version_label:string;source_name:string;source_file:string|null;source_crs:string;
  validated:boolean;is_current:boolean;created_at:string;line_count:number;vertex_count:number;length_m:number;
  validation_metadata:Record<string,unknown>;line_metadata:Record<string,Record<string,unknown>|null>;
  station_qa_n:number;station_qa_mean_m:number;station_qa_median_m:number;station_qa_p90_m:number;station_qa_max_m:number;
};
export type StationTrackQa = {method_version:string;station_code:string;station_name:string;line_code:string;distance_m:number;qa_status:string};
export type GroupComparison = {dimension:'line'|'locality'|'geocoding_quality';group_value:string;n:number;mean_station_m:number;median_station_m:number;mean_line_m:number;median_line_m:number};
export type GeocodingQualitySummary = {dimension:'stage'|'result_type'|'precisao3'|'status';group_value:string;n:number};
export type QuarantinedStudyPoint = {
  cep:string|null; street:string|null; locality:string|null; latitude_original:number;
  longitude_original:number; reason:string; validation_note:string|null; quarantined_at:string;
};

export type StudyPointSort =
  | 'cep'
  | 'street'
  | 'locality'
  | 'distance_station_m'
  | 'distance_line_m'
  | 'created_at';

export type StudyPointFilters = {
  query: string;
  line: string;
  distanceRange: string;
  sort: StudyPointSort;
  ascending: boolean;
  page: number;
  pageSize: number;
};

export type ResearchMaterial = {
  id: string;
  title: string;
  description: string | null;
  material_type: string;
  storage_path: string | null;
  external_url: string | null;
  responsible: string | null;
  publication_date: string | null;
  uploader_name: string | null;
  file_size_bytes: number | null;
  trail_stage_slug: string | null;
  trail_folder_id: string | null;
  created_at: string;
};
