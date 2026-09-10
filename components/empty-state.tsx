import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon:Icon, title, description, action }: { icon:LucideIcon; title:string; description:string; action?:React.ReactNode }) {
  return <div className="grid min-h-[290px] place-items-center rounded-2xl border border-dashed border-[#ced8d2] bg-[#fafcfb]"><div className="max-w-sm px-6 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f0eb] text-[#176b52]"><Icon size={22}/></span><h3 className="mt-4 text-sm font-semibold">{title}</h3><p className="mt-1.5 text-xs leading-5 text-[#74807b]">{description}</p>{action && <div className="mt-4">{action}</div>}</div></div>;
}
