'use client';

import { ArrowLeft, ChevronRight, ExternalLink, File, Folder, FolderOpen, FolderPlus, Link2, LoaderCircle, MoreHorizontal, Plus, Upload, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { TrailSectionSlug } from '@/data/project-trail';
import { deleteResearchMaterial, MAX_MATERIAL_SIZE, researchMaterialUrl, submitResearchMaterial } from '@/lib/supabase/materials';
import { createTrailFolder, loadTrailLibrary, updateTrailMaterial, type TrailFolder } from '@/lib/supabase/trail-library';
import type { ResearchMaterial } from '@/types/study';

type AddMode='choose'|'file'|'url'|'folder';
type MaterialAction={kind:'rename'|'move'|'unlink'|'delete';material:ResearchMaterial}|null;

export function StageLibrary({stage,color,title}:{stage:TrailSectionSlug;color:string;title:string}){
  const [available,setAvailable]=useState(true);
  const [loading,setLoading]=useState(true);
  const [folders,setFolders]=useState<TrailFolder[]>([]);
  const [materials,setMaterials]=useState<ResearchMaterial[]>([]);
  const [folderId,setFolderId]=useState<string|null>(null);
  const [addMode,setAddMode]=useState<AddMode|null>(null);
  const [action,setAction]=useState<MaterialAction>(null);
  const [message,setMessage]=useState<string|null>(null);

  useEffect(()=>{
    let active=true;
    loadTrailLibrary(stage).then((data)=>{if(active){setAvailable(data.available);setFolders(data.folders);setMaterials(data.materials);}})
      .catch((error)=>{console.error('Falha ao carregar biblioteca da trilha.',error);if(active)setMessage('Não foi possível carregar esta pasta agora.');})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[stage]);

  const currentFolders=folders.filter((item)=>item.parent_id===folderId);
  const currentMaterials=materials.filter((item)=>item.trail_folder_id===folderId);
  const currentFolder=folders.find((item)=>item.id===folderId)??null;
  const breadcrumbs=useMemo(()=>{
    const path:TrailFolder[]=[];let cursor=currentFolder;
    while(cursor){path.unshift(cursor);cursor=folders.find((item)=>item.id===cursor?.parent_id)??null;}
    return path;
  },[currentFolder,folders]);

  const updateLocal=(updated:ResearchMaterial)=>setMaterials((items)=>items.map((item)=>item.id===updated.id?updated:item));
  const runAction=async(changes:{title?:string;trail_folder_id?:string|null;trail_stage_slug?:TrailSectionSlug|null})=>{
    if(!action)return;
    const updated=await updateTrailMaterial(action.material,changes);
    if(updated.trail_stage_slug===stage)updateLocal(updated);
    else setMaterials((items)=>items.filter((item)=>item.id!==updated.id));
    setAction(null);
  };
  const deleteMaterial=async()=>{
    if(!action)return;
    await deleteResearchMaterial(action.material);
    setMaterials((items)=>items.filter((item)=>item.id!==action.material.id));
    setAction(null);
  };

  return <section className="mt-5 rounded-[20px] border bg-[#fbfcfb]" style={{borderColor:`${color}40`}} aria-label={`Pasta da etapa ${title}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e7e3] px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl" style={{backgroundColor:`${color}14`,color}}><FolderOpen size={19}/></span><div><h3 className="text-[10px] font-bold uppercase tracking-[.12em] text-[#5f6d67]">Pasta da etapa</h3><p className="mt-1 text-[11px] text-[#81908a]">{materials.length} {materials.length===1?'material':'materiais'}{folders.length>0?` · ${folders.length} ${folders.length===1?'pasta':'pastas'}`:''}</p></div></div>
      <button type="button" onClick={()=>setAddMode('choose')} disabled={!available||loading} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50" style={{backgroundColor:color}}><Plus size={15}/>Adicionar material</button>
    </div>
    <div className="min-h-36 p-4 sm:p-5">
      {breadcrumbs.length>0&&<nav className="mb-4 flex items-center gap-1 overflow-x-auto text-[11px]" aria-label="Caminho da pasta"><button onClick={()=>setFolderId(null)} className="shrink-0 font-semibold" style={{color}}>{title}</button>{breadcrumbs.map((folder)=><span key={folder.id} className="contents"><ChevronRight size={12} className="shrink-0 text-[#a0aaa5]"/><button onClick={()=>setFolderId(folder.id)} className="max-w-44 shrink-0 truncate font-medium text-[#5c6963]">{folder.name}</button></span>)}</nav>}
      {folderId&&<button onClick={()=>setFolderId(currentFolder?.parent_id??null)} className="mb-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#6b7872]"><ArrowLeft size={13}/>Voltar</button>}
      {loading?<p className="flex items-center gap-2 text-xs text-[#87938d]"><LoaderCircle size={15} className="animate-spin"/>Carregando materiais…</p>:!available?<p className="text-xs text-[#7d8984]">A biblioteca da etapa aguarda a atualização do banco.</p>:(currentFolders.length||currentMaterials.length)?<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {currentFolders.map((folder)=><button key={folder.id} onClick={()=>setFolderId(folder.id)} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e0e6e2] bg-white p-4 text-left hover:shadow-sm"><Folder size={19} style={{color}}/><span className="truncate text-xs font-semibold">{folder.name}</span><ChevronRight size={13} className="ml-auto shrink-0 text-[#9aa49f]"/></button>)}
        {currentMaterials.map((material)=><MaterialCard key={material.id} material={material} color={color} onAction={(kind)=>setAction({kind,material})}/>)}
      </div>:<div className="grid min-h-32 place-items-center text-center"><div><FolderOpen size={22} className="mx-auto text-[#9aaba2]"/><p className="mt-2 text-xs font-medium text-[#64716b]">Ainda não há materiais nesta etapa.</p></div></div>}
      {message&&<p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{message}</p>}
    </div>
    {addMode&&<AddDialog mode={addMode} stage={stage} folderId={folderId} color={color} onMode={setAddMode} onClose={()=>setAddMode(null)} onCreated={(material)=>{setMaterials((items)=>[material,...items]);setAddMode(null);}} onFolder={async(name)=>{const folder=await createTrailFolder(stage,folderId,name);setFolders((items)=>[...items,folder]);setAddMode(null);}}/>}
    {action&&<ActionDialog action={action} folders={folders} color={color} onClose={()=>setAction(null)} onUpdate={runAction} onDelete={deleteMaterial}/>}
  </section>;
}

function MaterialCard({material,color,onAction}:{material:ResearchMaterial;color:string;onAction:(kind:NonNullable<MaterialAction>['kind'])=>void}){
  const [menu,setMenu]=useState(false);
  return <article className="relative rounded-2xl border border-[#e0e6e2] bg-white p-4"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{backgroundColor:`${color}13`,color}}>{material.external_url?<Link2 size={17}/>:<File size={17}/>}</span><div className="min-w-0 flex-1"><h4 className="break-words text-xs font-semibold">{material.title}</h4><p className="mt-1 text-[10px] text-[#89948f]">{friendlyType(material.material_type)}</p></div><button type="button" onClick={()=>setMenu((value)=>!value)} aria-label={`Ações de ${material.title}`} aria-expanded={menu} className="rounded-lg p-1.5 text-[#7d8984] hover:bg-[#f0f3f1]"><MoreHorizontal size={17}/></button></div>
    {menu&&<div className="absolute right-3 top-12 z-10 min-w-40 rounded-xl border border-[#dce4df] bg-white p-1 shadow-lg">{researchMaterialUrl(material)&&<a href={researchMaterialUrl(material)!} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] text-[#53615c] hover:bg-[#f3f6f4]">Abrir <ExternalLink size={12}/></a>}{([['rename','Renomear'],['move','Mover para pasta'],['unlink','Remover desta etapa'],['delete','Excluir']] as const).map(([kind,label])=><button key={kind} type="button" onClick={()=>{setMenu(false);onAction(kind);}} className={`block w-full rounded-lg px-2.5 py-2 text-left text-[11px] hover:bg-[#f3f6f4] ${kind==='delete'?'text-red-700':'text-[#53615c]'}`}>{label}</button>)}</div>}
  </article>;
}

function AddDialog({mode,stage,folderId,color,onMode,onClose,onCreated,onFolder}:{mode:AddMode;stage:TrailSectionSlug;folderId:string|null;color:string;onMode:(mode:AddMode)=>void;onClose:()=>void;onCreated:(material:ResearchMaterial)=>void;onFolder:(name:string)=>Promise<void>}){
  const [title,setTitle]=useState('');const [description,setDescription]=useState('');const [materialType,setMaterialType]=useState('document');const [file,setFile]=useState<File|null>(null);const [url,setUrl]=useState('');const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
  const submit=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError(null);try{if(mode==='folder'){await onFolder(title.trim());return;}const material=await submitResearchMaterial({title,description,materialType,publicationDate:'',uploaderName:'',uploaderEmail:'',file:mode==='file'?file:null,externalUrl:mode==='url'?url:'',trailStageSlug:stage,trailFolderId:folderId});onCreated(material);}catch(next){setError(next instanceof Error?next.message:'Não foi possível salvar.');setSaving(false);}};
  return <Modal title="Adicionar material" onClose={onClose}>{mode==='choose'?<div className="grid gap-2"><Choice icon={<Upload size={17}/>} label="Enviar arquivo" onClick={()=>onMode('file')}/><Choice icon={<Link2 size={17}/>} label="Adicionar link" onClick={()=>onMode('url')}/><Choice icon={<FolderPlus size={17}/>} label="Criar pasta" onClick={()=>onMode('folder')}/></div>:<form className="space-y-4" onSubmit={submit}><p className="text-xs font-semibold" style={{color}}>{mode==='file'?'Enviar arquivo':mode==='url'?'Adicionar link':'Criar pasta'}</p><Field label={mode==='folder'?'Nome da pasta *':'Título *'}><input required maxLength={mode==='folder'?120:200} value={title} onChange={(event)=>setTitle(event.target.value)} className="trail-field"/></Field>{mode!=='folder'&&<Field label="Descrição"><textarea rows={3} maxLength={4000} value={description} onChange={(event)=>setDescription(event.target.value)} className="trail-field min-h-24 py-3"/></Field>}{mode==='file'&&<><Field label="Tipo"><select value={materialType} onChange={(event)=>setMaterialType(event.target.value)} className="trail-field"><option value="document">Documento</option><option value="pdf">PDF</option><option value="spreadsheet">Planilha</option><option value="csv">CSV</option><option value="presentation">Apresentação</option><option value="image">Imagem</option><option value="zip">ZIP</option><option value="other">Outro</option></select></Field><Field label="Arquivo *"><input required type="file" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif,.zip,.txt,.rtf,.odt,.ods,.odp" onChange={(event)=>setFile(event.target.files?.[0]??null)} className="block w-full text-xs"/><small className="text-[10px] font-normal text-[#89938f]">Limite de {MAX_MATERIAL_SIZE/1024/1024} MB.</small></Field></>}{mode==='url'&&<Field label="URL *"><input required type="url" value={url} onChange={(event)=>setUrl(event.target.value)} className="trail-field" placeholder="https://…"/></Field>}{error&&<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={()=>onMode('choose')} className="rounded-xl px-3 py-2 text-xs text-[#64716b]">Voltar</button><button disabled={saving} className="rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{backgroundColor:color}}>{saving?'Salvando…':'Salvar'}</button></div></form>}</Modal>;
}

function ActionDialog({action,folders,color,onClose,onUpdate,onDelete}:{action:NonNullable<MaterialAction>;folders:TrailFolder[];color:string;onClose:()=>void;onUpdate:(changes:{title?:string;trail_folder_id?:string|null;trail_stage_slug?:TrailSectionSlug|null})=>Promise<void>;onDelete:()=>Promise<void>}){
  const [title,setTitle]=useState(action.material.title);const [destination,setDestination]=useState(action.material.trail_folder_id??'');const [saving,setSaving]=useState(false);const [error,setError]=useState<string|null>(null);
  const paths=folders.map((folder)=>{const names=[folder.name];let parent=folders.find((item)=>item.id===folder.parent_id);while(parent){names.unshift(parent.name);parent=folders.find((item)=>item.id===parent?.parent_id);}return {id:folder.id,label:names.join(' / ')};});
  const perform=async(event:FormEvent)=>{event.preventDefault();setSaving(true);setError(null);try{if(action.kind==='rename'){const normalized=title.trim();if(!normalized||normalized.length>200)throw new Error('Informe um título com até 200 caracteres.');await onUpdate({title:normalized});}else if(action.kind==='move')await onUpdate({trail_folder_id:destination||null});else if(action.kind==='unlink')await onUpdate({trail_stage_slug:null,trail_folder_id:null});else await onDelete();}catch(next){setError(next instanceof Error?next.message:'Não foi possível concluir a ação.');setSaving(false);}};
  const labels={rename:'Renomear material',move:'Mover para pasta',unlink:'Remover desta etapa',delete:'Excluir material'};
  return <Modal title={labels[action.kind]} onClose={onClose}><form onSubmit={perform} className="space-y-4">{action.kind==='rename'&&<Field label="Título"><input required maxLength={200} value={title} onChange={(event)=>setTitle(event.target.value)} className="trail-field"/></Field>}{action.kind==='move'&&<Field label="Destino"><select value={destination} onChange={(event)=>setDestination(event.target.value)} className="trail-field"><option value="">Raiz da etapa</option>{paths.map((folder)=><option key={folder.id} value={folder.id}>{folder.label}</option>)}</select></Field>}{action.kind==='unlink'&&<p className="text-xs leading-5 text-[#64716b]">“{action.material.title}” sairá desta etapa e continuará na biblioteca geral Materiais.</p>}{action.kind==='delete'&&<p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800">“{action.material.title}” será excluído da biblioteca geral e, se houver, do Storage. Esta ação não pode ser desfeita.</p>}{error&&<p role="alert" className="text-xs text-red-700">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-xs text-[#64716b]">Cancelar</button><button disabled={saving} className="rounded-xl px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" style={{backgroundColor:action.kind==='delete'?'#b91c1c':color}}>{saving?'Salvando…':action.kind==='delete'?'Excluir definitivamente':'Confirmar'}</button></div></form></Modal>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#14201c]/45 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[22px] bg-white p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between"><h3 className="text-base font-semibold">{title}</h3><button onClick={onClose} className="rounded-lg p-2 text-[#74807b] hover:bg-[#edf1ee]" aria-label="Fechar"><X size={16}/></button></div>{children}<style>{`.trail-field{width:100%;border:1px solid #dce4df;border-radius:.75rem;background:#fafbfa;padding:0 .75rem;height:2.65rem;font-size:.75rem;outline:none}.trail-field:focus{border-color:#789f90;box-shadow:0 0 0 3px #e8f1ec}`}</style></div></div>}
function Field({label,children}:{label:string;children:ReactNode}){return <label className="block text-[11px] font-semibold text-[#596661]"><span className="mb-1.5 block">{label}</span>{children}</label>}
function Choice({icon,label,onClick}:{icon:ReactNode;label:string;onClick:()=>void}){return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 rounded-xl border border-[#dce4df] p-3 text-left text-xs font-semibold text-[#53615c] hover:bg-[#f5f8f6]">{icon}{label}<ChevronRight size={14} className="ml-auto"/></button>}
function friendlyType(type:string){return type==='spreadsheet'?'Planilha':type==='presentation'?'Apresentação':type==='document'?'Documento':type==='link'?'Link':type.toUpperCase();}
