import { AppShell } from '@/components/app-shell';
import { OverviewPage } from '@/features/overview/overview-page';
import { redirect } from 'next/navigation';

export default async function Page({ searchParams }:{ searchParams:Promise<{secao?:string;ponto?:string}> }) {
  const params=await searchParams;
  const requested=params.secao;
  const legacy:Record<string,string>={
    mapa:'/georreferenciamento?tab=mapa',
    dados:'/georreferenciamento?tab=dados',
    analises:'/georreferenciamento?tab=analises',
    metodologia:'/georreferenciamento?tab=metodologia',
    estimacoes:'/estimacoes',
    materiais:'/materiais',
  };
  if(requested&&legacy[requested]){
    const destination=requested==='mapa'&&params.ponto?`${legacy[requested]}&ponto=${encodeURIComponent(params.ponto)}`:legacy[requested];
    redirect(destination);
  }
  return <AppShell active="visao-geral"><OverviewPage/></AppShell>;
}
