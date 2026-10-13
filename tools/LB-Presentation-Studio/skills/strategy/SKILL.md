---
name: lb-ppt-strategy
description: Convert commercial documents into a concise, evidence-labeled investor presentation outline with one claim per slide.
---
# Strategy — argument first, design second

Before writing a page:
1. Extract the **one-sentence business model**, business/consumer/profit loops, and product differentiation.
2. Assess premises: pre-existing assets, fixed costs, marginal costs, channels, capacity, break-even; mark unknowns.
3. Use "claim → evidence → implication" to determine whether the proposed strategy is supported.
4. Distinguish \`FACT\` from \`ASSUMPTION\` and \`FORECAST\`. Cite publication, as-of date, geography and precise metric.
5. Rewrite each slide heading as a result-oriented statement; **one slide, one point**.
6. For MaillardHelp: focus on leveraging existing bakery space/equipment, core SKUs, online cake bookings, creators and brand partner economics, but never invent transaction data or market share.
7. Write valid JSON per docs/schema.md. Do NOT silently infer figures or company performance.
8. Run \`node bin/lbp.mjs create outline.json --out ... --qc\`.
