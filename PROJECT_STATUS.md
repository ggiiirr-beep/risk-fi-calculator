# Risk FI Calculator — current status

Updated October 14, 2026. Standalone web calculator, separate from Excerpt Tracker iOS.

- Repository: `ggiiirr-beep/risk-fi-calculator`; publication branch `main`. GitHub Pages serves the repository root at https://ggiiirr-beep.github.io/risk-fi-calculator/.
- Dependency-free JavaScript. Commands: `npm start`, `npm test`, `npm run build`.
- Primary navigation: Your plan, Withdrawal rules, Check my position; Help explains the concepts. Return scenarios live under Your plan; the standalone variable-return simulator is removed from the interface. Saved-baseline comparison lives under Check my position.
- Saved inputs and numerical engines are retained. Disabled solver entries now say “Calculated below” and no longer describe an unused saved withdrawal as the active result.
- Withdrawal rules offers explicit “Use my plan”: transfers solved investments plus cash (without double counting), FI target, horizon and return assumptions. Fractional horizons round up; custom targets preserve the same target via an equivalent FI withdrawal amount. Simulations still solve withdrawals/cash allocation independently. Income schedules, timing and percentage policies are not imported; limitations are explained next to the action.
- Current withdrawal checks use shared guardrail settings, but a dedicated worker entry point builds only the probability model and current dollar thresholds. It does not run outer comparisons. Check-in inputs and dollar results now use current dollars. Conversion uses compounded assumed inflation or an optional entered cumulative price change; the original FI target and floor remain in starting-year dollars. Legacy saved check-in entries are converted once to preserve their meaning.
- Guardrail results lead with initial withdrawals, observed success, median cumulative withdrawals and years at the floor, with cuts/lowest withdrawals underneath and prominent feasibility warnings. Detailed metrics, baselines, secondary charts and model accuracy are expandable. Strategies are neutrally named A/B.
- Existing features: fixed/steady/earlier/later schedules, fixed original FI deadline, retirement-funding alternative, independent probability estimation, shared outer market paths, fixed/zero-withdrawal references, floors, no-cash comparison, and fixed-target sweep.
- Methods/data provenance are in `GUARDRAIL_METHOD.md`. Limits include independent annual samples, finite probability lookup, no separate taxes/fees, annual decisions/end-year withdrawals, and potentially large late-retirement increases. Targets are not guarantees.
- Verification: 100 tests pass, including simulation convergence and new transfer/current-check tests; static build and syntax checks pass. Browser checks cover saved entries, plan transfer, comparison results, expandable charts, standalone check, scenarios, legacy simulator, saved-plan access and Help. Mobile 390px preview has no page overflow; no physical device testing.
- Asset version: 20261014-8. Local test: 30-year 10,000-path comparison 5.31 seconds; standalone check 0.82 seconds.

- Incorporated follow-up review: current checks lead with infeasibility before any suggested cut; fixed-withdrawal success comparison is visible with a plain explanation of the withdrawal-increase tradeoff. New stress-test models and cuts-only policies remain separate possible extensions, not part of this clarity update.

- Added an optional direct four-schedule comparison under Withdrawal rules. Uses one chosen strategy’s starting target and rail spacing, with its own saved editable ending target; fixed retains the starting target. All four share identical initial withdrawals, allocation and market paths. Shows success, cumulative withdrawals, floor duration, cuts, infeasibility, distributions and target/withdrawal charts with model accuracy.
- Current results display lower/reset/upper probabilities together. Fixed schedules disable but retain ending targets. Transfer limitations remain visible after using a plan.

- Follow-up: four-schedule headline table now includes median largest withdrawal cut. Detailed distributions include longest consecutive floor stretch (median / 90th percentile). These measure planned withdrawals; actual funding shortfalls remain separately reported.
- Added `npm run validate:guardrails` and `validation/guardrails-review.md` / `.json`: 48 independently reconciled nominal ledgers (480 years), 36 ten-thousand-path comparisons across floors and independent/five-year-block/paired-shuffled samples. Production probability modeling is unchanged. The illustrative 10-year scenario shows median largest cuts of 100% with no floor; a $40k floor reduces early-schedule deadline success from 50.1% to 33.8%. Results are scenario-specific.
- Local browser verified blank ending-target error, an independent 80% comparison ending target with source A still fixed at saved 90%, and the added cut severity column.

- UI hierarchy: start with the question or outcome, then supporting evidence and optional details. Plan inputs group starting point, FI goal, and returns; date status precedes supporting metrics. Scenario dates and results precede charts. Check-in begins with current balances, with original settings and inflation conversion details later. The withdrawal floor is part of main rule selection. Comparisons lead with observed success and withdrawal totals; setup and probability schedule mechanics follow. Chart headings describe the question answered. Financial engines and saved inputs are unchanged.
- Hierarchy verification: 98 regression tests and static build pass. Browser checks cover plan/scenario order, current check actions, two-strategy comparison, four-schedule results and expandable charts, and saved-baseline input order. At a 390px viewport the page has no horizontal overflow; wide comparison tables remain internally scrollable.

