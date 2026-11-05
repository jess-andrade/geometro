import { redirect } from 'next/navigation';

export default async function MapPage({searchParams}:{searchParams:Promise<{ponto?:string}>}){
  const ponto=(await searchParams).ponto;
  redirect(`/georreferenciamento?tab=mapa${ponto?`&ponto=${encodeURIComponent(ponto)}`:''}`);
}
