# Risk FI Calculator — current status

Updated October 13, 2026. This is the standalone web calculator, separate from the Excerpt Tracker iOS project.

- Repository: `ggiiirr-beep/risk-fi-calculator`; active publication branch: `main`.
- GitHub Pages serves the repository root at https://ggiiirr-beep.github.io/risk-fi-calculator/.
- Dependency-free JavaScript app. Use `npm start`, `npm test`, and `npm run build`.
- Existing FI calculator, saved inputs, withdrawal percentage bases, scenarios and annual check-in remain available.
- Risk-Based Guardrails adds an independent, worker-based retirement policy comparison with shared market scenarios, documented historical data, separate probability construction/validation, target sweep, cash comparison and spending floor.
- Methods, data provenance, result definitions and numerical verification are in `GUARDRAIL_METHOD.md`.
- Tests include 10,000/25,000-path convergence and 1,024/2,048 probability-sample sensitivity. Desktop Safari preview and narrow effective viewport checked; no physical device testing was performed.
- Known modeling limits: independent annual samples, no separate tax/fee model, finite probability lookup, annual decisions/end-year withdrawals, and potentially large late-retirement spending increases. These are disclosed in the interface.

- Guardrails now default to reaching a fixed Traditional FI investment target at the original deadline. Separate retained horizons: FI 15 years, retirement funding 50 years. Shows infeasible probability targets, observed FI success/misses/depletion, target-aware charts and annual path decisions.
- FI holdout calibration covers 192 states; default maximum discrepancy 2.90 percentage points. FI outcomes checked at 10,000/25,000 outer paths and 1,024/2,048 probability samples.
- Practical current check accepts present investments, cash, withdrawals and elapsed years; solves dollar investment thresholds for each probability rail and the withdrawal amount/action needed now.
- Verification: 84 automated tests pass; static build succeeds. Browser preview verified FI inputs, deadline-aware results, annual path decisions, retained mode horizons, and current dollar thresholds.

- Probability schedules implemented: fixed, steady, earlier and later increases, ending at the final pre-deadline checkpoint. Live target/band preview and current dollar checks use scheduled rails; old saved rules remain fixed.
- Each checkpoint distinguishes floor-blocked targets from zero-withdrawal infeasibility. Results include lowest withdrawal distributions, floor duration and unattainability frequency.
- Added strategy-matched fixed-withdrawal baselines and zero-withdrawal references with identical starting allocations and shared paths; zero references preserve the original reserve target.
- Verification for schedules: 90 automated tests pass, including convergence at 10,000/25,000 paths and 1,024/2,048 probability samples. Browser 10,000-path scheduled comparison completed in 4.17 seconds with baseline results and no console errors. Asset version 20261013-2.
