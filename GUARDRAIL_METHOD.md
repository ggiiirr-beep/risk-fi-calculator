# Risk-Based Guardrails — connected model

Updated October 14, 2026. Inputs and computation stay in the browser. This describes the connected site, version 20261014-25; earlier validation files describe explicitly older model versions.

## One plan, two tabs

Shared cards show total wealth, actual cash/investments, FI target and horizon, returns and inflation. They remain linked and editable in both tabs. Calculated source timelines/investments/returns have visible provenance notes. Editing creates an explicit Check my plan snapshot. Retirement duration and ending balance are independent of the FI deadline.

Step 1 builds the probability model and solves starting withdrawals at 20–90% confidence plus each strategy's selected target. It preserves actual entered cash and investments; it does not use the main plan's withdrawal amount or reallocate initial cash. Annual/monthly dollars, percent of wealth and achieved confidence are shown. Targets above zero-withdrawal confidence are marked unattainable; they are never presented as successful $0 solutions.

Step 2 runs each strategy from its own solved withdrawals on shared market paths, with fixed and zero-withdrawal references. Unattainable strategies start from zero and remain explicitly flagged. A schedule comparison uses a common starting confidence and solved withdrawal amount. The minimum withdrawal is always zero in both modes; engine floor support remains only for legacy tests.

The main cash policy is not identical to the guardrail policy: guardrails replenish cash after positive stock-return years, toward the entered reserve-years target. Starting cash is preserved, not recalculated from spending. Cash is included exactly once in starting wealth. The optional no-cash comparison instead invests all starting wealth, with the same starting withdrawals and market paths.

Annual guardrail models support 1–60 whole years. Fractional FI horizons round up and the interface reports that difference. A zero-year main horizon uses one annual guardrail checkpoint. Retirement mode has its own duration. This is not a chained simulation of the Risk FI phase followed by retirement.

## Two goals

- **Reach Traditional FI:** all withdrawals funded, no depletion, and ending investments plus cash at least Traditional FI annual withdrawals divided by the FI rate, by the fixed deadline.
- **Fund Traditional FI retirement:** all withdrawals funded, no depletion, and ending investments plus cash at least the chosen ending balance. Zero means no required leftover balance. Duration and ending balance are editable.

Both targets are in today's purchasing power and therefore increase with realized inflation in nominal dollars. An earlier target touch does not stop the simulation. Depletion, withdrawal shortfalls and missing the ending target are separate outcomes. The legacy engine default still supports investment-only FI targets for historical regression fixtures; connected site plans explicitly use total assets.

## Probability schedules and decisions

Each strategy specifies lower/start-target/upper probabilities, a schedule and ending target. With elapsed checkpoint y and horizon H, t = y/(H−1), clamped to [0,1]. Fixed uses weight 0, steady t, earlier 1−(1−t)², later t². Target = start + weight × (end−start). A one-year plan uses the starting target. The ending target applies at the final decision checkpoint, one year before the deadline; at the deadline the outcome is recorded directly.

Rail spacing stays the same until clamped at 0% or 100%. A 100% upper rail cannot trigger a withdrawal increase. Estimated 100% is a finite-model estimate, never certainty.

At each checkpoint:

1. Estimate goal success if the current withdrawal policy continues without later guardrail changes.
2. Below the lower rail, cut toward the current target. Above the upper rail, increase toward it. Otherwise maintain the policy. A schedule change alone does not force a reset.
3. Separately estimate success at zero. Identify targets unattainable even with zero withdrawals. Report achieved probability when restoration fails.

Risk FI can reduce withdrawals to zero. No work income or contributions are invented. The goal and deadline never extend automatically. The observed strategy success rate includes future adjustments and need not equal any checkpoint target probability.

## Historical data and sampling

