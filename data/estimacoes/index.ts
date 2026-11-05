import metadata from './metadata.json';
import faar from './faar.json';
import area from './area_construida.json';
import inscricoes from './inscricoes.json';
import transacoes from './transacoes_itiv.json';
import valorVenal from './valor_venal.json';
import linhas from './resultados_linhas.json';
import eventStudies from './event_studies.json';

export type MainResult = (typeof faar.results)[number];
export type OutcomeData = Omit<typeof faar, 'results'> & { results: MainResult[] };
export type LineResult = (typeof linhas.results)[number];
export type EventStudy = (typeof eventStudies.results)[number];

export const estimationMetadata = metadata;
export const outcomeData = { faar, area_construida:area, inscricoes, transacoes_itiv:transacoes, valor_venal:valorVenal } as unknown as Record<string,OutcomeData>;
export const lineResults = linhas.results;
export const eventStudyResults = eventStudies.results;
export const outcomeOrder = ['faar','area_construida','inscricoes','transacoes_itiv','valor_venal'] as const;
export const complementaryLabels:Record<string,string>={ln_vv_medio:'Valor venal em log',razao_itiv_inscr:'Razão ITIV / inscrições',faar:'FAAR',qtde_inscricoes:'Inscrições',qtde_transacoes_itiv:'Transações ITIV',soma_area_construida:'Área construída',vv_medio_inscricao:'Valor venal médio'};