- Inputs/results separation: removed the mobile CSS rule that moved the answer above inputs. Your plan now stacks its question and input panel above a numbered Results section on desktop and mobile. Comparisons, check-ins, scenarios and variable-return simulation have explicit input/result headings and dividers; empty guardrail results stay hidden. The main takeaway remains first within the results, not ahead of inputs. Verified desktop and 390px geometry, current-check divider visibility, syntax and static build; financial engines unchanged.

- Added brief framing before the main solver question, starting amounts, FI goal, returns, withdrawal rules, floor, probability schedule, four-schedule comparison and current-position check. Inputs/results ordering and financial calculations are unchanged.

- Plan input heading now directly frames the purpose: “Plan your path from Risk FI to Traditional FI.” Removed its duplicate subheading and renamed the plan output section “Your results,” preserving the divider and inputs-first order.

- Calculated plan fields now display blank while disabled; original entries remain in state and return when enabled. Disabled horizon slider is hidden. Removed redundant saved-entry/ignored-return explanations; today’s-dollar convention appears above inputs. Cash allocation explanation lives with cash settings.

- Main form simplification: years/target-age toggle shares one horizon; age mode uses current age and preserves target age when current age changes. Cash settings are regular visible inputs. Removed date picker, custom FI override, real-return entry selector, extra income and timing controls. Main projections use nominal return plus inflation, no additional income and year-end withdrawals. Saved real returns convert equivalently; saved custom targets become equivalent FI withdrawal goals. Historical baselines retain their original assumptions. The separate guardrail simulator remains unchanged.
- Added tested `plan-settings.js` normalization and age conversion; static build includes the module. Browser verified years/age round trips, current-age updates, blank solved age, nominal return result and removed controls.

## October 14 main-calculator update (20261014-5)
- Main plans use investments plus cash for the FI goal. Engine legacy default remains investment-only for saved baselines and unchanged guardrail dependencies.
- Today/future-dollar preference persists and applies to plan projections and return scenarios. Inputs and goal remain in today’s purchasing power; both target equivalents appear together.
- Dollar/starting-percentage withdrawals can rise with inflation or remain nominally fixed. Annual-portfolio percentages have no extra inflation overlay.
- Full projection includes exact FI crossing, switches to Traditional FI dollar withdrawals, then continues (default 30 years, 100-year overall cap). Fixed nominal post-FI withdrawals start at the inflation-adjusted amount at FI.
- Plan numbers are visible; withdrawal chart has two lines. Table and chart share the full horizon. Return scenarios deliberately retain the Risk FI withdrawal policy throughout to isolate returns, disclosed above the chart.
- Guardrail models, simulations and current-position check deferred to the next authorized phase. Transfer disclosure highlights the different asset basis and unsupported inflation choice.
- Verification: 105 tests, syntax and build; browser checks of future dollars, full table, inflation choice, scenarios and responsive layout.

## Connected guardrails (20261014-6) — current behavior
- User authorized guardrails after the main-calculator deployment. Navigation is Your plan / Risk-Based Guardrails / Help; practical checks are inside the guardrails tab.
- Solved plan amounts sync automatically on entry. Shared fields are read-only outputs with Edit shared plan; no import button or divergent shared inputs. Both strategies start with identical supplied cash and withdrawals, checking rails immediately. Retirement mode uses Traditional FI withdrawals and its own duration/ending balance.
- FI and retirement terminal goals use total assets. Retirement success includes its optional real ending-balance requirement, distinct from funded withdrawals and depletion. Existing probability schedules, infeasibility checks and four-schedule comparisons are retained.
- Historical sampling supports consecutive blocks (new UI default five years), independent years and optional parametric sampling. Shared markets and separate probability/validation streams remain deterministic.
- Inflation policy is connected. Future-dollar projection distributions use sampled inflation on each path. Practical actions remain current dollars; detailed cut/reference measures remain explicitly real dollars.
- 112 automated tests plus connected validation across both goals, 1-/5-year samples and 10k/25k paths. Largest observed-success difference below 0.5 percentage points. Holdout max error reaches 5.8 points in one fixture and remains flagged rather than hidden.
- Current methodology: GUARDRAIL_METHOD.md. Earlier validation reports and status entries above describe historical versions.

