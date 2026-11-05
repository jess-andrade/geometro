import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'data', 'estimacoes');
fs.mkdirSync(outDir, { recursive: true });

const radii = [200,400,600,800,1000,1200,1400,1600,1800,2000];
const treatedObs = [728,5474,12572,22624,34300,46102,57498,68768,81284,91210];
const treatedCeps = [52,391,898,1616,2450,3293,4107,4912,5806,6515];
const donutObs = [39480,44226,51324,61376,73052,84854,96250,107520,120036,129962];
const donutCeps = [2820,3159,3666,4384,5218,6061,6875,7680,8574,9283];

const specs = {
  faar: {
    label:'Coeficiente de aproveitamento — FAAR', unit:'índice', file:'relatório_estimação_faar.pdf', publicFile:'relatorio-estimacao-faar.pdf',
    description:'Medida relativa associada ao aproveitamento e ao estoque construído utilizada no estudo.',
    values:{
      complementar:{
        REG:[[.0197,.0155,.0117,.0061,.0022,-.0026,-.0018,-.0040,-.0054,-.0071],[.0187,.0088,.0060,.0046,.0038,.0036,.0032,.0030,.0028,.0028],[.290,.079,.053,.185,.559,.468,.580,.188,.058,.011],['','*','*','','','','','','*','**']],
        DRIPW:[[.0186,.0150,.0115,.0061,.0021,-.0026,-.0018,-.0039,-.0054,-.0070],[.0186,.0088,.0060,.0046,.0038,.0036,.0032,.0030,.0028,.0028],null,['','*','*','','','','','','*','**']],
      },
      donut:{
        REG:[[.0140,.0103,.0066,.0010,-.0026,-.0067,-.0062,-.0081,-.0092,-.0098],[.0188,.0091,.0063,.0050,.0042,.0039,.0036,.0033,.0031,.0030],[.456,.257,.296,.840,.531,.087,.084,.014,.003,.001],['','','','','','*','*','**','***','***']],
        DRIPW:[[.0131,.0099,.0063,.0008,-.0026,-.0067,-.0061,-.0081,-.0092,-.0098],[.0188,.0090,.0063,.0050,.0042,.0039,.0036,.0033,.0031,.0029],null,['','','','','','*','*','**','***','***']],
      }
    }
  },
  area_construida: {
    label:'Área construída total', unit:'m² por CEP', file:'relatório_estimação_área_construída.pdf', publicFile:'relatorio-estimacao-area-construida.pdf',
    description:'Soma bruta da área construída por CEP.',
    values:{
      complementar:{
        REG:[[-2299.31,-248.81,-313.36,-271.98,-213.89,-216.35,-157.15,-155.26,-145.16,-187.57],[1652.09,567.40,294.17,222.24,166.42,129.87,111.92,99.98,93.77,89.41],null,['','','','','','*','','','','**']],
        DRIPW:[[-2115.68,-152.05,-132.63,-138.59,-121.60,-128.25,-63.96,-55.71,-38.67,-62.68],[1375.92,546.85,282.74,213.80,164.59,131.88,115.63,107.25,102.16,102.88],[.124,.781,.639,.517,.460,.331,.580,.603,.705,.542],['','','','','','','','','','']],
      },
      donut:{
        REG:[[-2274.31,-229.57,-282.62,-243.06,-187.73,-177.85,-138.08,-132.44,-115.04,-119.30],[1654.34,570.43,298.56,227.72,172.96,136.61,118.92,106.17,97.64,91.69],null,['','','','','','','','','','']],
        DRIPW:[[-2001.65,-94.49,-19.19,-56.21,-46.19,-51.48,-6.28,-.20,12.72,-4.06],[1265.20,537.85,311.35,237.06,184.28,151.15,137.83,128.63,120.19,112.25],[.114,.861,.951,.813,.802,.733,.964,.999,.916,.971],['','','','','','','','','','']],
      }
    }
  },
  inscricoes: {
    label:'Quantidade de inscrições imobiliárias', unit:'inscrições por CEP', file:'relatório_estimação_inscrições.pdf', publicFile:'relatorio-estimacao-inscricoes.pdf',
    description:'Número total de inscrições imobiliárias ativas no cadastro de IPTU por CEP.',
    values:{
      complementar:{
        REG:[[-18.43,-4.91,-3.70,-3.86,-2.47,-2.06,-1.85,-1.88,-1.83,-1.97],[10.27,2.70,1.70,1.23,.99,.82,.73,.67,.65,.63],null,['*','*','**','***','**','**','**','***','***','***']],
        DRIPW:[[-16.12,-3.81,-2.20,-2.93,-1.16,-.85,-.69,-.67,-.60,-.58],[7.99,2.55,1.84,1.40,.98,.86,.78,.75,.73,.74],[.044,.136,.231,.037,.238,.326,.376,.377,.411,.433],['**','','','**','','','','','','']],
      },
      donut:{
        REG:[[-18.56,-5.04,-3.76,-3.85,-2.56,-2.17,-1.99,-2.00,-1.83,-1.78],[10.29,2.75,1.76,1.30,1.07,.90,.81,.75,.70,.67],null,['*','*','**','***','**','**','**','***','***','***']],
        DRIPW:[[-15.32,-3.63,-1.37,-2.17,-1.30,-1.05,-.86,-.86,-.75,-.79],[7.07,2.52,1.84,1.37,1.15,1.01,.94,.89,.84,.80],[.030,.149,.457,.114,.259,.300,.359,.337,.374,.319],['**','','','','','','','','','']],
      }
    }
  },
  transacoes_itiv: {
    label:'Transações imobiliárias — ITIV', unit:'transações por CEP/ano', file:'relatório_estimação_transação_itiv.pdf', publicFile:'relatorio-estimacao-transacao-itiv.pdf',
    description:'Número anual de transmissões formais de imóveis registradas via ITIV por CEP.',
    values:{
      complementar:{
        REG:[[-.3939,-.0236,-.0341,-.0269,-.2482,-.2465,-.2250,-.2648,-.1896,-.1484],[.6800,.3204,.1857,.1277,.1923,.1578,.1409,.1290,.1170,.1132],null,['','','','','','','','**','','']],
        DRIPW:[[.2599,.2393,.5318,.3501,-.1419,-.1487,-.1450,-.1914,-.1186,-.0618],[.8969,.3485,.3318,.2481,.1898,.1565,.1396,.1268,.1154,.1108],[.772,.492,.109,.158,.455,.342,.299,.131,.304,.577],['','','','','','','','','','']],
      },
      donut:{
        REG:[[-.5936,-.2143,-.1925,-.1652,-.3485,-.3176,-.3113,-.3251,-.2605,-.2363],[.6798,.3204,.1859,.1300,.1952,.1635,.1456,.1331,.1194,.1125],null,['','','','','*','*','**','**','**','**']],
        DRIPW:[[-.0472,-.0579,.0931,.0132,-.2406,-.2227,-.2209,-.2261,-.1654,-.1452],[.7295,.3027,.1861,.1330,.1956,.1639,.1463,.1332,.1198,.1127],[.948,.848,.617,.921,.219,.174,.131,.090,.167,.198],['','','','','','','','*','','']],
      }
    }
  },
  valor_venal: {
    label:'Valor venal médio por inscrição', unit:'R$', file:'relatório_valor_venal_médio.pdf', publicFile:'relatorio-valor-venal-medio.pdf',
    description:'soma_valor_venal_iptu / qtde_inscricoes.',
    values:{
      complementar:{
        REG:[[-424734.38,628824.26,264570.85,151530.61,100529.60,75833.58,50032.72,38632.79,27076.06,37355.73],[445554.73,438236.13,196499.46,110615.33,74656.12,56369.95,46260.91,40248.55,35659.72,33567.01],null,['','','','','','','','','','']],
        DRIPW:[[-433031.90,626356.66,263876.50,154696.94,106588.17,83515.16,57435.07,46682.49,35152.80,46890.22],[470910.82,435413.53,195412.29,109821.22,73972.13,55710.36,45575.32,39454.54,34669.25,32287.98],[.358,.150,.177,.159,.150,.134,.208,.237,.311,.146],['','','','','','','','','','']],
      },
      donut:{
        REG:[[-419233.66,610792.71,248952.90,132877.80,79649.30,53624.85,32819.47,23999.15,17511.37,22491.29],[445958.72,438717.48,197384.84,112119.30,76703.91,58864.21,48901.47,42784.07,37739.68,36031.07],null,['','','','','','','','','','']],
        DRIPW:[[-477267.59,602232.05,250244.55,142544.27,93913.61,69909.64,46987.02,38339.36,30297.33,35761.24],[487770.33,433730.93,195297.15,110121.26,74505.35,56414.89,46464.00,40227.69,35144.84,33344.77],[.328,.165,.200,.196,.207,.215,.312,.341,.389,.284],['','','','','','','','','','']],
      }
    }
  }
};

