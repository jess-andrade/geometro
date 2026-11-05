import { AppShell } from '@/components/app-shell';
import { GeoreferencingPage, type GeoreferencingTab } from '@/features/georeferencing/georeferencing-page';

export default async function Page({searchParams}:{searchParams:Promise<{tab?:string}>}){
  const requested=(await searchParams).tab;
  const tab:GeoreferencingTab=requested==='dados'||requested==='analises'||requested==='metodologia'?requested:'mapa';
  return <AppShell active="georreferenciamento"><GeoreferencingPage activeTab={tab}/></AppShell>;
}
