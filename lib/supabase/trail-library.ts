import { getSupabaseClient } from './client';
import type { TrailSectionSlug } from '@/data/project-trail';
import type { ResearchMaterial } from '@/types/study';

export type TrailFolder = {
  id:string;
  stage_slug:TrailSectionSlug;
  parent_id:string|null;
  name:string;
  created_at:string;
};

export type TrailLibraryData = {
  available:boolean;
  folders:TrailFolder[];
  materials:ResearchMaterial[];
};

const materialColumns='id,title,description,material_type,storage_path,external_url,responsible,publication_date,uploader_name,file_size_bytes,trail_stage_slug,trail_folder_id,created_at';

export async function loadTrailLibrary(stage:TrailSectionSlug):Promise<TrailLibraryData>{
  const client=getSupabaseClient();
  if(!client)return {available:false,folders:[],materials:[]};
  const [folderResult,materialResult]=await Promise.all([
    client.from('project_trail_folders').select('id,stage_slug,parent_id,name,created_at').eq('stage_slug',stage).order('name'),
    client.from('research_materials').select(materialColumns).eq('trail_stage_slug',stage).order('created_at',{ascending:false}),
  ]);
  const error=folderResult.error??materialResult.error;
  if(error){
    if(['PGRST204','PGRST205','42P01','42703'].includes(error.code??''))return {available:false,folders:[],materials:[]};
    throw error;
  }
  return {
    available:true,
    folders:(folderResult.data??[]) as unknown as TrailFolder[],
    materials:(materialResult.data??[]) as unknown as ResearchMaterial[],
  };
}

export async function createTrailFolder(stage:TrailSectionSlug,parentId:string|null,name:string):Promise<TrailFolder>{
  const client=getSupabaseClient();
  if(!client)throw new Error('A conexão pública do Supabase não está configurada.');
  const normalized=name.trim();
  if(!normalized||normalized.length>120)throw new Error('Informe um nome de pasta com até 120 caracteres.');
  const {data,error}=await client.from('project_trail_folders').insert({stage_slug:stage,parent_id:parentId,name:normalized}).select('id,stage_slug,parent_id,name,created_at').single();
  if(error){
    if(error.code==='23505')throw new Error('Já existe uma pasta com esse nome neste local.');
    throw new Error(`Não foi possível criar a pasta: ${error.message}`);
  }
  return data as unknown as TrailFolder;
}

export async function updateTrailMaterial(material:ResearchMaterial,changes:{title?:string;trail_folder_id?:string|null;trail_stage_slug?:TrailSectionSlug|null}):Promise<ResearchMaterial>{
  const client=getSupabaseClient();
  if(!client)throw new Error('A conexão pública do Supabase não está configurada.');
  const {data,error}=await client.from('research_materials').update(changes).eq('id',material.id)
    .select(materialColumns).single();
  if(error)throw new Error(`Não foi possível atualizar o material: ${error.message}`);
  return data as ResearchMaterial;
}