function rowsFor(key, spec) {
  const rows=[];
  for (const control of ['complementar','donut']) for (const estimator of ['REG','DRIPW']) {
    const [atts, ses, ps, stars] = spec.values[control][estimator];
    radii.forEach((radius_m,i)=>rows.push({
      outcome:key,label:spec.label,unit:spec.unit,sample:'Painel balanceado 2011–2024',radius_m,
      control_strategy:control,estimator,att:atts[i],std_error:ses[i],p_value:ps?.[i] ?? null,
      ci_low:Number((atts[i]-1.96*ses[i]).toPrecision(10)),ci_high:Number((atts[i]+1.96*ses[i]).toPrecision(10)),
      ci_note:'Derivado de ATT ± 1,96 × erro-padrão',treated_obs:treatedObs[i],treated_ceps:treatedCeps[i],
      analysis_obs:control==='complementar'?150584:donutObs[i],analysis_ceps:control==='complementar'?10756:donutCeps[i],
      significance:stars[i],source_file:spec.file,source_page:2,source_table:'Tabela 2',
      p_value_source:ps?'Tabela 1':'Não informado para este estimador no relatório'
    }));
  }
  return rows;
}

for (const [key,spec] of Object.entries(specs)) {
  fs.writeFileSync(path.join(outDir,`${key}.json`),JSON.stringify({outcome:key,label:spec.label,unit:spec.unit,description:spec.description,source_file:spec.file,public_file:`/estimacoes/relatorios/${spec.publicFile}`,results:rowsFor(key,spec)},null,2));
}

