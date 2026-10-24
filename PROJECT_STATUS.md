# Risk FI Calculator — current status

Updated October 21, 2026. Standalone web calculator, separate from Excerpt Tracker iOS.

- Repository: `ggiiirr-beep/risk-fi-calculator`; publication branch `main`. GitHub Pages serves the repository root at https://ggiiirr-beep.github.io/risk-fi-calculator/.
- Dependency-free JavaScript. Commands: `npm start`, `npm test`, `npm run build`.
- Current navigation: Your numbers, Traditional FI, RiskFi (results and comparisons), Risk-Based Guardrails, GapFi; Help is a utility. See the latest dated entries below for current behavior. Earlier entries describe prior releases.
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

## Open guardrail dashboard (20261017-3)
- Replaced every guardrail select with accessible visible radio choices, including goal, markets, schedules, simulation counts and graph views. Selected/disabled states remain explicit and keyboard accessible.
- Removed collapsible sections: target preview, schedule comparison, result charts and metrics remain visible. Main charts precede the detailed metrics; condensed technical text links to the documented methodology.
- Renamed the primary action Run Simulations and placed simulation settings before the calculation steps. Shortened plan-sharing and schedule explanations.
- Browser-verified market/volatility and schedule controls, a 10k-path comparison, graph/path/balance switches and four-schedule comparison. No selects or accordions remain in guardrails. Verified 320/390px fit and desktop layout; syntax/build/diff checks pass. Engine unchanged.

## Focused two-scenario guardrails (20261017-4)
- Four-step flow: Risk FI/Traditional FI and assumptions; 10–90% starting confidence table; two editable scenarios; observed simulation results. Preset A/B buttons retain each scenario's rail spacing and select its reset/start target. Phone-sized confidence rows become labeled cards.
- Optional per-scenario ramp switch reveals ending target and steady/earlier/later timing. New defaults remain fixed; saved ramps persist. Removed standalone schedule comparison, sweep and modeling-settings clutter from the visible flow.
- Two market choices: unadjusted U.S. history or custom parametric return/inflation/volatility. Historical mode explicitly ignores plan mean/inflation, disables old custom-history transforms, and hides irrelevant inputs. Prior centered-bootstrap selections migrate to the visibly labeled historical choice.
- Results emphasize annual withdrawal dollars/rate, actual goal success, cumulative withdrawals, cuts, lowest withdrawals and zero years. Withdrawal/asset charts and individual annual decisions remain. Unattainable targets remain explicit.
- Dashboard engine calls skip the unused sweep; the existing engine API retains it by default. 126 tests passed plus updated focused tests covering 10–90% rows and two-scenario output. Browser-tested both goal/model modes, presets, ramps, paths and completed 10k comparisons; checked 320/390px layout, desktop, syntax/build/diff.

## GapFi and shared-number navigation (20261018-1)
- Navigation separates Your numbers, RiskFi results/comparisons, Risk-Based Guardrails, and GapFi; Help remains a utility. Guardrail sharing remains connected.
- GapFi supports editable withdrawal/break-even/contribution periods, whole-year durations and a final Until FI period. Add/remove and amounts persist locally. Uses solved shared assets/returns and fixed starting cash; replaces the RiskFi withdrawal policy with its periods. No GapFi guardrails.
- Independent monthly real-dollar engine includes cash in the FI goal, cash yield/strategy/minimum, inflation-adjusted or fixed nominal flows, exact monthly flow totals, monthly arrival and a 100-year limit. Stops on unfunded withdrawals; period changes appear on chart, age mode and future dollars supported, final partial year visible.
- Verification: existing 126 tests plus four initial GapFi tests passed (130 total); fifth regression verifies actual nominal monthly flow totals. Focused tests/build/syntax/diff pass. Browser verified period add/remove/amount edits, persistence on reload, separate RiskFi results, connected guardrails, and 320/390px layouts without horizontal overflow.

## Editable shared cards (20261018-2)
- Your numbers now has four cards: assets, withdrawals/FI goal, timeline, return assumptions. Its short framing is “Enter your numbers. Leave blank what you want to solve for.” All entries stay editable; Solve for lives above RiskFi's cards and results.
- RiskFi and GapFi share editable starting-number/assumption cards backed by the same persisted plan. RiskFi labels its unknown as calculated; percentage withdrawals retain their rule when edited. GapFi labels calculated source assets/returns and materializes a solved snapshot if the user overrides that unknown.
- Guardrails retains its existing connected editing behavior in two matching cards, with goal choice first. Its historical-return distinction and tool-specific controls remain separate.
- Verified 131 automated tests, static build/syntax/diff checks; browser tested blank solved withdrawal/timeline, RiskFi→GapFi and GapFi→Your numbers edits, guardrails→Your numbers edits, saved values after reload, and 390px layouts with no horizontal overflow. Inputs and results remain separate.

