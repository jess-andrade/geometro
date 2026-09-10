import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow:string; title:string; description:string; actions?:ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#77827e]"><span className="h-px w-5 bg-[#9aa59f]"/>{eyebrow}</div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-[30px]">{title}</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6d7874]">{description}</p></div>{actions}</div>;
}
