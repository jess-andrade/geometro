*===============================================================================
* ESTIMACAO: GRADIENTE ESPACIAL DA AREA CONSTRUIDA (200m a 2000m)
*===============================================================================
clear all
set more off
version 17

* 1. DIRETORIO E AMBIENTE
sysdir set PLUS     "C:\Users\VCTORP~1\ado\plus"
sysdir set PERSONAL "C:\Users\VCTORP~1\ado\personal"

global path "C:\Users\VCTORP~1\Desktop\stata"
cd "$path"

cap log close
log using "$path\log_gradiente_area_construida.txt", text replace

* 2. CARGA E PREPARACAO DA BASE
use "$path\painel_cep_ano.dta", clear
merge m:1 cep using "$path\distancias_cep_estacao_proxima.dta", keep(match) nogen

egen cep_id = group(cep)

preserve
    keep if exercicio == 2011
    keep id_painel soma_area_terreno qtde_inscricoes
    gen area_media_terr_base = soma_area_terreno / qtde_inscricoes if qtde_inscricoes > 0
    rename soma_area_terreno area_terreno_base
    rename qtde_inscricoes   inscricoes_base
    keep id_painel area_terreno_base inscricoes_base area_media_terr_base
    tempfile base_2011_cep
    save `base_2011_cep'
restore

merge m:1 id_painel using `base_2011_cep', nogen
replace area_terreno_base    = 0 if missing(area_terreno_base)
replace inscricoes_base      = 0 if missing(inscricoes_base)
replace area_media_terr_base = 0 if missing(area_media_terr_base)

keep if flag_outlier_terreno == 0
keep if cep_balanceado == 1

xtset id_painel exercicio

local mod_comp4_reg   ""
local mod_comp4_dripw ""
local mod_donut_reg   ""
local mod_donut_dripw ""

local plot_comp4_reg   ""
local plot_comp4_dripw ""
local plot_donut_reg   ""
local plot_donut_dripw ""

* 3. LOOP DE ESTIMACAO (200m a 2000m)
forvalues r_m = 200(200)2000 {

    display _newline as text "=================================================="
    display as result "Estimando Area Construida para o Raio: `r_m' metros"
    display as text "=================================================="

    * Definicao das variaveis de tratamento e controle
    capture drop gvar_comp4 gvar_donut
    gen gvar_comp4 = .
    replace gvar_comp4 = ano_estacao if distancia_metros <= `r_m'
    replace gvar_comp4 = 0           if distancia_metros > `r_m' & distancia_metros <= 4000

    gen gvar_donut = .
    replace gvar_donut = ano_estacao if distancia_metros <= `r_m'
    replace gvar_donut = 0           if inrange(distancia_metros, 2500, 4000)

    * 3.1 Controle Complementar (<= 4km) - OLS sem cov
    capture noisily {
        csdid soma_area_construida if !missing(gvar_comp4), ivar(id_painel) time(exercicio) gvar(gvar_comp4) cluster(cep_id) method(reg) agg(simple)
        estimates store c4_reg_`r_m'
        local mod_comp4_reg "`mod_comp4_reg' c4_reg_`r_m'"
        local plot_comp4_reg "`plot_comp4_reg' (c4_reg_`r_m', rename(ATT = `r_m'm))"
    }

    * 3.2 Controle Complementar (<= 4km) - DRIPW com cov
    capture noisily {
        csdid soma_area_construida area_terreno_base inscricoes_base if !missing(gvar_comp4), ivar(id_painel) time(exercicio) gvar(gvar_comp4) cluster(cep_id) method(dripw) agg(simple)
        estimates store c4_dr_`r_m'
        local mod_comp4_dripw "`mod_comp4_dripw' c4_dr_`r_m'"
        local plot_comp4_dripw "`plot_comp4_dripw' (c4_dr_`r_m', rename(ATT = `r_m'm))"
    }

    * 3.3 Controle Donut (2.5 a 4.0km) - OLS sem cov
    capture noisily {
        csdid soma_area_construida if !missing(gvar_donut), ivar(id_painel) time(exercicio) gvar(gvar_donut) cluster(cep_id) method(reg) agg(simple)
        estimates store dn_reg_`r_m'
        local mod_donut_reg "`mod_donut_reg' dn_reg_`r_m'"
        local plot_donut_reg "`plot_donut_reg' (dn_reg_`r_m', rename(ATT = `r_m'm))"
    }

    * 3.4 Controle Donut (2.5 a 4.0km) - DRIPW com cov
    capture noisily {
        csdid soma_area_construida area_terreno_base inscricoes_base if !missing(gvar_donut), ivar(id_painel) time(exercicio) gvar(gvar_donut) cluster(cep_id) method(dripw) agg(simple)
        estimates store dn_dr_`r_m'
        local mod_donut_dripw "`mod_donut_dripw' dn_dr_`r_m'"
        local plot_donut_dripw "`plot_donut_dripw' (dn_dr_`r_m', rename(ATT = `r_m'm))"
    }
}