## Baseline facts and Traditional FI (20261020-1)
- Your numbers holds investments, dollar cash, current age/display preference, Traditional FI goal/rate, and returns/inflation. RiskFi withdrawals, percentage basis, inflation rule, cash-use strategy/minimum and timeline now live on RiskFi. Existing cash-years entries convert once to their effective dollar reserve.
- Added Traditional FI: solve arrival from annual contributions or required contributions for a chosen whole-year deadline. Monthly end-of-month contributions, real/future dollar views, age axes, chart and annual/final-partial-year ledger. Deadline solutions hold the FI target at the deadline; no negative contributions.
- `baselinePlan` supplies shared facts without RiskFi's solve result, withdrawals, deadline, cash-use or inflation rules. GapFi owns its inflation/cash-use choices. Guardrails preserves its own deadline and withdrawal inflation rule across baseline edits; no longer imports a RiskFi-computed deadline or asset amount. Shared asset/goal/return edits still propagate across tabs.
- New pure contribution solver reuses the monthly projection engine with an explicit option to continue through the deadline. Tests cover known-value contributions, cash, zero contributions, inflation, invalid values, and scenario isolation. All 136 tests pass; syntax/build/diff checks pass.
- Browser verified both Traditional FI solves, RiskFi/Traditional FI/guardrail deadline isolation, shared baseline edits, persistence, and 390px baseline/Traditional FI layout without overflow.

## GapFi amount solves and model explanations (20261020-2)
- GapFi now solves time to FI, maximum annual withdrawals in one chosen withdrawal period, or minimum annual contributions in one chosen contribution period. Amount solves use a whole-year deadline, preserve other periods and saved unknown entries, fund all intervening withdrawals, and require assets at the deadline (not merely an earlier crossing). Infeasible cases and periods starting after the deadline are explicit.
- Target captions above Traditional FI and GapFi charts follow the shared today/future-dollar view, with a date on future-dollar targets. RiskFi's existing result-target conversion is retained.
- Cash amounts/yields remain global; cash-use rules remain scenario-specific. Fixed a duplicate GapFi cash amount/strategy element ID that prevented reliable strategy changes.
- Added a linked data/method page explaining the bundled 1928–2025 NYU source, paired consecutive-year block sampling, custom volatility, cash mechanics, distinct success measures, and limitations. Added a short educational/hypothetical-results footer disclaimer.
- Added known-answer, infeasibility, phase isolation and inflation tests for the new solver. Browser checked all three GapFi modes, both dollar views, Traditional FI captions, disabled unknown entry, and 320/390px layouts with no overflow or duplicate IDs. Static build, syntax and diff checks pass; all 140 automated tests pass.


## Shared planning additions (20261021-2)
- Retained RiskFi Calculator branding with Financial independence planning tools subtitle. Top navigation is Your numbers / Calculators / Risk-based guardrails; calculators are Traditional FI, Coast FI, Risk FI and Gap FI. Help remains separate.
- Shared asset rows support stocks, bonds and cash, with custom names, balances and expected nominal returns. Existing balances migrate to market/cash rows. Basic projections grow rows individually; investment flows are proportional. Aggregate cards remain bidirectionally editable, preserving asset proportions.
- Optional Future income & one-time changes supports recurring income, additions and expenses, age/year timing, inflation adjustment and include toggles. Surplus income enters cash; additions enter investments. All calculators and guardrail forward estimates account for the events. The FI target remains unchanged.
- Coast FI solves required investments now, the date regular contributions can stop, or FI arrival without regular contributions. Monthly projections include shared scheduled events.
- Historical guardrails pair U.S. stocks, 10-year U.S. Treasury total returns and inflation by year; stock/bond weights rebalance annually. Parametric mode models the combined investments. With future events, independent direct forward samples replace the scale-free lookup, preserving event timing and sampled inflation; this can take several minutes for long horizons.
- Verification: 150 tests including new independent ledger, bond pairing, Coast, immediate-expense and income-surplus checks; production static build. A 10,000-path, five-year scheduled stock/bond comparison completed in 5.6 seconds, with maximum independent calibration discrepancy 0.93 percentage points. Timing/results are fixture-specific. Desktop and 390px browser checks cover adding assets/events, shared totals, Coast results and starting withdrawal probabilities. No horizontal page overflow on the mobile inputs.
- Source/data and scheduled-model limitations updated in simulation-method.html and GUARDRAIL_METHOD.md. Existing GitHub Pages hosting retained; no podcast domain was supplied.

- Follow-up boundary check: scheduled income may support a gross planned amount above current assets. The solver expands its search bracket; actual net withdrawals remain limited by the ledger.

## Direct calculator tabs (20261021-3)
- Your numbers remains first, followed by Risk FI, Gap FI, Coast FI, Traditional FI, Risk-based guardrails, and Help. Removed the intermediary calculator menu and duplicate subnavigation.
- Future-change cards use their entered name, updating while typing; blank names use Recurring income, One-time addition, or One-time expense.
- UI-only change; syntax/static build and static navigation/order/binding checks pass. Local browser preview was blocked by browser security, so visual/mobile verification was not completed for this revision. Financial engines unchanged.
- Repeated the five calculator/guardrail options at the bottom of Your numbers, in matching order.

