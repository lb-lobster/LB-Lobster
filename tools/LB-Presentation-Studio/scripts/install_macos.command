#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
if ! command -v node >/dev/null 2>&1; then
  echo "Please install Node.js 20+ first: https://nodejs.org/"; read -rp "Press Enter to close..."; exit 1
fi
echo "Installing local dependencies (no paid API required)..."
npm install
echo "Checking system..."
node bin/lbp.mjs doctor
desktop="$HOME/Desktop"
launcher="$desktop/LB Presentation Studio.command"
mkdir -p "$desktop"
printf '#!/bin/bash\ncd %q\nnode bin/lbp.mjs create examples/maillardhelp-demo.json --out dist/maillardhelp-demo.pptx --qc\nopen dist/maillardhelp-demo.pptx\nread -rp "Done. Press Enter to close..." \n' "$(pwd)" > "$launcher"
chmod +x "$launcher"
echo "Desktop launcher: $launcher"
echo "Double-click it to generate the editable example PPTX."
read -rp "Press Enter to close..."