* 4. EXIBICAO DAS TABELAS CONSOLIDADAS
display _newline(2) as result "=== MODELO 1: AREA CONSTRUIDA | COMPLEMENTAR (<= 4KM) - REG SEM CONTROLES ==="
estimates table `mod_comp4_reg', b(%12.2f) se(%12.2f) p(%9.3f) stats(N)

display _newline(2) as result "=== MODELO 2: AREA CONSTRUIDA | COMPLEMENTAR (<= 4KM) - DRIPW COM CONTROLES ==="
estimates table `mod_comp4_dripw', b(%12.2f) se(%12.2f) p(%9.3f) stats(N)

display _newline(2) as result "=== MODELO 3: AREA CONSTRUIDA | DONUT (2.5-4KM) - REG SEM CONTROLES ==="
estimates table `mod_donut_reg', b(%12.2f) se(%12.2f) p(%9.3f) stats(N)

display _newline(2) as result "=== MODELO 4: AREA CONSTRUIDA | DONUT (2.5-4KM) - DRIPW COM CONTROLES ==="
estimates table `mod_donut_dripw', b(%12.2f) se(%12.2f) p(%9.3f) stats(N)

* 5. EXPORTACAO DOS GRAFICOS
coefplot `plot_comp4_reg', vertical drop(_cons) legend(off) ///
    yline(0, lpattern(dash) lcolor(black)) msymbol(circle) mcolor(navy) ciopts(lcolor(navy)) ///
    xtitle("Raio de Tratamento (Metros)") ytitle("Impacto na Área Construída - m² (ATT)") ///
    title("Gradiente da Área Construída: Controle Complementar (<= 4km)", size(medium)) ///
    graphregion(color(white)) bgcolor(white) name(graf_area_comp4_reg, replace)
graph export "$path\gradiente_area_comp4_reg.png", as(png) width(2400) replace

coefplot `plot_comp4_dripw', vertical drop(_cons) legend(off) ///
    yline(0, lpattern(dash) lcolor(black)) msymbol(circle) mcolor(navy) ciopts(lcolor(navy)) ///
    xtitle("Raio de Tratamento (Metros)") ytitle("Impacto na Área Construída - m² (ATT)") ///
    title("Gradiente da Área Construída: Controle Complementar (DRIPW)", size(medium)) ///
    graphregion(color(white)) bgcolor(white) name(graf_area_comp4_dr, replace)
graph export "$path\gradiente_area_comp4_dripw.png", as(png) width(2400) replace

coefplot `plot_donut_reg', vertical drop(_cons) legend(off) ///
    yline(0, lpattern(dash) lcolor(black)) msymbol(circle) mcolor(maroon) ciopts(lcolor(maroon)) ///
    xtitle("Raio de Tratamento (Metros)") ytitle("Impacto na Área Construída - m² (ATT)") ///
    title("Gradiente da Área Construída: Controle Donut (2.5 a 4.0km)", size(medium)) ///
    graphregion(color(white)) bgcolor(white) name(graf_area_donut_reg, replace)
graph export "$path\gradiente_area_donut_reg.png", as(png) width(2400) replace

coefplot `plot_donut_dripw', vertical drop(_cons) legend(off) ///
    yline(0, lpattern(dash) lcolor(black)) msymbol(circle) mcolor(maroon) ciopts(lcolor(maroon)) ///
    xtitle("Raio de Tratamento (Metros)") ytitle("Impacto na Área Construída - m² (ATT)") ///
    title("Gradiente da Área Construída: Controle Donut (DRIPW)", size(medium)) ///
    graphregion(color(white)) bgcolor(white) name(graf_area_donut_dr, replace)
graph export "$path\gradiente_area_donut_dripw.png", as(png) width(2400) replace

log close
display _newline as result "Estimacoes de Area Construida concluidas com sucesso."