The bundled 98 paired years, 1928–2025, come from [Aswath Damodaran, NYU Stern](https://pages.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xlsx), retrieved October 8, 2026. Worksheet `Returns by year`: A = year, B = S&P 500 including dividends, U = CPI-U inflation. Pre-1957 observations use the source's predecessor series. `guardrail-history.js` records the workbook SHA-256; `scripts/extract-guardrail-history.py` reproduces the extract.

- Centered historical sampling rescales gross returns and inflation around the plan's entered arithmetic means. This is adjusted historical sampling, not a literal replay.
- Unchanged historical sampling uses the source observations and ignores entered expected stock return/inflation.
- Optional parametric sampling uses independent lognormal gross stock returns and fixed inflation. Its volatility input applies only to that model.

Historical sampling offers independent years or consecutive 3-, 5- or 10-year blocks. The new UI defaults to five-year blocks. Each block starts uniformly among eligible positions, never wraps the end of the dataset, and retains paired returns/inflation and consecutive order. Blocks and scenarios are independent; the final block is truncated to the horizon. Non-wrapping blocks give interior years somewhat more weight than endpoints, so centered block means need not exactly match the entered means. This preserves some sustained periods, not every regime, valuation relationship or possible future crisis.

All strategies, schedules, fixed/zero references and no-cash policies use the same outer paths. Probability estimation uses independent streams, never actual future outer-path returns. At a checkpoint it starts a new independent historical sample; it does not infer the current regime from preceding returns. Seeded streams preserve prefixes when the outer count increases.

Outer count: 10,000–100,000. Probability paths: 512–4,096, default 1,024. Seed default 7301; probability seed XOR 0x9e3779b9; independent validation seed XOR 0x85ebca6b.

## Inflation, cash and timing

Internal values are real dollars. Stocks and cash each receive one annual return and inflation adjustment. Withdrawals occur at year-end. Cash is used first after nonpositive nominal stock returns; stocks first after positive returns, with the other asset covering shortages. Positive years then transfer stocks into cash toward reserve years × planned withdrawals. Balances never become negative, transfers create no money, and unmet withdrawals are recorded.

With inflation adjustment enabled, planned real withdrawals stay constant between decisions. Otherwise planned withdrawals keep their nominal amount and are deflated using each sampled year's inflation. Forward estimates use the same convention.

Future-dollar projection distributions are computed from each path's actual sampled cumulative inflation, not by applying one factor to a real median. Charts, headline withdrawal totals and the four-schedule table switch views. Current-check actions always use current account dollars; detailed stability/cut metrics and reference tables explicitly use real dollars. A total of future withdrawals sums dollars from different years and is not a purchasing-power measure. Neither view changes probabilities.

## Probability approximation and limitations

The lookup spans every remaining year, 11 cash fractions and 161 withdrawal-rate points (zero plus 160 log-spaced 0.01–100% rates). When cash is absent and reserve replenishment disabled it uses a zero-cash slice. For positive terminal targets it also stores 322 target/wealth ratios: zero and 321 log-spaced values from 0.0001 to 10,000. Linear interpolation estimates probabilities; a monotone envelope prevents numerical reversals as withdrawals rise. Inverse interpolation finds withdrawal resets.

Rates above 100% of available wealth and target ratios above 10,000 receive a conservative 0% estimate outside the model domain. These are disclosed bounds, not proofs of impossibility. Restoration tolerance is 1.5 percentage points. Finite samples, interpolation and the assumed market distribution all limit accuracy, especially near 0% and 100%.

Every comparison checks the lookup against 2,048 held-out forward paths across selected horizons, cash fractions, confidence targets and terminal-goal ratios. The UI reports average/max discrepancy and warns above five percentage points. This is an internal model check, not evidence of predictive accuracy. Candidate withdrawal amounts share simulation samples, reducing adjustment noise. Changes very close to thresholds can still depend on model resolution.

No separate taxes, fees, asset correlations, employment, monthly emergency decisions or changing asset allocations are modeled. Enter returns after fees/tax drag and withdrawals including taxes. Cash earns a fixed nominal yield. The sample uses US stock history and is not a diversified global-portfolio forecast.

## Comparisons

The current-position withdrawal check is not exposed in the site. Its numerical helpers remain available for regression testing and potential future use in a separate section.

Two-strategy and four-schedule comparisons use identical starting amounts and markets. Fixed-withdrawal and zero-withdrawal references isolate what adjustments change. The probability sweep holds initial assets/cash and the goal fixed, solving a different initial withdrawal amount for each confidence target.

## Verification

`npm test` covers connected input mapping, historical block pairing/order, shared paths, both terminal-goal definitions, cash reconciliation, forward/outer inflation agreement, nominal distributions, immediate adjustments, schedule endpoints, infeasibility, calibration and legacy regressions.

`node scripts/validate-connected-guardrails.mjs` compares 10,000 and 25,000 paths for both goals and independent/five-year sampling. Outputs: `validation/connected-guardrails.json`. This run's largest change in observed goal success was below 0.5 percentage points. Holdout maximum probability discrepancies range from 3.1 to 5.8 percentage points; the latter remains visibly flagged in the UI. These are scenario-specific numerical checks, not recommended withdrawal policies.

## Custom historical volatility (20261014-25)
Historical volatility is the default. Custom annual volatility uses positive historical gross stock returns raised to a calibrated exponent, then normalized to the selected arithmetic gross-return mean. Bisection chooses the exponent so the population standard deviation across all 98 transformed annual observations matches the requested nominal annual volatility. Zero volatility produces a constant gross stock return. The gross-return transform avoids negative prices and impossible losses beyond 100%.

Centered mode preserves the entered expected nominal stock-return mean; historical-mean mode preserves the source mean. Historical inflation pairing and sampled block indices are unchanged. Custom volatility transforms historical outcomes and is explicitly labeled; it is not a literal replay. Finite/non-wrapping block samples need not match the full-dataset mean or volatility exactly. Parametric mode continues to use its entered annual volatility directly.

Results include the chance of any cut, chance of planned zero withdrawals, mean zero-withdrawal years among affected paths, and median/10th/90th withdrawal bands. Conditional durations are shown separately from averages across all paths. Median bands are cross-sectional summaries, not single retirement experiences. Finite probability resolution and the existing calibration warnings remain visible.
