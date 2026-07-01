### WBS: P1.B.1.1
:: SUMMARY
Kate specifies the values/ethical screening ruleset and exclusion criteria. This is the fund's own strategy IP; nobody can supply it for her.
:: DIRECTIVE
**Kate only — DATA.** These are the fund's proprietary strategy rules. This is the single most important differentiator for a Vatican-facing mandate, so Kate defines it herself and in detail.

**Actions**
1. Kate writes down the complete exclusion and inclusion logic: what is screened out (categories, thresholds, revenue-percentage triggers), what is required, and how edge cases resolve.
2. Anchor the ruleset to a recognized authority where possible. For a Catholic mandate, the natural reference point is the USCCB Socially Responsible Investment Guidelines; confirm which framework she is adopting and where she deviates or goes further.
3. Define the thresholds precisely (for example, a maximum percentage of revenue from an excluded activity before a name is dropped), because "explicit and testable" is what makes this survive institutional diligence.
4. Note how the rules handle derivatives, funds, and indirect exposure, not just direct equity holdings.

**Deliverable:** Kate's raw but complete screening logic, enough for someone else to codify without guessing.

**Done when:** the full ruleset exists in Kate's own words, with concrete thresholds, ready to be formalized at P1.B.1.2.

> Confirm the exact reference framework with Kate. Do not assume USCCB, a diocesan variant, or a bespoke ruleset; the choice is hers and it must be stated, not inferred.

### WBS: P1.B.1.2
:: SUMMARY
Codify Kate's rules into a written screening methodology document. Turn her logic into a formal, auditable methodology.
:: DIRECTIVE
Convert the raw ruleset from P1.B.1.1 into a document that a data provider, an auditor, and a gatekeeper can all read and apply identically.

**Actions**
1. Structure the methodology: purpose and reference framework, screening universe, exclusion categories with exact thresholds, inclusion criteria, treatment of indirect exposure, exception and override process, and review cadence.
2. Write it so it is deterministic: two analysts applying it to the same portfolio must reach the same result. Remove any subjective language that is not backed by a rule.
3. Include a version/change-control block. This methodology will be referenced in the IMA, the DDQ, and the Vatican proposal, so version drift must be controlled.
4. Have counsel or compliance sanity-check that the written methodology matches the marketing claims the fund will make.

**Deliverable:** a versioned Screening Methodology document.

**Done when:** the document fully and unambiguously captures Kate's ruleset and is ready for her canonical sign-off at P1.B.1.4.

### WBS: P1.B.1.3
:: SUMMARY
Build the screening data pipeline or license the vendor data feeds that power the screen. This is the operational engine behind the methodology.
:: DIRECTIVE
The methodology is only as good as the data it runs on. Secure reliable, licensed data and wire it into a repeatable screening process.

**Actions**
1. Identify the data needed to apply every rule (revenue-by-segment, controversy flags, product-involvement data, etc.) and match it to vendors that license it (for example ISS, MSCI, Sustainalytics, or a specialist Catholic-values screening provider). Confirm the exact vendor with Kate; capability and cost vary widely.
2. Negotiate and license the feed, confirming redistribution rights sufficient for client and gatekeeper reporting.
3. Build the pipeline that ingests the data, applies the methodology rules, and outputs a pass/fail plus reason per holding. Automate it so quarterly screens (P1.B.2) are push-button.
4. Validate the pipeline against a hand-screened sample to prove it applies the rules correctly.

**Deliverable:** a licensed, tested screening pipeline that produces holding-level results with reasons.

**Done when:** the pipeline reproduces the methodology on a known sample and is ready for the first live screen.

### WBS: P1.B.1.4
:: SUMMARY
Kate validates and signs off on the methodology as canonical. This freezes the official version everything else references.
:: DIRECTIVE
**Kate only — DATA.** She is declaring the official, authoritative version of the fund's screening rules. Downstream documents will cite it.

**Actions**
1. Kate reviews the codified methodology (P1.B.1.2) and the pipeline validation (P1.B.1.3) together, confirming the automated results match her intent on real names.
2. She resolves any discrepancy between what she meant and what the pipeline does. The pipeline conforms to her, not the reverse.
3. She marks the methodology version as canonical and signs off.

**Done when:** a specific methodology version is declared canonical by Kate, locking the reference for the IMA, DDQ, benchmark mapping, and Vatican proposal.

