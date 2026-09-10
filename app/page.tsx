import { AppShell, type Section } from '@/components/app-shell';
import { OverviewPage } from '@/features/overview/overview-page';
import { MapWorkspace } from '@/features/map/map-workspace';
import { AnalysisPage } from '@/features/analysis/analysis-page';
import { DataPage } from '@/features/data/data-page';
import { MaterialsPage } from '@/features/materials/materials-page';
import { MethodologyPage } from '@/features/methodology/methodology-page';
import type { ComponentType } from 'react';

const pages = {
  'visao-geral': OverviewPage,
  mapa: MapWorkspace,
  analises: AnalysisPage,
  dados: DataPage,
  materiais: MaterialsPage,
  metodologia: MethodologyPage,
} satisfies Record<Section, ComponentType>;

export default async function Page({ searchParams }:{ searchParams:Promise<{secao?:string}> }) {
  const requested=(await searchParams).secao;
  const active:Section=requested && requested in pages ? requested as Section : 'visao-geral';
  const Content=pages[active];
  return <AppShell active={active}><Content/></AppShell>;
}
