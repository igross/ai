* demo.do - Simple regression demo
clear all
set more off

* Create sample data: education -> wages
set obs 100
set seed 12345
gen education = round(rnormal(12, 3))
gen experience = round(rnormal(10, 5))
gen wage = 5 + 2.5*education + 1.2*experience + rnormal(0, 5)

* Summary stats
summarize wage education experience

* Regression
regress wage education experience

* Graph
twoway (scatter wage education) (lfit wage education), ///
    title("Wage vs Education") ///
    ytitle("Wage") xtitle("Years of Education") ///
    legend(off)
graph export "C:/Users/Dave_/OneDrive/Desktop/Economics/demo_graph.png", replace

