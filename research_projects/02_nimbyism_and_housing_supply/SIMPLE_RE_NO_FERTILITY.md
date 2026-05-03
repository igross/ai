# Simple RE no-fertility version (project 02 aligned)

This note defines a very simple rational-expectations (RE) version of the
`02_nimbyism_and_housing_supply` mechanism with only:

- two ages (young and old),
- one house-size type,
- no fertility choice.

## Model blocks

1. Political tightness:

\[
\theta_t = \theta_0 + \theta_1 E_t[p_{t+1}-p_t]
\]

2. Housing supply:

\[
H_t^s = \bar H - \phi \theta_t
\]

3. Housing price (inverse demand reduced form):

\[
p_t = a + b N^Y - c H_t^s + \varepsilon_t
\]

`N^Y` is fixed in this stripped-down version.

## RE condition

In stationary RE equilibrium, agents correctly forecast no drift:

\[
E_t[p_{t+1}] = p_t = p^*
\]

so expected capital gain is zero in steady state, implying:

\[
\theta^* = \theta_0
\]

Then:

\[
H^{s*} = \bar H - \phi\theta_0
\]

\[
p^* = a + bN^Y - c(\bar H - \phi\theta_0)
\]

## MATLAB implementation

A runnable toy solver is provided in:

- `code/steadystate/simple_two_age_re_no_fertility.m`

Call in MATLAB:

```matlab
out = simple_two_age_re_no_fertility();
```

Optional parameter override:

```matlab
par = struct('theta0',0.35,'phi',0.5,'Ny',1.1);
out = simple_two_age_re_no_fertility(par);
```
