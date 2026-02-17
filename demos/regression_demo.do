* Simple Regression Demo
* Generated 2026-02-17

clear all
set obs 100

* Generate sample data: education -> earnings
set seed 12345
gen education = runiform(8, 20)
gen experience = runiform(0, 30)
gen earnings = 10000 + 2500*education + 500*experience + rnormal(0, 5000)

* Summary stats
summarize

* Run regression
regress earnings education experience

* Graph: education vs earnings with fitted line
twoway (scatter earnings education, mcolor(navy%50)) ///
       (lfit earnings education, lcolor(red) lwidth(thick)), ///
       title("Education and Earnings") ///
       xtitle("Years of Education") ytitle("Earnings ($)") ///
       legend(order(1 "Observed" 2 "Fitted")) ///
       scheme(s2color)

graph export "C:/Users/Dave_/OneDrive/Desktop/Economics/earnings_graph.png", replace width(800)

di "Done!"
