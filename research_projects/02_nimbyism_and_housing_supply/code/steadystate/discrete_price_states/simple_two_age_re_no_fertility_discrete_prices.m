function out = simple_two_age_re_no_fertility_discrete_prices(params)
% SIMPLE_TWO_AGE_RE_NO_FERTILITY_DISCRETE_PRICES
% Two-age, one-house-size, no-fertility model with constrained
% 3-level price grid {low, medium, high} under perfect foresight.
%
% There is NO transition matrix in this version.
% Instead, we solve a deterministic law of motion on the 3-state grid:
%   j = g(i), where p_{t+1} = p_levels(j) given current state i.
%
% Core equations by current state i:
%   theta_i = theta0 + theta1 * (p_{t+1} - p_i)
%   Hs_i    = Hbar - phi * theta_i
%   p_i^*   = a + b*Ny - c*Hs_i + eps_i
%   g(i)    = nearest_level_index( p_i^* )
%
% A perfect-foresight steady state is a fixed point i* such that g(i*)=i*.
% We choose default levels around the continuous steady state p* so the
% medium state is the natural candidate for i*.

if nargin < 1
    params = struct();
end

% Baseline parameters (aligned with continuous toy model)
p.a = getfield_default(params, 'a', 0.50);
p.b = getfield_default(params, 'b', 0.80);
p.c = getfield_default(params, 'c', 1.00);
p.Hbar = getfield_default(params, 'Hbar', 1.00);
p.phi = getfield_default(params, 'phi', 0.40);
p.theta0 = getfield_default(params, 'theta0', 0.30);
p.theta1 = getfield_default(params, 'theta1', 0.20);
p.Ny = getfield_default(params, 'Ny', 1.00);

% Continuous steady-state anchor.
p_star_cont = p.a + p.b * p.Ny - p.c * (p.Hbar - p.phi * p.theta0);

% State-specific residual shifters.
eps_low = getfield_default(params, 'eps_low', -0.06);
eps_mid = getfield_default(params, 'eps_mid',  0.00);
eps_high = getfield_default(params, 'eps_high', 0.06);
eps_vec = [eps_low, eps_mid, eps_high];

% Discrete levels, centered so medium equals continuous p* by default.
default_levels = [p_star_cont - 0.08, p_star_cont, p_star_cont + 0.08];
p_levels = getfield_default(params, 'p_levels', default_levels);
p_levels = sort(p_levels(:))';

if numel(p_levels) ~= 3
    error('p_levels must have exactly 3 values: [low medium high].');
end
if ~(p_levels(1) < p_levels(2) && p_levels(2) < p_levels(3))
    error('p_levels must be strictly increasing [low < medium < high].');
end

g = zeros(1,3);
p_implied_cont = zeros(1,3);
theta = zeros(1,3);
Hs = zeros(1,3);
expected_next_price = zeros(1,3);

% Build deterministic mapping i -> g(i)
for i = 1:3
    % perfect foresight guess: tomorrow is whichever discrete state model implies
    % (one-step fixed-point selection on the constrained grid)
    best_j = 2;
    best_dist = inf;

    for j = 1:3
        theta_ij = p.theta0 + p.theta1 * (p_levels(j) - p_levels(i));
        Hs_ij = p.Hbar - p.phi * theta_ij;
        p_ij = p.a + p.b * p.Ny - p.c * Hs_ij + eps_vec(i);
        d = abs(p_ij - p_levels(j));

        if d < best_dist
            best_dist = d;
            best_j = j;
            theta(i) = theta_ij;
            Hs(i) = Hs_ij;
            p_implied_cont(i) = p_ij;
        end
    end

    g(i) = best_j;
    expected_next_price(i) = p_levels(best_j);
end

% Perfect-foresight steady states are fixed points of g.
fixed_points = find(g == [1 2 3]);

% Prefer medium fixed point if available.
if any(fixed_points == 2)
    ss_idx = 2;
elseif ~isempty(fixed_points)
    ss_idx = fixed_points(1);
else
    ss_idx = NaN;
end

out = struct();
out.params = p;
out.price_levels = p_levels;
out.continuous_p_star = p_star_cont;
out.policy_next_state = g;
out.expected_next_price_by_state = expected_next_price;
out.theta_by_state = theta;
out.Hs_by_state = Hs;
out.implied_cont_price_by_state = p_implied_cont;
out.residuals = p_implied_cont - p_levels(g);
out.fixed_points = fixed_points;
out.has_fixed_point = ~isempty(fixed_points);
out.steady_state_index = ss_idx;
out.steady_state_price = ifelse_num(isnan(ss_idx), NaN, p_levels(ss_idx));
out.medium_is_steady_state = any(fixed_points == 2);
out.medium_gap = p_levels(2) - p_star_cont;

fprintf('Discrete-price perfect-foresight no-fertility model (3 states)\n');
fprintf('Levels [L M H]: [%.4f %.4f %.4f]\n', p_levels(1), p_levels(2), p_levels(3));
fprintf('Continuous p* anchor         : %.6f\n', p_star_cont);
fprintf('Policy map i->g(i)           : [%d %d %d]\n', g(1), g(2), g(3));
fprintf('Fixed points                 : ');
if isempty(fixed_points)
    fprintf('none\n');
else
    fprintf('%s\n', mat2str(fixed_points));
end
fprintf('Medium state fixed point?    : %d\n', out.medium_is_steady_state);
end

function v = getfield_default(s, fieldname, default)
if isfield(s, fieldname)
    v = s.(fieldname);
else
    v = default;
end
end

function y = ifelse_num(cond, a, b)
if cond
    y = a;
else
    y = b;
end
end