const lineLogPath=path.join(root,'public','estimacoes','complementares','logs','log_csdid_notyetlinha1elinha2.txt');
const lineText=fs.readFileSync(lineLogPath,'latin1');
const lineRows=[];
const heading=/>>> Estimando: (geral|linha1|linha2) \| Desfecho: ([a-z0-9_]+) \| Raio: <= (\d+)m <<</g;
const headings=[...lineText.matchAll(heading)];
const parsePt=(s)=>Number(s.replace(/\./g,'').replace(',','.'));
const parseStataDot=(s)=>Number(s.replace(/^(-?)\./,'$10.'));
for(let i=0;i<headings.length;i++){
  const h=headings[i], block=lineText.slice(h.index,headings[i+1]?.index ?? lineText.length);
  const row=block.match(/ATT \|\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/);
  const obs=block.match(/Number of obs\s*=\s*([\d.]+)/); const clusters=block.match(/adjusted for\s+([\d.]+) clusters/);
  if(!row) continue;
  const att=parsePt(row[1]), se=parsePt(row[2]), p=parsePt(row[4]), ciLow=parsePt(row[5]), ciHigh=parsePt(row[6]);
  lineRows.push({scope:h[1],outcome:h[2],radius_m:Number(h[3]),estimator:'REG',control_strategy:'not_yet_treated',att,std_error:se,p_value:p,ci_low:ciLow,ci_high:ciHigh,significance:p<.01?'***':p<.05?'**':p<.1?'*':'',analysis_obs:obs?Number(obs[1].replace('.','')):null,analysis_ceps:clusters?Number(clusters[1].replace('.','')):null,source_file:'log_csdid_notyetlinha1elinha2.txt'});
}
fs.writeFileSync(path.join(outDir,'resultados_linhas.json'),JSON.stringify({method:'Callaway & Sant’Anna; REG; Not Yet Treated; agg(simple)',results:lineRows},null,2));

