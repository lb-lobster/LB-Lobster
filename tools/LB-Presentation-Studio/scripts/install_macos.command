#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "请先安装 Node.js 20+：https://nodejs.org/"
  read -rp "按回车退出..."
  exit 1
fi

echo "安装 PPT 生成依赖（无需付费 API）..."
npm install --no-audit --no-fund
node bin/lbp.mjs doctor

# Install the independent, namespaced local Codex skills.
skills_dir="${CODEX_HOME:-$HOME/.codex}/skills"
mkdir -p "$skills_dir"
for pair in "strategy:lb-ppt-strategy" "visual-director:lb-visual-director" "pptx-builder:lb-pptx-builder"; do
  source_name="${pair%%:*}"
  installed_name="${pair##*:}"
  if [[ ! -e "$skills_dir/$installed_name" ]]; then
    cp -R "skills/$source_name" "$skills_dir/$installed_name"
    echo "已安装独立 Skill：$installed_name"
  else
    echo "已存在 Skill（未覆盖）：$installed_name"
  fi
done

echo "外部视觉 Skill 按需安装（可能依赖图像模型/API）。"
read -rp "是否安装 mono-color、gc-minimal-zine-poster 与 gpt-image2-ppt-skills？[y/N] " answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
  for name in mono-color gc-minimal-zine-poster gpt-image2-ppt-skills; do
    node bin/lbp.mjs install-provider "$name" || echo "请检查 $name 的安装情况"
  done
fi

desktop="$HOME/Desktop"
launcher="$desktop/LB Presentation Studio.command"
mkdir -p "$desktop"
{
  echo '#!/bin/bash'
  printf 'cd %q\n' "$(pwd)"
  cat <<'LAUNCHER'
echo "LB Presentation Studio：选择 Word / PDF / Markdown / JSON 文件。"
selected="$(osascript -e 'POSIX path of (choose file with prompt "请选择要制作成 PPT 的材料")' 2>/dev/null)" || exit 0
[[ -n "$selected" ]] || exit 0
mkdir -p "$HOME/Desktop/LB Presentation Output"
base="${selected##*/}"
stem="${base%.*}"
output="$HOME/Desktop/LB Presentation Output/${stem}-editable.pptx"
node bin/lbp.mjs create "$selected" --out "$output" --qc
code=$?
if [[ "$code" != 0 ]]; then
  echo "制作失败；Word/PDF 自动导入只是草稿，PDF 还需要 Poppler。"
  read -rp "按回车关闭..."
  exit "$code"
fi
open "$output"
echo "PPTX 已生成：$output"
echo "仅为原生可编辑草稿，仍需核对逻辑、数据、字号和版式。"
read -rp "按回车关闭..."
LAUNCHER
} > "$launcher"
chmod +x "$launcher"

echo "已创建桌面入口：$launcher"
echo "重启 Codex 后可以单独调用 lb-ppt-strategy、lb-visual-director、lb-pptx-builder。"
read -rp "按回车关闭..."
