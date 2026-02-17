* Simple Regression Example
* Date: 2026-02-17

clear all
set more off

* Load the built-in auto dataset
sysuse auto, clear

* Browse the data
browse

* Summary statistics
summarize price mpg weight

* Run a simple regression: price on mpg
regress price mpg

* Show a scatter plot with fitted line
twoway (scatter price mpg) (lfit price mpg), ///
    title("Simple Regression: Price on MPG") ///
    subtitle("Using auto.dta") ///
    ytitle("Price (USD)") ///
    xtitle("Miles per Gallon") ///
    legend(order(1 "Observed" 2 "Fitted")) ///
    scheme(s2color)
