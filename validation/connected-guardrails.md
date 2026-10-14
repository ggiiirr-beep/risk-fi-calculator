# Connected guardrails validation — October 14, 2026

Reproduce with `node scripts/validate-connected-guardrails.mjs`. Raw results are in `connected-guardrails.json`.

All cases start with $1.1m total assets, including $100k cash, 11% expected nominal stocks, 2.5% expected inflation, 3.5% cash yield, two-year cash refill target, zero withdrawal floor, inflation-adjusted withdrawals and seed 7301. A uses 20/30/40% rails; B uses 70/80/90%. Both are fixed probability schedules. Starting amounts are preserved, with an immediate rule check.

FI: ten years, $1.5m real total-assets target, $40k starting withdrawals. Retirement: 30 years, $500k real ending balance, $60k starting withdrawals.

| Goal / historical sampling | A observed success | B observed success | Maximum holdout probability discrepancy |
| --- | ---: | ---: | ---: |
| FI / independent years | 15.37% | 56.92% | 4.23 pp |
| FI / five-year blocks | 11.63% | 58.48% | 5.81 pp |
| Retirement / independent years | 19.56% | 75.81% | 3.07 pp |
| Retirement / five-year blocks | 16.64% | 79.17% | 4.34 pp |

Observed success above uses 10,000 paths. Increasing to 25,000 changed each result by less than 0.5 percentage points. This does not remove probability-model or historical-model uncertainty. The five-year FI holdout discrepancy exceeds five points and the UI flags that condition.

The policies have different withdrawal outcomes, not simply different success rates. In the five-year-block FI case, median total real withdrawals were about $655k for A and $324k for B, with mean years at the zero floor of 2.42 and 7.34. Both had a median largest cut of 100%. These are scenario-specific model outputs, not recommended rules.

Tests additionally reconcile real and nominal balances, verify sample prefixes, historical pair ordering, goal definitions, terminal targets, immediate triggers, ramp endpoints, and inflation treatment. No historical data or conclusions are hardcoded into the result displays.