const eventLogPath=path.join(root,'public','estimacoes','complementares','logs','log_complemento_incondicional_400_600_800.txt');
const eventText=fs.readFileSync(eventLogPath,'latin1');
const eventHeading=/>>> \[EVENT STUDY INCONDICIONAL\] Variavel: ([a-z0-9_]+) \([^)]+\) \| Raio <= (\d+)m <<</g;
const eventHeads=[...eventText.matchAll(eventHeading)];
const eventStudies=[];
for(let i=0;i<eventHeads.length;i++){
  const h=eventHeads[i], block=eventText.slice(h.index,eventHeads[i+1]?.index ?? eventText.length), points=[];
  for(const m of block.matchAll(/^\s+(Tm\d+|Tp\d+) \|\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)\s+([^\s]+)/gm)){
    const rel=m[1].startsWith('Tm')?-Number(m[1].slice(2)):Number(m[1].slice(2));
    points.push({relative_year:rel,term:m[1],att:parseStataDot(m[2]),std_error:parseStataDot(m[3]),p_value:parseStataDot(m[5]),ci_low:parseStataDot(m[6]),ci_high:parseStataDot(m[7])});
  }
  eventStudies.push({outcome:h[1],radius_m:Number(h[2]),estimator:'REG',control_strategy:'not_yet_treated',points,image:`/estimacoes/complementares/event-studies/event_${h[2]}m_notyet_reg_${h[1]}.png`,source_file:'log_complemento_incondicional_400_600_800.txt'});
}
// O relatório complementar inclui a imagem de 1000 m, mas não a tabela correspondente no log.
eventStudies.push({outcome:'vv_medio_inscricao',radius_m:1000,estimator:'REG',control_strategy:'not_yet_treated',points:[],image:'/estimacoes/complementares/event-studies/event_1000m_notyet_reg_vv_medio_inscricao.png',source_file:'event_1000m_notyet_reg_vv_medio_inscricao.png'});
fs.writeFileSync(path.join(outDir,'event_studies.json'),JSON.stringify({results:eventStudies},null,2));

const metadata={
  title:'Estimações',subtitle:'Resultados econométricos sobre os efeitos espaciais do Metrô de Salvador.',author:'Víctor Oliveira Paglerani',report_date:'15/10/2026',
  period:'2011–2024',balanced_ceps:10756,observations:150584,spatial_horizon_m:4000,radius_increment_m:200,estimator:'Callaway & Sant’Anna (2021)',
  main_outcomes:Object.keys(specs),main_estimate_count:Object.keys(specs).length*4*10,line_estimate_count:lineRows.length,event_study_count:eventStudies.length,
  notes:['Os coeficientes foram transcritos; nenhuma regressão foi reexecutada.','Os IC 95% dos relatórios principais foram derivados de ATT ± 1,96 × erro-padrão.','Valores-p ausentes permanecem nulos.'],
  value_distribution:{median:70732.31,p90:391744.50,p99:2954575,max_approx:416000000,skewness:69.08,kurtosis:7301.98}
};
fs.writeFileSync(path.join(outDir,'metadata.json'),JSON.stringify(metadata,null,2));
console.log(JSON.stringify({main:metadata.main_estimate_count,lines:lineRows.length,eventStudies:eventStudies.length,eventPoints:eventStudies.reduce((n,s)=>n+s.points.length,0)},null,2));
