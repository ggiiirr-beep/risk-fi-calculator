# Risk FI Calculator

An entirely browser-based planning tool for the transition from flexible investment withdrawals to a selected financial-independence threshold.

**Live site:** https://ggiiirr-beep.github.io/risk-fi-calculator/

## Features

- Solve for annual spending, starting investments, reachable ending target, years, target date/age, required real return, implied withdrawal rate, or temporary earned income.
- Check a fixed plan against a desired date. A missed date shows the later projected FI date and extends the chart. Unfunded or unreachable plans are explicitly reported.
- Separate invested assets and cash, nominal/real returns and displays, three cash strategies, temporary income, and beginning/end-of-year withdrawals.
- Interactive, keyboard-accessible portfolio, withdrawal, and scenario charts; detailed annual cash flows.
- Seeded Monte Carlo in a worker, with spending cuts, withdrawal stops, income interventions, and separate depletion/unfunded-spending outcomes.
- Annual check-in with an original baseline, inflation-adjusted comparison, and updated spending, return, and arrival estimates.
- Local browser saving, responsive layouts, light/dark themes.

## Run and test

Requires Node.js 20 or newer. There are no package dependencies.

```sh
npm start       # http://127.0.0.1:4173
npm test        # financial-model checks, including independent annuity formulas
npm run build   # optional static artifact in dist/
```

GitHub Pages can serve the repository root directly from `main`. All application references are relative, so project subpaths work without configuration.

## Structure

- `finance.js`: pure financial engine, solvers, Monte Carlo, annual check-in.
- `finance.test.js`: independent formula benchmarks and behavior tests.
- `app.js`: interface, charts, local persistence, and worker orchestration.
- `risk-worker.js`: off-main-thread simulation.
- `index.html`, `styles.css`, `favicon.svg`: presentation.

## Model conventions

Amounts are real dollars internally. Real returns use the Fisher conversion. End-of-year withdrawals are the default. Partial final periods use compounded fractional returns and prorated spending. Temporary income is prorated to the portion of its earning window inside the period. Income above spending is invested.

Cash first uses available cash above a real-dollar minimum. The downturn buffer selects cash when a period's real investment return is negative. Beginning-of-year buffering therefore assumes knowledge of that period's return; this idealization is disclosed in the interface. Cash never replenishes automatically. FI excludes cash.

The solver varies linked targets and spending-linked cash on every iteration. Time search stops at 100 years. Monetary solution bounds are $1B annual spending/income and $100B initial investments. Required real return is bracketed from -95% to 500%. Unfunded cash flows fail feasibility rather than creating negative asset balances.

Simulations use independent lognormal gross returns calibrated to the arithmetic mean and standard deviation of annual simple real returns. They use a repeatable seed, constant cash yield and inflation, and no asset correlations or historical regimes. Rules evaluate starting balances, reset annually, and do not lower the original FI target. Success on the target date requires all prior spending to have been funded.

The app does not guarantee financial safety. Returns should be entered after fees and tax drag; spending should include withdrawal taxes; earned income is after tax. It does not model account-specific taxes. See the in-app “How it works” tab for details.

## Privacy

Financial inputs stay in the browser. There are no analytics, account services, or API calls carrying financial data. Fonts load from Google Fonts with system fallbacks. Browser storage can be cleared by the browser/user, which removes locally saved plans.