## Withdrawal scenarios (20261014-7)
- Added Compare withdrawal scenarios beside return scenarios. Three editable values default to 80%, 100% and 120% of the solved plan’s withdrawal amount/rate; percentage rates cap at 100%.
- Uses the main withdrawal basis and inflation policy, while freezing actual starting cash, investments, returns and Traditional FI target. Scenarios do not edit shared plan inputs. Overrides persist in browser storage, with Use plan defaults to reset.
- Results show FI dates, total assets at the desired date and a common-horizon chart; today/future-dollar preference is shared. Risk FI rules continue through the comparison, as disclosed.
- Two new engine tests cover cash/goal isolation, source immutability, direction of FI dates, percentage behavior, invalid inputs and infeasible plans.

## Remove current-position check (20261014-8)
- Removed Check withdrawals now, its mode selector, and the current-position action/threshold cards previously prepended to comparison results. Guardrails now opens directly into comparison setup and results.
- Removed Help instructions directing users to the check. Numerical check helpers and tests are retained for a possible separate feature later; comparison simulation mechanics are unchanged.

## Editable connected-plan cards (20261014-9)
- Shared assumptions now appear in editable cards: total assets, included cash, Risk FI withdrawals, FI target/withdrawals/rate, horizon, returns and inflation. Changes persist to Your plan and invalidate simulation results.
- Edits preserve a solved snapshot and select Check my plan; direct withdrawal edits use dollars. Cash edits reallocate total assets. FI-target edits update FI withdrawals at the chosen rate. Original cash-years input becomes its explicit dollar amount.
- Verified 115 automated tests, build and syntax; browser-tested shared edits. Simulation mechanics unchanged.

## Input section headings (20261014-10)
- Risk FI withdrawals now has its own heading after Cash reserve. Starting-point framing describes investments only. Cash entry still supports dollars or years of withdrawals; calculations unchanged.

## Grouped inputs and plan summary (20261014-11)
- Main calculator inputs are six distinct cards, two columns on desktop and one on mobile. Cash and Risk FI withdrawals are separate sections; results remain below inputs.
- Your plan at a glance adds starting total assets/investments, annual and monthly withdrawal dollars, timeline or starting/desired/projected ages, return/inflation assumptions, and withdrawal policy. Existing FI goal/result cards stay prominent.
- Verified syntax/build, section contents, age-mode summary and mobile single-column layout without horizontal overflow. Financial calculations unchanged.

## FI goal preview (20261014-12)
- Your FI goal now shows its calculated total-assets target in today’s dollars directly under annual FI withdrawals. Updates with withdrawals and FI rate; incomplete entries show a dash.

## Projection horizon controls (20261014-13)
- Moved years after FI out of the goal form into synchronized dropdowns on both projection graphs. Both graphs and the annual table share the selection; existing saved values remain available.

## Cash chart scale (20261014-14)
- Verified the orange cash path changes, but its growth occupied only ~2.4 SVG pixels against multi-million asset values in the inspected plan. Added a Cash reserve only view with its own scale and explained the combined scale. Calculations unchanged.

## Age-based chart axes (20261014-15)
- Plan, cash-only, withdrawal-rate, return-comparison and withdrawal-comparison graphs use attained ages in ticks and hover/keyboard details when Target age is selected. Years mode retains elapsed-year labels; calculations unchanged.

## Guardrails introduction (20261014-16)
- Replaced introductory copy with lower/upper probability guardrails and their reset target, emphasizing key terms in bold. Uses estimated probability and toward the target to avoid implying a guaranteed achievable reset.

- 20261014-17: removed the redundant guardrails question heading; introduction now leads directly.

- 20261014-18: styled the guardrails explanation as a prominent responsive introduction with larger title typography and purple bold emphasis.

- 20261014-19: shortened the connected-plan section heading to Your plan.

## Guardrails hierarchy and copy (20261014-20)
- Goal selector leads the page in a prominent box; retirement duration/ending balance are grouped with it. Removed repeated setup instructions and duplicate summaries; shared-plan behavior sits in a disclosure. Kept input meaning, probability interpretation and feasibility/result caveats.

- 20261014-21: explanation precedes the goal selector; reduced both text scale and goal-box padding for a quieter hierarchy.

## No minimum withdrawals (20261014-22)
- Removed minimum input for both goals; saved floors reset to zero and all UI simulation runs enforce zero. Result labels now describe years at zero withdrawals and targets unattainable even with zero. Engine retains generic floor support for existing tests.

## Question-aware scenario comparisons (20261014-23)
- Withdrawal comparison now follows the selected solve question: required investments, required nominal/real return, FI date/age, or on-track status. Withdrawal-solving mode compares its solved amount with lower/higher withdrawals and FI timelines.
- Return comparison solves withdrawals or investments, reports on-track status for Check my plan, and compares timelines for time/required-return questions. Required-return mode shows the calculated benchmark. Editing the comparison return no longer switches the main solve question.
- Each comparison freezes starting cash and the FI goal; infeasible cases remain visible as result cards but are excluded from graph series. Graphs use each solved scenario's actual inputs. Withdrawal comparisons follow Plan calculator in navigation.
- Verified 117 tests, build/syntax, browser investment/return/withdrawal solving and navigation order.