### WBS: P1.B.2.1
:: SUMMARY
Run the first quarterly portfolio screen against the canonical methodology. This is the first live proof the process works on the real book.
:: DIRECTIVE
Execute the methodology against the actual portfolio and generate the official screening record for the period.

**Actions**
1. Run the canonical methodology (P1.B.1.4) through the validated pipeline against current holdings.
2. Produce a holding-by-holding result: pass, fail, or flagged, each with the triggering rule and the underlying data point.
3. Timestamp and archive the run as the period's screening record. This becomes part of the audit and proof stack.

**Deliverable:** a complete first-quarter screening result set, archived.

**Done when:** every current holding has a recorded screen result tied to the canonical methodology version.

### WBS: P1.B.2.2
:: SUMMARY
Produce an exceptions report and remediation list from the screen. Identify anything that fails and how it gets fixed.
:: DIRECTIVE
Turn the raw screen into an actionable compliance document.

**Actions**
1. Extract every fail and flag from P1.B.2.1 into an exceptions report, each with the rule breached, the data, and materiality.
2. For each exception, propose remediation: divest, reduce below threshold, seek an approved override, or reclassify if the data is wrong.
3. Assign an owner and a deadline to each remediation item, and note trade-related constraints (liquidity, tax) for Kate's decision.

**Deliverable:** an exceptions report plus a remediation list with owners and deadlines.

**Done when:** every exception has a documented remediation path ready for Kate's review at P1.B.2.3.

### WBS: P1.B.2.3
:: SUMMARY
Kate reviews the holdings-level screen output and confirms compliance. She owns the sign-off that the book is clean.
:: DIRECTIVE
**Kate only — DATA.** She is attesting that the portfolio conforms to the values mandate. This attestation underpins every values claim the fund makes.

**Actions**
1. Kate reviews the screen results (P1.B.2.1) and the exceptions/remediation list (P1.B.2.2).
2. She decides each exception: approve remediation, authorize an override with documented rationale, or direct a trade.
3. She confirms in writing that, after remediation, the portfolio complies with the canonical methodology for the period.

**Done when:** Kate has signed off on the period's compliance, with every exception resolved or explicitly overridden with rationale.

### WBS: P1.B.3.1
:: SUMMARY
Obtain the relevant Catholic-values / IOR benchmark data so portfolio performance can be measured against the right yardstick.
:: DIRECTIVE
Institutional buyers judge performance relative to a benchmark. Pick and license the one that fits a Catholic-values mandate.

**Actions**
1. Identify candidate benchmarks aligned to the mandate, such as a Catholic Values or faith-based index family (for example within Morningstar Indexes) or an agreed custom blend. Confirm the specific index with Kate.
2. License the benchmark constituent and returns data with rights sufficient for client and gatekeeper reporting.
3. Confirm the benchmark's own screening logic is compatible with the fund's, so relative performance is an apples-to-apples comparison.

**Deliverable:** licensed benchmark data and a documented rationale for the choice.

**Done when:** the benchmark is selected, licensed, and defensible in diligence.

### WBS: P1.B.3.2
:: SUMMARY
Map the portfolio to the benchmark and compute tracking and attribution. Show how the fund performs relative to its yardstick and why.
:: DIRECTIVE
Produce the relative-performance analytics institutional allocators expect.

**Actions**
1. Align the portfolio and benchmark on common dates and a consistent return methodology.
2. Compute tracking error, active return, and standard risk statistics over the available history.
3. Run attribution to explain relative performance by sector, factor, or security, so the story behind the numbers is ready for diligence questions.
4. Build this as a repeatable report, since it will be updated each period and reused in the DDQ and proposal.

**Deliverable:** a benchmark-relative performance and attribution report.

**Done when:** tracking and attribution are computed, reproducible, and ready for Kate's review.

### WBS: P1.B.3.3
:: SUMMARY
Kate confirms the benchmark selection and reviews relative performance. She owns the benchmark story the fund will tell.
:: DIRECTIVE
**Kate only — DATA.** The benchmark and the relative-performance narrative are strategic representations she must stand behind.

**Actions**
1. Kate reviews the benchmark choice (P1.B.3.1) and the tracking/attribution results (P1.B.3.2).
2. She confirms the benchmark is the right comparator for how she runs the strategy and for how the Vatican buyer will judge it.
3. She approves the relative-performance narrative that will appear in marketing and diligence materials.

**Done when:** Kate has confirmed the benchmark and signed off on the relative-performance story.
