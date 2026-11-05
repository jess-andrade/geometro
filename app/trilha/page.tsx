import { AppShell } from '@/components/app-shell';
import { ProjectTrailPage } from '@/features/project-trail/project-trail-page';

export default function Page(){
  return <AppShell active="trilha"><ProjectTrailPage/></AppShell>;
}