## Explanatory visuals (20261021-4)
- Plan timelines show withdrawal/contribution/coast phases, future event starts/ends and first FI arrival, with shared age/year labels. Included in Risk FI, Gap FI, Coast FI and Traditional FI results.
- Funding bars separate net portfolio withdrawals, income used, surplus deposited into cash, and unfunded amounts. They follow the dollar display; monthly income attribution is accumulated before annual aggregation so late income cannot hide earlier withdrawals. Empty funding charts are omitted.
- Individual guardrail paths now show aligned withdrawal and asset charts, reset markers and plain-language probability/dollar explanations for each adjustment. Removed the duplicate annual decision table.
- FI arrival histograms count first funded annual target crossings across every outer scenario, including already-at-FI and never-reached categories. Explicitly separate first arrival from deadline success. Retirement mode does not show an FI-arrival distribution.
- Regression checks cover income accounting, nominal display, safe timeline labels and first-touch versus deadline failure. Build and syntax validation; browser verification remains unavailable because the local preview was blocked by browser security.

## Shared comparison tool (20261021-5)
- Risk FI, Gap FI, Coast FI and Traditional FI each expose Calculator / Compare scenarios. Replaces Risk FI's three separate comparison links; guardrail comparisons remain separate.
- Two or three independent temporary drafts start from the current calculator, with one question shared across all scenarios. Return changes preserve asset mix. Shared cash, target, inflation, future events and scenario policies are retained. Reset refreshes from the current calculator; edits never modify the shared plan.
- Risk FI compares withdrawals, investments, returns and deadlines with its existing withdrawal basis. Gap FI compares phase lengths/amounts and solves one selected phase. Traditional FI compares contribution/date/return assumptions. Coast FI compares retirement horizons, contributions, and chosen contribution stop dates.
- Results use a common configurable chart horizon and dollar display. Infeasible scenarios are identified separately. Projections continue scenario policies without an automatic post-FI retirement switch, disclosed beside the chart.
- Verification: new engine tests cover source immutability, solved-phase isolation, all Coast questions, percentage policies, invalid data, scheduled cash income and nominal chart values. Static build and syntax checks; browser preview remains blocked by the previously reported browser security restriction.

## Compare paths tab (20261021-6)
- Added Compare paths before Risk-based guardrails in both main navigation and the bottom of Your numbers.
- Compares Risk FI, Gap FI, Coast FI and Traditional FI on one question: FI arrival. Starting assets, return assumptions, inflation, future changes and the target remain shared. Path-specific cash/withdrawal/contribution policies are retained.
- Temporary editable rule cards start from the calculator settings (using solved withdrawal/contribution amounts where available). Reset reloads the rules; Your numbers remains connected.
- Results show FI date/age, regular contributions and actual portfolio withdrawals through each path’s own arrival, plus a common chart horizon and dollar display. Contributions exclude scheduled additions and surplus income; withdrawals include one-time expenses. Post-FI chart continuation is explicitly not a retirement model.
- Tests cover equivalent paths, common starting amounts, partial-year totals, source isolation, future changes and infeasibility. Syntax/build verification; browser preview remains unavailable under the previously reported browser restriction.

## Two-path selection (20261021-7)
- Compare paths now has two calculator dropdowns, defaulting to Risk FI and Gap FI. Each excludes the other selected calculator. Only the chosen pair's editable rules, results and chart series appear; switching preserves temporary rule drafts.
- Projection engine evaluates only the selected paths, in selection order. Shared baseline and financial calculations unchanged.
- Focused comparison regression tests, syntax and static build passed. Visual browser verification remains blocked by the previously reported browser restriction.

## Podcast homepage and Fi tool navigation (20261023-1)
- The GitHub Pages root now opens From Paychecks to Purpose. The existing calculator is calculator.html on the same origin, retaining browser-saved numbers. Home / Fi Calculator navigation is visible on both pages; methodology returns to the calculator.
- Homepage uses turquoise/blue/gold, a generated transparent illustration based on the supplied cover, and literal **** markers around draft introduction text. Real podcast/host names, episode titles and functional labels are not draft prose.
- Latest six episodes load from the verified public Anchor RSS feed with CORS support. Native audio players are click-to-play and only one plays at a time. A dated local snapshot is shown with an explicit notice if the live request fails. No proxy, account, tracking integration or scheduled job added.
- Calculator tools have consistent SVG app-style icon buttons and individual accent colors on neutral surfaces; mobile grid wraps. Financial calculations and storage keys unchanged.
- Full existing tests, syntax/build and local-link/asset checks run for this revision. Visual browser QA remains blocked by the previously reported browser security restriction; no visual/mobile acceptance claimed.

## Podcast banner refinement (20261023-2)
- Shortened the homepage hero into a horizontal banner with a smaller heading and right-aligned artwork, including a compact side-by-side phone layout. Removed the redundant bottom title strip.
- Changed the podcast page background to pale blue, retaining light episode cards and the turquoise hero. Calculator appearance unaffected.
- Static build and diff checks passed. Browser visual verification remains blocked by the previously reported restriction.
