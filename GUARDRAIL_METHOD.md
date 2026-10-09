# Risk-Based Guardrails: model and verification

This tab compares retirement spending policies; it does not reuse the main calculator's deterministic FI equations or Advanced risk intervention rules. Run it with `npm start`, choose Risk-Based Guardrails, and select Run comparison. All computation and financial inputs stay in the browser.

## Markets and reproducibility

The bundled observations are 98 paired calendar years, 1928–2025, from [Aswath Damodaran's NYU Stern historical-return workbook](https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xlsx), retrieved October 8, 2026. The `Returns by year` worksheet supplies A: year, B: S&P 500 including dividends, U: CPI-U inflation. Pre-1957 observations use the source's predecessor series. The data module records the downloaded workbook's SHA-256. `python3 scripts/extract-guardrail-history.py source.xlsx` reproduces the numeric extract; the workbook itself is not distributed.

Three models are available:

- **Centered paired bootstrap (default):** sample a year with replacement, preserving its stock/inflation pairing. Multiply gross stock returns by `(1 + entered stock mean)/(1 + source arithmetic stock mean)`, and gross inflation by the corresponding inflation ratio. Thus the sampling distribution has the entered arithmetic means (11% and 2.5% by default), but retains adjusted historical variation. Individual finite samples need not have exactly those means. This is not an unmodified historical replay.
- **Unchanged paired bootstrap:** use the source observations directly; entered mean stock return and inflation are ignored.
- **Parametric:** independent lognormal gross stock returns calibrated to the entered arithmetic nominal mean and standard deviation, with fixed entered inflation. For arithmetic mean `m` and standard deviation `s`, `sigma² = log(1+s²/(1+m)²)` and `mu = log(1+m)-sigma²/2`.

Cash has a constant configurable nominal yield (default 3.5%). Every annual stock/cash gross return is divided by that year's gross inflation. All internal amounts are in initial purchasing power, so maintaining real spending means adjusting nominal withdrawals for inflation.

One outer path array is shared by both strategies, all eight target-sweep policies, and the optional no-cash comparison. Changing a policy cannot change those markets. The seeded generator preserves the first 10,000 paths when the outer count increases. Default seed is 7301; the probability construction seed is `seed XOR 0x9e3779b9`, and holdout validation seed is `seed XOR 0x85ebca6b` (unsigned 32-bit). Outer paths never supply probability-model futures.

Bootstrap years are independent. This preserves within-year pairing, not serial correlation, long regimes, valuation effects, or future structural changes. Taxes and fees are not separately modeled.

## Cash and annual timing

Starting cash is `min(starting wealth, reserve years × initial spending)`. Stocks receive the remainder. Cash is inside the portfolio; 85/15 is illustrative, not a second constraint. Initial spending and its resulting allocation are solved together. No-cash comparison solves its own initial spending with a zero-reserve probability model.

At each subsequent year's beginning, estimate fixed-spending success for the remaining horizon, including the current year. Below the lower rail, cut toward the target; above the upper rail, raise toward the target; otherwise maintain real planned spending. Each rule uses only current assets and assumptions.

Then, once per year:

1. Apply stock and cash returns, including inflation conversion.
2. Pay the planned withdrawal at year-end. After a negative or zero nominal stock return, draw cash first. After a positive stock return, draw stocks first; cash covers any shortage.
3. Only after a positive stock year, transfer stocks into cash toward `reserve years × planned spending`.

Funding-source selection uses the just-completed year's observed return, not a forecast made at the beginning checkpoint. There is no within-year emergency budget revision. For every year, ending stocks + ending cash + paid withdrawal equals grown stocks + grown cash. Transfers create no money. If available money cannot meet spending, record a shortfall and retain subsequent zero-spending years in lifetime averages.

## Independent probability model

A worker builds a simulation lookup using 1,024 independent paths by default (512–4,096 selectable). Each cell simulates **constant real spending, no future guardrail adjustments**, and the same cash policy. The grid includes every remaining year, cash fractions 0%, 10%, …, 100%, and zero plus 160 logarithmically spaced spending/asset rates from 0.01% through 100%. Zero-reserve models use only zero cash. A monotone envelope removes numerical reversals; maximum correction is reported. Linear interpolation in spending rate and cash fraction yields probabilities; inverse interpolation solves spending.

Initial spending uses bisection with its spending-dependent initial cash balance. Checkpoints solve spending for the current split without instantaneously reallocating that split. Restoration tolerances are 1.5 percentage points; misses are counted and shown. Initial spending cannot exceed wealth divided by max(1, reserve years), except when the explicitly entered floor requires it. Subsequent target solutions are capped at 100% of current wealth, except for a binding floor. Spending **above current wealth is outside the permitted model domain and explicitly treated as infeasible (0%)**, not assigned the more optimistic probability of a capped withdrawal. This is a conservative boundary rule, not a simulated probability for spending above wealth.

The floor is constant in real dollars and can prevent restoration. The outer simulation still measures the resulting depletion and unmet spending. Empty portfolios and nonnegative balances are handled explicitly. Near-0% and near-100% estimates are sample bounds, not certainty; the maximum binomial sampling margin and the number of near-tail checkpoints are displayed. There is no assumption of a linear relationship between probability and spending.

Every run checks the lookup against 2,048 additional independent fixed-spending simulations at 60 states: remaining horizons 1, 5, 10, 25, 50 (clipped/deduplicated for shorter horizons), cash fractions 0%, 15%, 40%, and requested probabilities 10%, 30%, 80%, 95%. Comparison is to the achieved lookup estimate, including bounded solutions. The interface reports all checks, mean/max absolute error, and a warning above 5 percentage points. This measures finite-sample/interpolation consistency under the same assumptions; it does not establish real-world predictive accuracy or validate every state. No-cash comparison reports its own holdout errors.

## Results and charts

- Initial spending is the solved first-year planned amount.
- Lifetime spending sums actual funded real withdrawals. Average annual spending divides by the full horizon, then averages across retirements, including failed paths.
- Cut count records actual decreases in planned spending; lower-rail occupancy separately records every lower trigger, including floor-bound triggers that cannot produce another cut. Average cut size weights all actual cuts equally. Largest-cut distributions include zero-cut retirements. Dollar and percentage maxima can occur on different paths.
- Worst sustained decline is described by the deepest actual spending drop below initial spending and the longest consecutive period below that level, calculated separately. The table shows median and 90th-percentile outcomes for both.
- Spending volatility is the within-path standard deviation of annual proportional changes in funded spending, then averaged across paths. A positive-to-zero change is −100%; zero-to-zero contributes zero.
- Depletion means ending stocks plus cash at or below one cent in any year. Observed fully funded success means no spending shortfall above one cent. A final fully paid withdrawal can exhaust assets without an unmet withdrawal.
- Lower-rail metrics count pre-adjustment and post-adjustment annual checks, and consecutive pre-adjustment runs. They are annual observations, not continuous measurements.
- First-cut probabilities cover retirement years 1–5, 1–10, and 1–20; the UI shows N/A when the chosen horizon is shorter.
- Spending/balance quantiles are computed across paths separately at each year; they are not one coherent retirement path. Individual paths use the same path index for both policies. Cash and stock medians need not add to the total median.
- The target sweep uses 20%, 30%, …, 90%, with ±10 percentage-point guardrails clamped to valid bounds. All plotted values come from outer results.

A low fixed-spending probability target does **not** imply the corresponding ultimate failure rate under changing spending. Failures and target probabilities are reported separately. As retirement approaches its final year, these rules can materially raise withdrawals because less time remains. Since spending is set before that year's market result and is not adjusted again within the year, losses can still cause a shortfall. Results should be interpreted alongside spending cuts and their timing.

## Verification and observed defaults

`npm test` includes existing calculator regression tests and guardrail tests for documented contiguous data, shared path prefixes, independent randomness, accounting conservation, cash-policy order, deterministic annuity survival, initial target solution, trigger direction, spending floors, wealth-limit handling, no lookahead, chart aggregates, depletion, calibration and higher-count stability.

With defaults (seed 7301, 10,000 outer scenarios, 1,024 probability samples, 50 years, centered bootstrap, 2-year cash reserve, no floor):

| Measure | Aggressive 20/30/40 | Conservative 70/80/90 |
|---|---:|---:|
| Initial annual real spending | $76,111 | $36,831 |
| Mean lifetime annual real spending | $73,395 | $189,286 |
| Mean number of cuts | 15.49 | 6.76 |
| Mean reduction per cut | 18.7% | 23.6% |
| Observed depletion | 24.76% | 20.10% |
| Spending shortfall before final 10 years | 0% | 0% |

All observed default failures occur in the last ten years. The larger conservative lifetime mean reflects later increases and favorable-path upside, not its initial spending level. These are model-specific empirical results, not hardcoded conclusions. They do not establish which strategy is appropriate for a person.

Increasing outer scenarios to 25,000 changes depletion to 24.504% and 19.896%, average cuts to 15.447 and 6.727, and mean annual spending to $73,947 and $191,769. With 25,000 outer paths and 2,048 probability samples, initial spending becomes $76,293 and $37,730; depletion is 24.464% and 19.560%, and mean cuts 15.505 and 7.210. Probability-model resolution therefore matters as well as outer count. Default holdout mean/max absolute errors are 1.31/3.79 percentage points across 60 states; maximum monotonic correction is zero.