## Explicit comparison questions and target dates (20261014-24)
- All three comparison tools expose a compatible, independent What do you want to compare selector. Main solve mode supplies an initial compatible choice; selected comparison questions persist without changing the plan question.
- Added Compare target dates, using calendar dates or target ages according to the plan's timeline mode. Defaults are five years earlier, current target and five years later, bounded to future/100-year horizons. Users can solve withdrawals, investments or return for each date.
- Actual cash and real FI goal remain fixed across dates. Results show the future-dollar FI target for every date. Infeasible dates are reported independently. Comparison horizon overrides persist separately from the plan.
- FI-date comparison cards indicate whether the desired date is met. Verified 118 tests, syntax/build and browser checks of calendar/age mode, independent selector options and date results.

## Two-step guardrails (20261014-25)
- Step 1 solves confidence-specific starting withdrawals with actual entered investments/cash fixed; shows annual/monthly dollars, percentage of assets and achieved probability. Targets unreachable at zero are explicitly flagged.
- Step 2 starts each strategy at its solved amount, with the same outer markets and fixed/zero references. Both modes have zero minimum. Deadline success means holding the target at the deadline, not an earlier touch.
- Starting assumptions label calculated source timelines, investments and returns; editable deadline remains connected. Main-plan withdrawals are explicitly excluded from initial solutions. Age metadata now labels guardrail time charts.
- Custom historical annual volatility uses a positive gross-return power transform calibrated to the full-source arithmetic mean/stddev, preserving sampled indices and paired inflation. Historical variability is default; custom transformations and U.S.-only limitations are visibly disclosed.
- Added chance of any cut/zero withdrawals, conditional zero durations and median bands. 121 tests passed. Synthetic 15-year custom-volatility run: 10k vs 25k success differences 0.078 and 0.184 percentage points; max independent probability discrepancy 2.95 points. This checks numerical stability, not forecasting validity.

## Guardrail numerical audit (20261014-26)
- Reproduced a false fractional probability in a deterministic one-year target test. Final-year total-assets/retirement decisions now evaluate independent sampled outcomes directly; zero-volatility parametric horizons use deterministic outcomes. Discrete confidence levels report achieved probability rather than claiming exact restoration.
- Kept initial cash in the probability grid when replenishment is off; aligned the outer exhaustion threshold with the forward model; zero-withdrawal summaries count actual payments, including unfunded years.
- Added independent nominal-ledger checks (200 path-years), terminal probability/solver and exhaustion regressions. Full suite: 126 tests; static build and browser simulation verified.
- A 100,000-path holdout on the synthetic $1.1m / $1.5m target / 10-year example gave 28.187% fixed-withdrawal success versus the initial 30% estimate. Zero withdrawals: 59.580% versus 64.119%. Earlier stochastic checkpoints still use an approximate finite-sample surface; this is not a certification of forecast accuracy. Before/after output saved in validation/guardrails-audit-20261014.json.

## Solve menu wording (20261017-1)
- Renamed Your question to Solve for; choices are Withdrawal amount, Investment needed, When will I reach Traditional FI?, and What return do I need?. Removed Check my plan from the selector.
- Existing explicit snapshots from saved plans/guardrail edits retain their inputs and show a choose-what-to-solve prompt instead of silently selecting a different calculation. Updated the connected-plan explanation and result labels.
- Verified all four solve choices in the browser, JavaScript syntax, static build and diff checks. Calculation engine unchanged.

## Responsive grouping and neutral surfaces (20261017-2)
- Reordered inputs: Solve for, FI goal, timeline, starting investments, Risk FI withdrawals, cash reserve, returns. Goal withdrawal amount precedes the rate; timeline has its own group. Desktop uses two columns after the full-width solve choice; mobile stacks groups.
- Replaced the individual plan-summary tiles with four labeled definition-list groups: assets, withdrawals, timeline and assumptions. Retained the key amounts, percentages, ages, dates and withdrawal policy. Combined strategy headline outcomes into a single panel.
- Neutral gray/white surfaces replace lavender fills; restrained purple accents remain. Increased mobile control sizes, stacked narrow fields and improved related-tool navigation.
- Verified plan, all three comparisons and guardrails at 320/390/768px with no page overflow; inspected populated 10k-path guardrail results at 390px, summary at 1280px, and dark-mode contrast. Syntax, static build and diff checks pass. Calculation engine unchanged.
