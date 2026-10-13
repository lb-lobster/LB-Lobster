# LB Presentation Studio V1.0

**一句话：把有来源、有观点的结构化内容制作成真正可编辑的 PowerPoint。**

本项目是 **离线优先、低调用成本、可拆卸模块**。不会把用户商业资料推送到 GitHub。核心导出引擎使用 PptxGenJS；视觉生成能力使用原项目的独立 Codex Skills，**不是**未经验证的“一键全自动顶级设计师”。

## 现有实现与边界

✅ 结构化 JSON → 原生 PowerPoint 文本、卡片、流程、表格和数据图；不以整页截图冒充可编辑 PPT。  
✅ 支持 Markdown、TXT、DOCX、可复制文本 PDF 的保守提纲导入。  
✅ 结构审核（文本/原生形状/图片数量）、来源检查、可选 LibreOffice PDF 导出。  
✅ 视觉/策略 Skill 可以逐个调用或按需安装，主引擎不依赖任何付费 API。  
⚠️ 文档自动导入只是**草稿重排**，不是自动做麦肯锡级分析；完整商业论证请先让 Codex 执行 strategy Skill。  
⚠️ 当前无自动图片生成、智能 OCR、幻灯片逐页视觉理解或 Mac 系统级已安装保证；必须对交付物人工核对。  
⚠️ 外部图像 Skill 的输出主要为图片；PptxGenJS 只能保证文本、基础图形、表格、图表原生可编辑。

## Mac 快速开始

在 Mac 的“终端”输入（开发分支；合并后改 main）：

~~~bash
git clone -b feat/lb-presentation-studio-v1 https://github.com/lb-lobster/LB-Lobster.git
cd LB-Lobster/tools/LB-Presentation-Studio
npm install
npm run doctor
npm run demo
~~~

生成结果： \`dist/maillardhelp-demo.pptx\`，对应的 \`.report.json\` 会记录结构审核结果。

也可以在 Finder 里双击 \`scripts/install_macos.command\`（首次运行可能需要右键→打开）。脚本将检查 Node、安装依赖、并在桌面放一个双击入口。Mac 未授权的程序不能代替用户自动安装。

## 统一生成

~~~bash
node bin/lbp.mjs create examples/maillardhelp-demo.json --out dist/brand.pptx --qc
node bin/lbp.mjs create /path/to/input.docx --out dist/draft.pptx
node bin/lbp.mjs create /path/to/input.pdf --out dist/draft.pptx --pdf --qc
node bin/lbp.mjs audit dist/brand.pptx
~~~

DOCX 需要 \`mammoth\`（随 npm install 安装）。PDF 提取需要 \`brew install poppler\`。输出 PDF 需要 \`brew install --cask libreoffice\`；没有则只输出 PPTX，不会谎报 PDF 成功。

## 模块独立调用（可抽出去单独作为一个 Git 使用）

**核心工具一套，Skill 插件各自独立。** 目录 \`skills/{strategy,visual-director,pptx-builder}/SKILL.md\` 均可以单独复制到 \`~/.codex/skills/<name>/\`，并在 Codex 用同名 Skill 发指令。

~~~bash
node bin/lbp.mjs skill strategy
node bin/lbp.mjs skill visual-director
node bin/lbp.mjs skill pptx-builder
node bin/lbp.mjs providers
node bin/lbp.mjs install-provider mono-color
node bin/lbp.mjs install-provider gc-minimal-zine-poster
node bin/lbp.mjs install-provider gpt-image2-ppt-skills
node bin/lbp.mjs skill GordenSuperPPTSkills
~~~

外部 Skill 均通过它们**独立 GitHub 仓库**安装到 Codex，默认不打包复制第三方代码。可在 Codex 单独调用，例如“使用 mono-color skill，为这张产品照片制作双色印刷海报，保持产品外观不变”。Gorden 的仓库目前没有标准 SPDX 许可证标识：**仅保留链接和手动安装说明，不自动复制仓库**。

## 业务工作流

1. **strategy**：确定一句话商业模式、每页一个论点，标注每一项数据的出处/时效/性质。
2. **visual-director**：判定页面是“数据解释”还是“品牌情绪”，决定是否调用海报/图片 Skill。
3. **pptx-builder**：通过结构化 JSON 生成原生 PPTX，校验对象。
4. **review**：可选 PDF 回渲染；必须由实际审稿人确认数字、排版、文字溢出、论据有效性。

### 公开仓库的隐私提醒

不要将 MaillardHelp 的原始财务、客户数据、合同或未经公开的策略放在这里。示例 \`maillardhelp-demo.json\` 仅演示版式与结构，**不是未经验证的投资建议或真实经营预测**。

## 单独提取为独立 Git 仓库

Git subtree 能使这个目录携带自己的历史。仓库合并后：

~~~bash
git subtree split --prefix=tools/LB-Presentation-Studio -b presentation-standalone
# 在你新建的私有仓库中推送 presentation-standalone:main
~~~

该方案暂存在 LB-Lobster 的**独立开发分支**中，不涉及私人量化仓库，也未自动合并到主分支。
