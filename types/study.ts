export type StudyPointRow = {
  id:string;
  cep:string | null;
  street:string | null;
  locality:string | null;
  latitude:number;
  longitude:number;
  nearest_station:string | null;
  distance_station_m:number | null;
  nearest_line:string | null;
  distance_line_m:number | null;
  distance_line_range:string | null;
  method_version:string | null;
  calculated_at:string | null;
};

export type ResearchMaterial = {
  id:string;
  title:string;
  description:string | null;
  material_type:string;
  storage_path:string | null;
  external_url:string | null;
  responsible:string | null;
  publication_date:string | null;
};
