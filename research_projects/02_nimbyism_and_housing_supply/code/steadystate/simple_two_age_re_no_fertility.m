function out = simple_two_age_re_no_fertility(params)
% SIMPLE_TWO_AGE_RE_NO_FERTILITY
% Minimal two-age, one-house-size, no-fertility rational-expectations toy model
% aligned with the project-02 NIMBY mechanism.
%
% Equations:
%   theta_t = theta0 + theta1 * E_t[p_{t+1} - p_t]
%   Hs_t    = Hbar - phi * theta_t
%   p_t     = a + b*Ny - c*Hs_t + eps_t
%
% In stationary RE with E_t[p_{t+1}] = p_t = p* and E[eps]=0:
%   p* = a + b*Ny - c*(Hbar - phi*theta0)
%   theta* = theta0
%   Hs* = Hbar - phi*theta0
%
% Inputs (optional struct): a,b,c,Hbar,phi,theta0,theta1,Ny

if nargin < 1
    params = struct();
end

% Defaults
p.a = getfield_default(params, 'a', 0.50);
p.b = getfield_default(params, 'b', 0.80);
p.c = getfield_default(params, 'c', 1.00);
p.Hbar = getfield_default(params, 'Hbar', 1.00);
p.phi = getfield_default(params, 'phi', 0.40);
p.theta0 = getfield_default(params, 'theta0', 0.30);
p.theta1 = getfield_default(params, 'theta1', 0.20); %#ok<NASGU>
p.Ny = getfield_default(params, 'Ny', 1.00);

% Stationary RE equilibrium
theta_star = p.theta0;
Hs_star = p.Hbar - p.phi * theta_star;
p_star = p.a + p.b * p.Ny - p.c * Hs_star;

out = struct();
out.params = p;
out.theta_star = theta_star;
out.Hs_star = Hs_star;
out.p_star = p_star;

fprintf('Simple 2-age no-fertility RE equilibrium:\n');
fprintf('  p*     = %.6f\n', p_star);
fprintf('  theta* = %.6f\n', theta_star);
fprintf('  Hs*    = %.6f\n', Hs_star);
end

function v = getfield_default(s, fieldname, default)
if isfield(s, fieldname)
    v = s.(fieldname);
else
    v = default;
end
end
