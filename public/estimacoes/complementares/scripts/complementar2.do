*===============================================================================
* SCRIPT COMPLEMENTAR: EVENT STUDIES INCONDICIONAIS (400m, 600m, 800m)
* E GRADIENTE INCONDICIONAL DE vv_medio_inscricao (EM NIVEL) E SUBAMOSTRAS
* Estimador: Callaway & Sant'Anna (2021) - csdid com method(reg) e notyet
*===============================================================================
clear all
set more off
version 17

* 1. CONFIGURACAO DO AMBIENTE E DIRETORIOS (PADRAO DOS 8.3)
sysdir set PLUS     "C:\Users\VCTORP~1\ado\plus"
sysdir set PERSONAL "C:\Users\VCTORP~1\ado\personal"

global path "C:\Users\VCTORP~1\Desktop\stata"
cd "$path"

cap log close
log using "$path\log_complemento_incondicional_400_600_800.txt", text replace

* 2. CARGA DA BASE, MERGE E FILTROS AMOSTRAIS DE PAINEL BALANCEADO
use "$path\painel_cep_ano.dta", clear
merge m:1 cep using "$path\distancias_cep_estacao_proxima.dta", keep(match) nogen

keep if flag_outlier_terreno == 0
keep if cep_balanceado == 1

egen cep_id = group(cep)

* 3. CRIACAO E AUDITORIA DAS VARIAVEIS DEPENDENTES E DE TRATAMENTO
gen razao_itiv_inscr = qtde_transacoes_itiv / qtde_inscricoes if qtde_inscricoes > 0

cap confirm variable ln_vv_medio
if _rc != 0 {
    gen ln_vv_medio = ln(vv_medio_inscricao) if vv_medio_inscricao > 0
}
else {
    replace ln_vv_medio = ln(vv_medio_inscricao) if missing(ln_vv_medio) & vv_medio_inscricao > 0
}

gen gvar_timing = ano_estacao

capture confirm numeric variable linha
if _rc == 0 {
    gen byte is_linha1 = (linha == 1)
    gen byte is_linha2 = (linha == 2)
}
else {
    gen byte is_linha1 = (strpos(lower(linha), "1") > 0)
    gen byte is_linha2 = (strpos(lower(linha), "2") > 0)
}

* Indicador Linha 2 + Ancora 2023 (permite estimar Linha 2 ate 2022 usando 2023 como not-yet-treated)
gen byte is_l2_anc23 = (is_linha2 == 1 | ano_estacao == 2023)

xtset id_painel exercicio

* Lista das 7 variaveis e codigos curtos de 3 letras (evita erro de 32 caracteres)
local lista_outcomes "qtde_inscricoes qtde_transacoes_itiv razao_itiv_inscr ln_vv_medio vv_medio_inscricao faar soma_area_construida"
local lista_codigos  "ins itv raz lvv vvn far are"

*===============================================================================
* PARTE 1: EVENT STUDIES INCONDICIONAIS PARA OS RAIOS DE 400m, 600m E 800m
*===============================================================================
display _newline(2) as result "=================================================================="
display as result "PARTE 1: EVENT STUDIES INCONDICIONAIS (400m, 600m e 800m) - REG"
display as result "=================================================================="

