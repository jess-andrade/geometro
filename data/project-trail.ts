export type TrailPhase = 'georreferenciamento' | 'espacial' | 'estimacao' | 'resultados';

export type TrailMaterial = { name:string; type:string };
export type TrailStage = {
  id:string;
  number:number;
  phase:TrailPhase;
  title:string;
  summary:string;
  meta:string;
  status:'Concluída'|'Resultado disponível';
  objective:string;
  input:string;
  procedure:string[];
  tools:string[];
  outputs:string[];
  variables?:string[];
  numbers?:Array<{value:string;label:string}>;
  materials:TrailMaterial[];
  note?:string;
  visual:'table'|'flow'|'split'|'coverage'|'merge'|'metro'|'distance'|'panel'|'funnel'|'strategy'|'outcomes'|'results';
  link?:{label:string;href:string};
};

export const PROJECT_DRIVE_URL='https://drive.google.com/drive/folders/1aYh6wZ6pfUtd8ImkV8Gp5v6h39khRQC3';

export const trailStages:TrailStage[]=[
  {
    id:'base-original',number:1,phase:'georreferenciamento',title:'Base original',
    summary:'O ponto de partida: uma base anual agregada de imóveis por CEP de Salvador.',meta:'2011–2024 · Planilha',status:'Concluída',
    objective:'Organizar a base cadastral e tributária que sustenta toda a pesquisa.',
    input:'Lista com Valor Venal / CEP entre 2011 a 2024.xlsx',
    procedure:['Leitura da base anual agregada por CEP.','Preservação dos atributos cadastrais, territoriais, tributários e de transações.','Preparação da coluna CEP para formar a lista espacial de trabalho.'],
    tools:['Excel','R'],outputs:['dados_imoveis.xlsx','CEPs preparados para georreferenciamento'],
    variables:['exercício','CEP','categoria de uso','tipo de subunidade','padrão construtivo','qtde. de inscrições','valor venal IPTU','área do terreno','área construída','transações ITIV','VVA ITIV','IPTU pago','TRSD'],
    materials:[{name:'Lista com Valor Venal / CEP entre 2011 a 2024.xlsx',type:'Planilha original'},{name:'dados_imoveis.xlsx',type:'Base de trabalho'}],visual:'table'
  },
  {
    id:'organizacao-ceps',number:2,phase:'georreferenciamento',title:'Organização e padronização dos CEPs',
    summary:'Repetições foram removidas e os CEPs convertidos para uma chave consistente.',meta:'R · organização_de_dados.r',status:'Concluída',
    objective:'Criar uma lista consolidada de CEPs únicos, pronta para as buscas espaciais.',input:'Base anual de imóveis por CEP.',
    procedure:['Remoção das repetições dentro de cada ano.','Conversão do CEP para texto, retirada de hífen e preservação de zeros à esquerda.','Consolidação dos CEPs únicos globais.'],
    tools:['R'],outputs:['ceps_unicos_por_ano.xlsx','Lista consolidada para o georreferenciamento'],numbers:[{value:'≈20.739',label:'CEPs únicos globais'}],
    materials:[{name:'organização_de_dados.r',type:'Script R'},{name:'ceps_unicos_por_ano.xlsx',type:'Planilha'}],visual:'flow'
  },
  {
    id:'georreferenciamento-inicial',number:3,phase:'georreferenciamento',title:'Georreferenciamento inicial por CEP',
    summary:'Cada CEP foi consultado diretamente para recuperar endereço e coordenadas.',meta:'R + geocodebr · EPSG:4674',status:'Concluída',
    objective:'Localizar espacialmente o maior número possível de CEPs na primeira passagem.',input:'20.739 CEPs únicos.',
    procedure:['Execução da função busca_por_cep().','Busca de endereço, longitude e latitude diretamente pelo CEP.','Registro dos CEPs localizados e dos casos pendentes.'],
    tools:['R','geocodebr','SIRGAS 2000'],outputs:['15.600 CEPs localizados','5.139 CEPs enviados para enriquecimento'],
    variables:['estado','município','logradouro','localidade','longitude','latitude'],numbers:[{value:'75,22%',label:'cobertura inicial'},{value:'15.600',label:'localizados'},{value:'5.139',label:'pendentes'}],
    materials:[{name:'georreferenciamento_etapa_1.r',type:'Script R'}],visual:'split',link:{label:'Explorar georreferenciamento',href:'/georreferenciamento?tab=metodologia'}
  },
  {
    id:'enriquecimento',number:4,phase:'georreferenciamento',title:'Enriquecimento dos CEPs não localizados',
    summary:'Os casos pendentes receberam dados de endereço e passaram por uma nova busca.',meta:'R + BrasilAPI + geocodebr',status:'Concluída',
    objective:'Aumentar a cobertura usando informações complementares de logradouro e localidade.',input:'5.138 CEPs iterados após a primeira etapa.',
    procedure:['Recuperação de logradouro, bairro, localidade e UF via BrasilAPI.','Nova tentativa de georreferenciamento dos registros enriquecidos.','Junção e reprocessamento das Etapas 1 e 2.'],
    tools:['R','BrasilAPI','geocodebr'],outputs:['2.204 CEPs recuperados na Etapa 2','17.783 CEPs no consolidado 1 + 2'],
    variables:['logradouro','bairro','localidade','UF'],numbers:[{value:'4.437',label:'com logradouro recuperado'},{value:'86,4%',label:'recuperação de endereço'},{value:'85,75%',label:'cobertura acumulada'}],
    materials:[{name:'enriquecimento.r',type:'Script R'},{name:'georreferenciamento_etapa_2.r',type:'Script R'},{name:'LefJoin1e2.R',type:'Script R'},{name:'reprocessamento_do_consolidado.R',type:'Script R'},{name:'ceps_enriquecidos.xlsx',type:'Planilha'},{name:'base_georreferenciamento_2.xlsx',type:'Planilha'},{name:'consolidado_1e2_reprocessado_geocodebr.xlsx',type:'Planilha'}],visual:'flow'
  },
  {
    id:'validacao-complementar',number:5,phase:'georreferenciamento',title:'Validação dos CEPs remanescentes',
    summary:'Múltiplas fontes e validação espacial refinaram os casos ainda insuficientes.',meta:'Google · Python · ViaCEP · OSM',status:'Concluída',
    objective:'Avaliar os CEPs remanescentes e incorporar apenas localizações suficientemente precisas.',input:'2.260 CEPs com georreferenciamento insuficiente.',
    procedure:['Consulta no Google Geocoding e complemento de endereço via ViaCEP.','Busca adicional no OpenStreetMap / Nominatim.','Validação por distância Haversine e classificação de precisão.','Recorte metodológico dos registros válidos.'],
    tools:['Google Sheets','Google Maps','Python','Google Colab','ViaCEP','OpenStreetMap','Nominatim','Haversine'],outputs:['≈836/837 registros válidos incorporados','18.620 CEPs com alta precisão'],
    variables:['Exato','Aceitável','Problemático','Sem dados'],numbers:[{value:'938',label:'inicialmente exatos'},{value:'18.620',label:'alta precisão'},{value:'89,78%',label:'cobertura global'}],
    materials:[],note:'A contagem documentada varia entre 836 e 837 após o refinamento; a trilha preserva essa ressalva em vez de forçar um único valor.',visual:'coverage'
  },
  {
    id:'consolidacao',number:6,phase:'georreferenciamento',title:'Consolidação da base georreferenciada',
    summary:'As etapas espaciais foram unificadas e religadas à base anual original.',meta:'Consolidação final',status:'Concluída',
    objective:'Produzir uma base única com coordenadas, origem do georreferenciamento e precisão.',input:'Base anual original + resultados das três etapas de georreferenciamento.',
    procedure:['União das etapas de georreferenciamento.','Integração das coordenadas à base anual.','Preservação da etapa de origem, precisão e variáveis de localização.'],
    tools:['R','Excel'],outputs:['123_consolidado_bruto.xlsx','dado_imoveis_georref_bruto.xlsx','consolidado_final_unicos_bruto.xlsx'],
    materials:[{name:'123_consolidado_bruto.xlsx',type:'Planilha'},{name:'dado_imoveis_georref_bruto.xlsx',type:'Planilha'},{name:'consolidado_final_unicos_bruto.xlsx',type:'Planilha'}],
    note:'A unidade espacial disponível para análise é o CEP georreferenciado. Em razão da desidentificação da base, não há número individual dos imóveis.',visual:'merge',link:{label:'Explorar os dados',href:'/georreferenciamento?tab=dados'}
  },
  {
    id:'representacao-metro',number:7,phase:'espacial',title:'Representação espacial do metrô',
    summary:'Linhas, estações e o traçado vetorial validado formam a referência espacial.',meta:'PostGIS · shapefile-track-v1',status:'Concluída',
    objective:'Representar com precisão a infraestrutura metroviária usada nas medidas de proximidade.',input:'Shapefile do traçado e cadastro das estações das Linhas 1 e 2.',
    procedure:['Validação do CRS SIRGAS 2000 / UTM 24S (EPSG:31984).','Transformação para EPSG:4326 e incorporação no PostGIS.','Validação do traçado contra as estações.'],
    tools:['Shapefile','PostGIS','EPSG:31984','EPSG:4326'],outputs:['Linhas 1 e 2 validadas','Versão oficial shapefile-track-v1'],numbers:[{value:'2',label:'linhas'},{value:'21',label:'estações ativas'},{value:'1.696',label:'vértices validados'}],
    materials:[{name:'tracado_metro.shp',type:'Shapefile'}],note:'Uma geometria preliminar apoiou o desenvolvimento e foi substituída pelo shapefile validado, hoje a única versão apresentada na interface.',visual:'metro',link:{label:'Ver no mapa',href:'/georreferenciamento?tab=mapa'}
  },
  {
    id:'distancias',number:8,phase:'espacial',title:'Distâncias entre os CEPs e o metrô',
    summary:'Cada CEP foi relacionado à estação mais próxima e ao ponto mais próximo do traçado.',meta:'PostGIS · distâncias geodésicas',status:'Concluída',
    objective:'Criar medidas espaciais de acesso ao sistema e proximidade à infraestrutura.',input:'20.041 CEPs espaciais atuais + traçado metroviário validado.',
    procedure:['Cálculo da distância à estação mais próxima como proxy de acesso.','Cálculo da distância ao traçado como medida de proximidade à infraestrutura.','Classificação em faixas e indicadores binários.'],
    tools:['PostGIS','Geography','EPSG:31984'],outputs:['Matriz ponto–estação','Métricas CEP–traçado','Faixas de distância'],
    variables:['distance_station_m','distance_line_m','0–50 m','50–100 m','100–250 m','250–500 m','500–1.000 m','>1.000 m','within_100m','within_200m','within_300m'],numbers:[{value:'20.041',label:'CEPs espaciais'},{value:'40.082',label:'relações CEP × linha'}],
    materials:[{name:'matriz_distancias_cep...',type:'Matriz de distâncias'}],visual:'distance',link:{label:'Analisar distâncias',href:'/georreferenciamento?tab=analises'}
  },
  {
    id:'preparacao-econometrica',number:9,phase:'estimacao',title:'Preparação da base para estimação',
    summary:'Informações espaciais e cadastrais foram organizadas em um painel CEP × ano.',meta:'Transição para Stata',status:'Concluída',
    objective:'Estruturar a base analítica consumida pelos scripts econométricos.',input:'Base georreferenciada + distâncias ao metrô + dados anuais 2011–2024.',
    procedure:['Integração das variáveis espaciais e cadastrais.','Organização em painel CEP × ano.','Exportação da base preparada para o Stata.'],
    tools:['R','Stata'],outputs:['Painel CEP × ano','Arquivos .dta para estimação'],materials:[{name:'bases de estimação .dta',type:'Base Stata'}],visual:'panel'
  },
  {
    id:'amostra',number:10,phase:'estimacao',title:'Amostra econométrica',
    summary:'Regras de balanceamento, outliers e frame espacial definiram o painel principal.',meta:'Painel balanceado · até 4 km',status:'Concluída',
    objective:'Delimitar uma amostra consistente para comparação ao longo de 14 anos.',input:'Base espacial atual com 20.041 CEPs.',
    procedure:['Aplicação de cep_balanceado == 1.','Exclusão por flag_outlier_terreno == 0.','Delimitação do frame espacial de até 4 km.'],
    tools:['Stata'],outputs:['10.756 CEPs no painel principal','150.584 observações CEP × ano'],numbers:[{value:'10.756',label:'CEPs no painel'},{value:'150.584',label:'observações'},{value:'14',label:'exercícios'}],
    materials:[],note:'A base espacial e a amostra econométrica não são equivalentes: filtros analíticos reduzem o conjunto usado nas estimações.',visual:'funnel'
  },
  {
    id:'estrategia',number:11,phase:'estimacao',title:'Estratégia econométrica',
    summary:'Diferenças-em-diferenças estimam os efeitos em raios crescentes ao redor do metrô.',meta:'Stata · Callaway & Sant’Anna',status:'Concluída',
    objective:'Estimar o efeito médio do tratamento em diferentes gradientes espaciais.',input:'Painel balanceado e tratamentos acumulados por raio.',
    procedure:['Estimação do ATT com REG e DRIPW.','Controle Never Treated e erros-padrão clusterizados por CEP.','Estratégias Complementar (≤4 km) e Donut (2,5–4 km).','Covariáveis de baseline quando utilizadas: area_terreno_base e inscricoes_base.'],
    tools:['Stata','Callaway & Sant’Anna','REG','DRIPW'],outputs:['ATT','Erro-padrão','IC 95%','Resultados em 10 raios'],
    variables:['200 m','400 m','600 m','800 m','1.000 m','1.200 m','1.400 m','1.600 m','1.800 m','2.000 m'],
    materials:[{name:'scripts de estimação .do',type:'Script Stata'}],note:'A trilha apresenta resultados já documentados. Nenhuma regressão é executada nesta página.',visual:'strategy'
  },
  {
    id:'estimacoes-stata',number:12,phase:'estimacao',title:'Estimações no Stata',
    summary:'A mesma estratégia se ramifica em cinco outcomes principais.',meta:'5 outcomes · 200 estimativas publicadas',status:'Resultado disponível',
    objective:'Investigar dimensões distintas do desenvolvimento urbano e do mercado imobiliário.',input:'Painel principal, tratamentos por raio e estratégias de controle.',
    procedure:['Execução documentada para cada outcome.','Comparação entre REG e DRIPW.','Produção de relatórios, tabelas e gráficos.'],
    tools:['Stata','REG','DRIPW'],outputs:['FAAR','Área construída','Inscrições','Transações ITIV','Valor venal médio'],
    materials:[],visual:'outcomes',link:{label:'Abrir resultados',href:'/estimacoes'}
  },
  {
    id:'resultados',number:13,phase:'resultados',title:'Resultados atuais',
    summary:'Cinco conjuntos de resultados estão disponíveis para consulta detalhada.',meta:'Relatórios de 15/10/2026',status:'Resultado disponível',
    objective:'Reunir o estado atual das evidências sem comprimir conclusões distintas em uma única frase.',input:'Relatórios e resultados estruturados das estimações.',
    procedure:['Transcrição dos coeficientes publicados.','Estruturação das tabelas e visualizações na plataforma.','Disponibilização dos materiais originais para conferência.'],
    tools:['Stata','GeoMetrô'],outputs:['200 estimativas principais','90 estimativas por linha','22 estudos de evento / imagens'],numbers:[{value:'5',label:'outcomes principais'},{value:'10',label:'raios por outcome'},{value:'2',label:'estimadores'}],
    materials:[],note:'Os coeficientes foram transcritos dos relatórios existentes; nenhuma regressão foi reexecutada.',visual:'results',link:{label:'Abrir em Estimações',href:'/estimacoes'}
  }
];
