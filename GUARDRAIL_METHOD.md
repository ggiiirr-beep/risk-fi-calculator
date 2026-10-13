# Risk-Based Guardrails: model and verification

This tab compares retirement spending policies; it does not reuse the main calculator's deterministic FI equations or Advanced risk intervention rules. Run it with `npm start`, choose Risk-Based Guardrails, and select Run comparison. All computation and financial inputs stay in the browser.

## Goal selection (October 13 update)

The default goal is **Reach Traditional FI**, with 15 years to the deadline and $100,000 annual Traditional FI withdrawals at 4%, giving a $2.5 million investment target in today's dollars. The prior **Fund retirement without depletion** goal remains available, with a separately retained 50-year horizon. Switching goals preserves the entered assumptions and each horizon. Older saved retirement settings retain their horizon in retirement mode and initialize FI mode to 15 years.

FI success means ending **investments** at or above the fixed FI target on the original deadline, after that year's withdrawals and cash replenishment, with no earlier unfunded withdrawal or depletion. Cash does not count toward the target. An earlier touch does not end the simulation or guarantee success at the deadline. No post-FI retirement period is simulated. After one year of a 15-year scenario, each checkpoint uses 14 remaining years. The deadline and real-dollar investment target do not roll forward or shrink when Risk FI withdrawals are cut.

FI probabilities estimate that outcome **without subsequent guardrail changes**. The independent sample now also builds terminal-investment survival distributions across 322 target-to-current-wealth ratios: zero plus 321 log-spaced ratios from 0.0001 to 10,000. At each withdrawal/cash/horizon cell, empirical counts give the chance of ending above each target. Interpolation spans target ratio, cash fraction and withdrawal rate. Rates remain monotonic in withdrawals. Ratios beyond the supported range conservatively receive 0%; this is a disclosed modeling boundary, not mathematical impossibility. Finite sample probabilities near 0/1 are not guarantees.

The withdrawal solver checks the zero-withdrawal probability. When the requested probability is unattainable, it returns zero (or the entered minimum floor), reports the achieved probability, and marks the target restoration infeasible. Annual checks likewise use the lowest allowed withdrawals when cuts cannot restore the target. The tool does not invent contributions, alter the target, or extend the deadline.

Results report actual FI achievement, deadline misses (including depleted paths), withdrawal shortfalls, and depletion separately. The sweep includes FI achievement and deadline-miss outcomes. The balance chart shows the fixed target; individual paths include a table of each year's remaining horizon, probability before adjustment, planned withdrawals and cut/raise/maintain decisions.

FI calibration uses 2,048 held-out paths at horizons 1, 5, 10, 15 for the default horizon; cash fractions 0%, 15%, 40%; requested probabilities 10%, 30%, 80%, 95%; and target/wealth ratios 0.5, 1, the entered starting ratio, and 5 (deduplicated). Default maximum absolute discrepancy is 2.90 percentage points over 192 states. These checks validate consistency within the model, not predictive accuracy in real markets.

With the default FI inputs and seed 7301, initial aggressive withdrawals are $35,927. Zero withdrawals have approximately 54.4% modeled FI success, so the conservative 80% target is explicitly infeasible at the start. Actual dynamic-policy FI success is 10.99% and 45.97% across 10,000 outer paths, versus 11.192% and 45.4% across 25,000. Neither policy depletes in the 10,000-path run, illustrating why missing the FI deadline is a different risk. Annual guardrails do not guarantee their chosen success rate when future cuts hit zero or a floor.

New tests cover the FI equation, target validation, cash exclusion, funded deadline attainment, early touches followed by misses, decreasing remaining horizon, scaling, withdrawal monotonicity, infeasible solutions, outer-count stability, finer probability samples, and no-cash accounting. Existing retirement tests explicitly retain their original goal and horizon.

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

With retirement-funding defaults (seed 7301, 10,000 outer scenarios, 1,024 probability samples, 50 years, centered bootstrap, 2-year cash reserve, no floor):

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

## Current dollar guardrail check

The practical check accepts current investments, cash, annual withdrawals and whole years elapsed. It uses the same independently calibrated probability model and `remaining = original horizon − elapsed`. For each strategy it solves the investment balances corresponding to its lower and upper probabilities, holding entered current cash and withdrawals fixed. Investment thresholds exclude that cash; total wealth at a threshold is the displayed investment balance plus entered cash. A bounded binary search covers $0–$1 trillion in investments and reports unavailable/imprecise thresholds instead of inventing a number.

It also reports the current probability, whether to cut/maintain/raise, the resulting withdrawal amount, and the amount corresponding to the target probability. Floor/zero-withdrawal infeasibility is explicitly shown. These are estimates for the current checkpoint, not permanent thresholds; the horizon must not be restarted when entering an annual update. Comparison simulations continue to start at the original portfolio/horizon, separately from this practical check. When current cash is nonzero, the model retains cash-fraction states even with reserve replenishment disabled. Tests recover the lower/upper probabilities from the solved dollar thresholds and verify cut/maintain/raise recommendations around those balances.

## Probability schedules and feasibility (October 13, 2026)

Each strategy retains its initial lower/target/upper probabilities and adds a
schedule and ending target. Existing saved strategies remain fixed. For elapsed
checkpoint `y` of horizon `H`, `t = y/(H-1)`. Fixed uses weight 0, steady uses `t`,
earlier uses `1-(1-t)^2`, and later uses `t^2`. Target equals starting target plus
weight times the difference to the ending target. The ending target applies at
`y=H-1`, with one year remaining; the deadline records the realized result. A
one-year horizon has only its starting checkpoint and uses the starting target.
Starting lower/upper distances remain constant, clipped to [0,1]. Strict crossing
rules remain unchanged; moving the target alone never resets withdrawals. An
upper rail of 1 cannot trigger a raise. Neither a capped band nor a sampled 100%
means certainty. The fixed-target sweep remains explicitly independent of ramps.

Every checkpoint evaluates current withdrawals, the real withdrawal floor, and
zero withdrawals using the same cash/investment position, remaining years and
probability surface. Floor-blocked means zero can reach the target but the floor
cannot; zero-unreachable means even zero cannot. These are counted independently
of rail crossing or whether a reset was attempted. A 1e-8 comparison tolerance
only handles floating-point equality, not simulation uncertainty. New summaries
include probability of any unattainable checkpoint, checkpoint counts for each
reason, planned years at the floor, lowest actual funded withdrawals, and the
10th/median/90th cumulative withdrawal distribution. A funding shortfall below
the floor is separately recorded as before.

For each strategy, fixed withdrawals start at that strategy's solved initial
withdrawals and keep that real amount. Zero withdrawals retain the same starting
investment/cash allocation and original cash-reserve dollar target, replenish
only after positive nominal stock years, and ignore the withdrawal floor. This
avoids silently moving cash into stocks for the zero reference. Both references
use exactly the same outer paths as every strategy. They receive no guardrail
adjustments. With an initial withdrawal amount of zero they coincide. References
are comparisons under these cash rules, not mathematical upper bounds on success.

Probability candidates use the same prebuilt independent simulation sample,
never a new random sample for each withdrawal amount. The current check flags
proximity to a rail within the worst-case sampling margin; the detailed model
section retains interpolation/holdout error disclosure. No deadband or statistical
trigger is added: these would change the specified guardrail mechanics. Automated
schedule tests compare 10,000/25,000 paths and 1,024/2,048 probability samples,
plus trigger behavior, same-allocation reference accounting and dollar checks.
