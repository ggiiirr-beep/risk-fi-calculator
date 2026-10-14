# Guardrail validation — October 13, 2026

This is a reproducible implementation and sensitivity check, not a forecast or a recommendation. Run `npm run validate:guardrails`; the full results and individual ledgers are in [guardrails-review.json](guardrails-review.json).

## Scenario and checks

Illustrative assumptions: $1.1 million starting wealth, $1.5 million investment-only FI target, 10 years, 9% nominal stock return, 2.5% inflation, 3.5% nominal cash return, and a two-year cash reserve inside starting wealth. Starting target 30%, lower/upper offsets 10 percentage points; increasing schedules end at 90%. Floors of $0, $20,000 and $40,000 are examples, not estimates of anyone’s needs.

- 10,000 outer paths per schedule, with shared paths across schedules and floors; 1,024 independent forward probability samples. Production outer seed 7301; block seed 98173; shuffle seed 71381.
- 48 individual paths (480 annual ledgers) reconcile investment balances, cash and paid withdrawals against a separate nominal-dollar calculation to within $0.00001 in real dollars. The oracle uses the engine’s selected withdrawals, so this checks accounting independently, not the optimality of each withdrawal decision.
- Windows starting in 1929, 1966, 2000 and 2007 preserve consecutive observations. Gross returns and inflation are rescaled to the entered means, as in the production bootstrap: these are not literal historical replays.
- Independently calculated schedule curves agree at every checkpoint, including the final decision one year before the deadline. Automated tests separately cover final post-withdrawal, investment-only goal measurement, current-dollar inflation conversion, feasibility and trigger behavior, and simulation convergence.
- Longest consecutive floor stretches agree with an independent scan of each ledger. Floor duration means planned withdrawals at the floor; actual payments can be lower if assets cannot fund them. Largest cut measures the largest planned year-to-year reduction, and includes paths with no cuts as zero.

## Withdrawal-floor sensitivity

Production independent-year sampling; cumulative withdrawals are inflation-adjusted and actually paid. Each floor/schedule combination solves its starting withdrawals under the same assumptions.

| Floor | Schedule | Deadline success | Median cumulative withdrawals | Median largest cut | Mean years at floor |
|---|---|---:|---:|---:|---:|
| $0 | fixed | 14.7% | $412,513 | 100.0% | 3.08 |
| $0 | steady | 46.3% | $157,701 | 100.0% | 5.25 |
| $0 | early | 50.1% | $101,316 | 100.0% | 6.40 |
| $0 | late | 40.6% | $243,395 | 100.0% | 4.41 |
| $20,000 | fixed | 13.0% | $452,702 | 60.5% | 3.98 |
| $20,000 | steady | 40.0% | $282,926 | 60.5% | 6.06 |
| $20,000 | early | 43.0% | $261,316 | 60.5% | 7.33 |
| $20,000 | late | 35.4% | $331,426 | 60.5% | 5.24 |
| $40,000 | fixed | 10.4% | $511,984 | 40.9% | 5.05 |
| $40,000 | steady | 31.6% | $421,316 | 21.0% | 6.92 |
| $40,000 | early | 33.8% | $410,658 | 21.0% | 7.81 |
| $40,000 | late | 28.3% | $445,446 | 21.0% | 6.09 |

In this scenario, all four zero-floor schedules have a median largest cut of 100%. A higher floor reduces the allowed cuts and lowers deadline success. For the earlier-increase schedule, the $40,000 floor changes success from 50.1% to 33.8% and median cumulative withdrawals from about $101,000 to $411,000. This does not establish a preferred schedule: higher deadline success can require withdrawals that are unacceptable to the user.

## Sustained sequences

Sensitivity runs draw five consecutive historical years per block without wrapping, then join two blocks. A paired comparison shuffles the exact ten observations within each path, retaining its returns and inflation but changing their order. Every schedule uses identical paths within each sampling method. The checkpoint model stays the production independent-year estimator: this deliberately tests performance when the outer sequence differs from that model, rather than claiming a calibrated block-based probability estimate.

| Floor | Schedule | Five-year block success | Same observations shuffled | Difference (percentage points) |
|---|---|---:|---:|---:|
| $0 | fixed | 12.4% | 14.4% | -2.0 |
| $0 | steady | 47.5% | 45.7% | +1.8 |
| $0 | early | 50.1% | 49.1% | +1.0 |
| $0 | late | 40.9% | 40.1% | +0.9 |
| $20,000 | fixed | 10.8% | 12.3% | -1.6 |
| $20,000 | steady | 40.7% | 39.7% | +0.9 |
| $20,000 | early | 43.1% | 42.8% | +0.3 |
| $20,000 | late | 35.8% | 34.8% | +1.0 |
| $40,000 | fixed | 8.7% | 9.5% | -0.8 |
| $40,000 | steady | 31.2% | 30.1% | +1.1 |
| $40,000 | early | 33.0% | 32.2% | +0.8 |
| $40,000 | late | 27.7% | 26.3% | +1.3 |

Ordering changes deadline success by roughly −2.0 to +1.8 percentage points in these paired runs. The direction varies by schedule; sustained sequences do not uniformly worsen the result. This one seeded experiment does not bound sequence risk or validate extreme confidence targets. Block endpoints alter sampling weights relative to the production bootstrap, so block-versus-production differences should not be attributed solely to ordering; the paired shuffled comparison addresses that issue.

## Limits and next checks

Passing accounting and regression checks does not validate expected returns, future market behavior, or probability calibration in every state. Existing sample-count convergence tests cover selected scenarios, not every input combination. Near-zero/near-one probability estimates, lookup-grid approximation, non-independent markets, and the usefulness of a particular withdrawal floor remain important limitations. No new sampling model or financial policy was introduced into the site by this review.
