# Risk FI Calculator

An entirely browser-based planning tool for the transition from flexible investment withdrawals to a selected financial-independence threshold.

**Live site:** https://ggiiirr-beep.github.io/risk-fi-calculator/

## Features

- Five questions: how much can I withdraw, how much do I need invested, when will I reach Traditional FI, what return do I need, and check my plan. Time results combine years, date, and age. Additional engine solvers remain available internally.
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

## Withdrawal inputs

Annual withdrawals means the amount needed from investments and cash after existing earnings. Optional additional income offsets only income not already reflected in those withdrawals, during the selected years; any excess is invested. The engine retains its legacy `spending` key for saved-plan compatibility. Dollar inputs display thousands separators while retaining numeric values for calculations.

Risk FI and Traditional FI annual withdrawals are always visible as separate inputs. The former divided by the FI rate determines the target; the latter drives projected cash flows and cash runway. A custom target overrides both. Older linked plans initialize the Traditional FI input from their Risk FI amount, preserving the entered target.

## Percentage withdrawals

Risk FI withdrawals can be entered in dollars or as a percentage. Percentage defaults to starting investments: the initial dollar amount stays constant in real terms. The alternate annual basis applies the rate to each year's opening investment balance, before additional income, cash allocation, and guardrails. Partial years prorate withdrawals. Traditional FI targets remain independent, and cash-years reserves use the initial withdrawal amount. All primary solvers and Monte Carlo support both percentage bases; withdrawal rate searches cover 0–100%. Annual check-in accepts current withdrawals in dollars. Dollar entries, percentage entries, and the selected basis are preserved independently.
