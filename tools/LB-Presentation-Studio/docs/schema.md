# JSON deck schema (V1)

- \`title\`: string.
- \`brand\`: "maillardhelp" or any other brand.
- \`status\`: "UNVERIFIED_DRAFT" for raw-import drafts.
- \`sources\`: [{id,title,url?,kind:"verified"|"internal"|"assumption",retrieved_at?}].
- \`slides\`: an ordered array of slide objects; every slide must have \`headline\` and \`type\`.

Supported \`type\` values:
- \`cover\`: headline, eyebrow?, subtitle?
- \`thesis\`: headline, statement, support?: string[]
- \`flow\`: headline, steps?: [{label,detail}], insight?
- \`comparison\`: headline, columns:string[], rows:string[][], insight?
- \`metrics\`: headline, metrics:[{label,value,sourceId? OR assumption:true}],note?
- \`chart\`: headline, labels:string[], values:number[],series?,sourceId?
- \`image\`: headline, image:local_file_path,caption? (photo is NOT vector-editable)
- \`sources\`: headline (auto-collect source entries)

## Evidence quality contract

No synthetic data, fake research citations, unsupported comparative superlatives, or invented availability claims. Every non-assumption metric needs a \`sourceId\` linking to \`sources\`. For user-provided informal estimates, set \`assumption:true\` and visibly state that it is an assumption. Automatically imported TXT/PDF/DOCX is NOT fact-checked.

For high-quality investor presentations use a **claim-evidence-implication** paragraph on each slide, and separate brand visual pages from investment analysis pages.
