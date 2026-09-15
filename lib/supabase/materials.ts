import { getSupabaseClient } from './client';
import type { ResearchMaterial } from '@/types/study';

export const RESEARCH_MATERIALS_BUCKET='research-materials';
export const MAX_MATERIAL_SIZE=25*1024*1024;

const contentTypes:Record<string,string>={
  pdf:'application/pdf',csv:'text/csv',txt:'text/plain',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',ppt:'application/vnd.ms-powerpoint',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',gif:'image/gif',zip:'application/zip',rtf:'application/rtf',
  odt:'application/vnd.oasis.opendocument.text',ods:'application/vnd.oasis.opendocument.spreadsheet',odp:'application/vnd.oasis.opendocument.presentation',
};

export type MaterialSubmission={
  title:string;description:string;materialType:string;publicationDate:string;uploaderName:string;uploaderEmail:string;
  file:File|null;externalUrl:string;honeypot?:string;
};

export async function submitResearchMaterial(input:MaterialSubmission):Promise<ResearchMaterial>{
  const client=getSupabaseClient();if(!client)throw new Error('A conexão pública do Supabase não está configurada.');
  const title=input.title.trim();const description=input.description.trim();const uploaderName=input.uploaderName.trim();const uploaderEmail=input.uploaderEmail.trim().toLowerCase();
  if(input.honeypot)throw new Error('Envio recusado.');
  if(!title||title.length>200)throw new Error('Informe um título com até 200 caracteres.');
  if(description.length>4000)throw new Error('A descrição deve ter até 4.000 caracteres.');
  if(uploaderName.length>120)throw new Error('O nome deve ter até 120 caracteres.');
  if(uploaderEmail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uploaderEmail))throw new Error('Informe um e-mail válido ou deixe o campo vazio.');
  if(Boolean(input.file)===Boolean(input.externalUrl.trim()))throw new Error('Anexe um arquivo ou informe uma URL, mas não os dois.');

  let storagePath:string|null=null;let externalUrl:string|null=null;let materialType=input.materialType;
  if(input.file){
    if(input.file.size>MAX_MATERIAL_SIZE)throw new Error('O arquivo deve ter no máximo 25 MB.');
    const extension=input.file.name.split('.').pop()?.toLowerCase()??'';const fallbackType=contentTypes[extension];
    if(!fallbackType)throw new Error('Este formato de arquivo não é permitido.');
    if(input.file.type&&input.file.type!=='application/octet-stream'&&input.file.type!==fallbackType&&!(extension==='zip'&&input.file.type==='application/x-zip-compressed'))throw new Error('O tipo do arquivo não corresponde à extensão.');
    storagePath=`public/${crypto.randomUUID()}.${extension}`;
    const {error:uploadError}=await client.storage.from(RESEARCH_MATERIALS_BUCKET).upload(storagePath,input.file,{cacheControl:'3600',contentType:fallbackType,upsert:false});
    if(uploadError)throw new Error(`Não foi possível enviar o arquivo: ${uploadError.message}`);
  }else{
    const parsed=new URL(input.externalUrl.trim());if(!['http:','https:'].includes(parsed.protocol))throw new Error('A URL deve começar com http:// ou https://.');
    externalUrl=parsed.toString();materialType='link';
  }

  const {data,error}=await client.from('research_materials').insert({
    title,description:description||null,material_type:materialType,storage_path:storagePath,external_url:externalUrl,
    publication_date:input.publicationDate||null,uploader_name:uploaderName||null,uploader_email:uploaderEmail||null,
    file_size_bytes:input.file?.size??null,
  }).select('id,title,description,material_type,storage_path,external_url,responsible,publication_date,uploader_name,file_size_bytes,created_at').single();
  if(error){if(storagePath)await client.storage.from(RESEARCH_MATERIALS_BUCKET).remove([storagePath]);throw new Error(`O arquivo foi recebido, mas os metadados não puderam ser registrados: ${error.message}`);}
  return data as ResearchMaterial;
}

export async function deleteResearchMaterial(material:ResearchMaterial){
  const client=getSupabaseClient();if(!client)throw new Error('A conexão pública do Supabase não está configurada.');
  if(material.storage_path){
    const {data,error}=await client.storage.from(RESEARCH_MATERIALS_BUCKET).remove([material.storage_path]);
    if(error)throw new Error(`Não foi possível excluir o arquivo: ${error.message}`);
    if(!data?.some((object)=>object.name===material.storage_path))throw new Error('O Storage não confirmou a exclusão do arquivo.');
  }
  const {error}=await client.from('research_materials').delete().eq('id',material.id);
  if(error)throw new Error(`O arquivo foi excluído, mas o registro não pôde ser removido: ${error.message}`);
}

export function researchMaterialUrl(material:ResearchMaterial){
  if(material.external_url)return material.external_url;
  const client=getSupabaseClient();if(!client||!material.storage_path)return null;
  return client.storage.from(RESEARCH_MATERIALS_BUCKET).getPublicUrl(material.storage_path).data.publicUrl;
}
