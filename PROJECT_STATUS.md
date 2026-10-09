# Risk FI Calculator — current status

Updated October 8, 2026. This is the standalone web calculator, separate from the Excerpt Tracker iOS project.

- Repository: `ggiiirr-beep/risk-fi-calculator`; active publication branch: `main`.
- GitHub Pages serves the repository root at https://ggiiirr-beep.github.io/risk-fi-calculator/.
- Dependency-free JavaScript app. Use `npm start`, `npm test`, and `npm run build`.
- Existing FI calculator, saved inputs, withdrawal percentage bases, scenarios and annual check-in remain available.
- Risk-Based Guardrails adds an independent, worker-based retirement policy comparison with shared market scenarios, documented historical data, separate probability construction/validation, target sweep, cash comparison and spending floor.
- Methods, data provenance, result definitions and numerical verification are in `GUARDRAIL_METHOD.md`.
- Tests include 10,000/25,000-path convergence and 1,024/2,048 probability-sample sensitivity. Desktop Safari preview and narrow effective viewport checked; no physical device testing was performed.
- Known modeling limits: independent annual samples, no separate tax/fee model, finite probability lookup, annual decisions/end-year withdrawals, and potentially large late-retirement spending increases. These are disclosed in the interface.
