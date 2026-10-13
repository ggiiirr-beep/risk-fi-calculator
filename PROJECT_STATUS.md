# Risk FI Calculator — current status

Updated October 13, 2026. Standalone web calculator, separate from Excerpt Tracker iOS.

- Repository: `ggiiirr-beep/risk-fi-calculator`; publication branch `main`. GitHub Pages serves the repository root at https://ggiiirr-beep.github.io/risk-fi-calculator/.
- Dependency-free JavaScript. Commands: `npm start`, `npm test`, `npm run build`.
- Primary navigation: Your plan, Withdrawal rules, Check my position; Help explains the concepts. Return scenarios and the existing variable-return simulator live under Your plan. Saved-baseline comparison lives under Check my position.
- Saved inputs and numerical engines are retained. Disabled solver entries now say “Calculated below” and no longer describe an unused saved withdrawal as the active result.
- Withdrawal rules offers explicit “Use my plan”: transfers solved investments plus cash (without double counting), FI target, horizon and return assumptions. Fractional horizons round up; custom targets preserve the same target via an equivalent FI withdrawal amount. Simulations still solve withdrawals/cash allocation independently. Income schedules, timing and percentage policies are not imported; limitations are explained next to the action.
- Current withdrawal checks use shared guardrail settings, but a dedicated worker entry point builds only the probability model and current dollar thresholds. It does not run outer comparisons. Current amounts remain in starting-year purchasing power.
- Guardrail results lead with initial withdrawals, observed success, median cumulative withdrawals and years at the floor, with cuts/lowest withdrawals underneath and prominent feasibility warnings. Detailed metrics, baselines, secondary charts and model accuracy are expandable. Strategies are neutrally named A/B.
- Existing features: fixed/steady/earlier/later schedules, fixed original FI deadline, retirement-funding alternative, independent probability estimation, shared outer market paths, fixed/zero-withdrawal references, floors, no-cash comparison, and fixed-target sweep.
- Methods/data provenance are in `GUARDRAIL_METHOD.md`. Limits include independent annual samples, finite probability lookup, no separate taxes/fees, annual decisions/end-year withdrawals, and potentially large late-retirement increases. Targets are not guarantees.
- Verification: 93 tests pass, including simulation convergence and new transfer/current-check tests; static build and syntax checks pass. Browser checks cover saved entries, plan transfer, comparison results, expandable charts, standalone check, scenarios, legacy simulator, saved-plan access and Help. Mobile 390px preview has no page overflow; no physical device testing.
- Asset version: 20261013-3. Local test: 30-year 10,000-path comparison 5.31 seconds; standalone check 0.82 seconds.

- Incorporated follow-up review: current checks lead with infeasibility before any suggested cut; fixed-withdrawal success comparison is visible with a plain explanation of the withdrawal-increase tradeoff. New stress-test models, cuts-only policies and an all-ramp comparison remain separate possible extensions, not part of this clarity update.