local n_vars : word count `lista_outcomes'

forvalues i = 1/`n_vars' {
    local y : word `i' of `lista_outcomes'
    local s : word `i' of `lista_codigos'

    estimates clear

    foreach r in 400 600 800 {

        display _newline as result ">>> [EVENT STUDY INCONDICIONAL] Variavel: `y' (`s') | Raio <= `r'm <<<"

        * Roda csdid silenciosamente e imprime apenas a tabela do estat event
        capture quietly {
            csdid `y' if distancia_metros <= `r', ///
                ivar(id_painel) time(exercicio) gvar(gvar_timing) ///
                cluster(cep_id) method(reg) notyet
        }
        if _rc == 0 {
            capture noisily estat event, estore(ev_r`r'_`s')

            capture quietly {
                coefplot ev_r`r'_`s', vertical drop(_cons Pre_avg Post_avg) legend(off) ///
                    yline(0, lpattern(dash) lcolor(black)) ///
                    xline(6.5, lpattern(dot) lcolor(cranberry)) ///
                    msymbol(circle) mcolor(navy) ciopts(lcolor(navy)) ///
                    xtitle("Anos Relativos à Inauguração (Tm = Pré | Tp = Pós)") ///
                    ytitle("Efeito Dinâmico Incondicional (ATT)") ///
                    title("Event Study (`r'm - Not Yet - REG): `y'", size(medium)) ///
                    graphregion(color(white)) bgcolor(white) name(g_`r'_`s', replace)
                graph export "$path\event_`r'm_notyet_reg_`y'.png", as(png) width(2400) replace
            }
        }
        else {
            display as error "Falha na convergencia de `y' no raio `r'm."
        }
    }
}

*===============================================================================
* PARTE 2: GRADIENTE INCONDICIONAL DE vv_medio_inscricao (EM NIVEL, 200m-2000m)
* E Event Study de 1000m de vv_medio_inscricao para comparacao com ln_vv_medio
*===============================================================================
display _newline(2) as result "=================================================================="
display as result "PARTE 2: VALOR VENAL MEDIO EM NIVEL (R$) - GRADIENTE E EVENT 1000m"
display as result "=================================================================="

estimates clear
local m_vvn_glob ""
local p_vvn_glob ""

forvalues r_m = 200(200)2000 {
    capture quietly {
        csdid vv_medio_inscricao if distancia_metros <= `r_m', ///
            ivar(id_painel) time(exercicio) gvar(gvar_timing) ///
            cluster(cep_id) method(reg) notyet agg(simple)
        estimates store vvn_g_`r_m'
        local m_vvn_glob "`m_vvn_glob' vvn_g_`r_m'"
        local p_vvn_glob "`p_vvn_glob' (vvn_g_`r_m', rename(ATT = `r_m'm))"
    }
}

display _newline as result "=== TABELA GLOBAL INCONDICIONAL (REG - NOTYET): vv_medio_inscricao (R$) ==="
if "`m_vvn_glob'" != "" {
    noisily estimates table `m_vvn_glob', b(%14.2f) se(%14.2f) p(%9.3f)
}

capture quietly {
    coefplot `p_vvn_glob', vertical drop(_cons) legend(off) ///
        yline(0, lpattern(dash) lcolor(black)) msymbol(circle) mcolor(navy) ciopts(lcolor(navy)) ///
        xtitle("Raio Máximo de Distância (Metros)") ytitle("Impacto em R$ (ATT - Not Yet)") ///
        title("Gradiente por Timing (Global - REG): vv_medio_inscricao (R$)", size(medium)) ///
        graphregion(color(white)) bgcolor(white) name(gr_vvn_glob, replace)
    graph export "$path\grad_timing_global_reg_vv_medio_inscricao.png", as(png) width(2400) replace
}

display _newline as result ">>> [EVENT STUDY 1000m INCONDICIONAL] vv_medio_inscricao (R$) <<<"
capture quietly {
    csdid vv_medio_inscricao if distancia_metros <= 1000, ///
        ivar(id_painel) time(exercicio) gvar(gvar_timing) ///
        cluster(cep_id) method(reg) notyet
}
capture noisily estat event, estore(ev_r1000_vvn)
capture quietly {
    coefplot ev_r1000_vvn, vertical drop(_cons Pre_avg Post_avg) legend(off) ///
        yline(0, lpattern(dash) lcolor(black)) xline(6.5, lpattern(dot) lcolor(cranberry)) ///
        msymbol(circle) mcolor(navy) ciopts(lcolor(navy)) ///
        xtitle("Anos Relativos à Inauguração (Tm = Pré | Tp = Pós)") ///
        ytitle("Efeito Dinâmico em R$ (ATT)") ///
        title("Event Study (1000m - Not Yet - REG): vv_medio_inscricao", size(medium)) ///
        graphregion(color(white)) bgcolor(white) name(g_1000_vvn, replace)
    graph export "$path\event_1000m_notyet_reg_vv_medio_inscricao.png", as(png) width(2400) replace
}

*===============================================================================
* PARTE 3: SUBAMOSTRAS INCONDICIONAIS FALTANTES NO LOG ANTERIOR (200m a 2000m)
* Imprime de forma enxuta as tabelas incondicionais (REG) de Pos-2014, Linha 2 e Linha 1
*===============================================================================
display _newline(2) as result "=================================================================="
display as result "PARTE 3: TABELAS DE SUBAMOSTRAS INCONDICIONAIS (REG) FALTANTES"
display as result "=================================================================="

local sub_outcomes "razao_itiv_inscr ln_vv_medio vv_medio_inscricao faar soma_area_construida"
local sub_codigos  "raz lvv vvn far are"
local n_sub : word count `sub_outcomes'

forvalues j = 1/`n_sub' {
    local y : word `j' of `sub_outcomes'
    local s : word `j' of `sub_codigos'

    estimates clear
    local m_p14 ""
    local m_l2a ""
    local m_l2p ""
    local m_l1  ""

    forvalues r_m = 200(200)2000 {

        * (i) Recorte Pos-2014 (coortes >= 2015)
        capture quietly {
            csdid `y' if distancia_metros <= `r_m' & exercicio >= 2014 & ano_estacao >= 2015, ///
                ivar(id_painel) time(exercicio) gvar(gvar_timing) cluster(cep_id) method(reg) notyet agg(simple)
            estimates store `s'_p4_`r_m'
            local m_p14 "`m_p14' `s'_p4_`r_m'"
        }

        * (ii) Linha 2 com Ancora 2023 (is_l2_anc23 == 1, painel Pos-2014)
        capture quietly {
            csdid `y' if distancia_metros <= `r_m' & exercicio >= 2014 & is_l2_anc23 == 1, ///
                ivar(id_painel) time(exercicio) gvar(gvar_timing) cluster(cep_id) method(reg) notyet agg(simple)
            estimates store `s'_2a_`r_m'
            local m_l2a "`m_l2a' `s'_2a_`r_m'"
        }

        * (iii) Linha 2 Pura (is_linha2 == 1, painel Pos-2014)
        capture quietly {
            csdid `y' if distancia_metros <= `r_m' & exercicio >= 2014 & is_linha2 == 1, ///
                ivar(id_painel) time(exercicio) gvar(gvar_timing) cluster(cep_id) method(reg) notyet agg(simple)
            estimates store `s'_2p_`r_m'
            local m_l2p "`m_l2p' `s'_2p_`r_m'"
        }

        * (iv) Exclusivamente Linha 1 (is_linha1 == 1, painel 2011-2024)
        capture quietly {
            csdid `y' if distancia_metros <= `r_m' & is_linha1 == 1, ///
                ivar(id_painel) time(exercicio) gvar(gvar_timing) cluster(cep_id) method(reg) notyet agg(simple)
            estimates store `s'_l1_`r_m'
            local m_l1 "`m_l1' `s'_l1_`r_m'"
        }
    }

    display _newline as result "******************************************************************"
    display as result ">>> SUBAMOSTRAS INCONDICIONAIS (REG): `y' <<<"
    display as result "******************************************************************"

    display _newline as text "--- [Pós-2014 Coortes >= 2015 | REG]: `y' ---"
    if "`m_p14'" != "" noisily estimates table `m_p14', b(%12.4f) se(%12.4f) p(%9.3f)

    display _newline as text "--- [Linha 2 + Âncora 2023 | REG]: `y' ---"
    if "`m_l2a'" != "" noisily estimates table `m_l2a', b(%12.4f) se(%12.4f) p(%9.3f)

    display _newline as text "--- [Linha 2 Pura | REG]: `y' ---"
    if "`m_l2p'" != "" noisily estimates table `m_l2p', b(%12.4f) se(%12.4f) p(%9.3f)

    display _newline as text "--- [Linha 1 Pura | REG]: `y' ---"
    if "`m_l1'" != ""  noisily estimates table `m_l1',  b(%12.4f) se(%12.4f) p(%9.3f)
}

log close
display _newline as result "Execucao concluida! Verifique log_complemento_incondicional_400_600_800.txt."