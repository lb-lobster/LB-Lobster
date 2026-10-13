#!/usr/bin/env node
/**
 * LB Presentation Studio V1.
 * Offline-first; NEVER fabricates investment research or verified claims.
 * All content/metrics/source fields come from input. PPT objects remain editable.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
import PptxGenJS from 'pptxgenjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const W = 13.333, H = 7.5;
const PROVIDERS = {
  'gpt-image2-ppt-skills': {repo:'https://github.com/JuneYaooo/gpt-image2-ppt-skills',license:'Apache-2.0',use:'Art direction / optional image-layer PPT generation',installedName:'gpt-image2-ppt-skills'},
  'mono-color': {repo:'https://github.com/yanliudesign/mono-color-skill',license:'MIT',use:'One/two-ink poster & editorial image',installedName:'mono-color'},
  'gc-minimal-zine-poster': {repo:'https://github.com/LiamGvchi/gc-minimal-zine-poster',license:'MIT',use:'Minimal zine/editorial poster',installedName:'gc-minimal-zine-poster'},
  'GordenSuperPPTSkills': {repo:'https://github.com/GordenSun/GordenSuperPPTSkills',license:'Custom/verify upstream terms',use:'Optional high-cost image-to-editable handoff; no code vendored',installedName:'GordenSuperPPTSkills'}
};
const cmd = process.argv[2] || 'help';
const args = process.argv.slice(3);
function option(name, fallback=null) { const i=args.indexOf('--'+name); return i>=0 ? args[i+1] : fallback; }
function flag(name) { return args.includes('--'+name); }
function die(message) { console.error('ERROR: '+message); process.exitCode=1; }
function exists(command) { return spawnSync('sh',['-c','command -v '+command+' >/dev/null 2>&1']).status===0; }
function text(s) { return String(s??'').replace(/\s+/g,' ').trim(); }
function title(t,max=56) { return text(t).slice(0,max); }
function color(s) { return String(s).replace('#','').toUpperCase(); }

function plainToDeck(body,name) {
  const lines=body.replace(/\r\n/g,'\n').split('\n');
  const sections=[]; let current=null;
  for(const line of lines){
    const m=line.match(/^#{1,3}\s+(.+)/);
    if(m){ if(current) sections.push(current);current={headline:m[1],content:[]}; }
    else if(line.trim()){ if(!current)current={headline:'核心观点',content:[]}; current.content.push(line.trim()); }
  }
  if(current)sections.push(current);
  const slides=[{type:'cover',headline:name,subtitle:'自动排版草稿｜文字和图形可编辑'}];
  for(const s of sections.slice(0,35)){
    const all=s.content.join(' ');
    const parts=all.match(/[^。！？.!?]+[。！？.!?]?/g)||[all];
    slides.push({type:'thesis',headline:title(s.headline,33),statement:title(parts[0]||'',100),support:parts.slice(1,5).map(t=>title(t,100))});
  }
  if(slides.length===1)slides.push({type:'thesis',headline:'内容概览',statement:title(body,160)});
  return {title:name,brand:'maillardhelp',status:'UNVERIFIED_DRAFT',slides,sources:[]};
}
async function inputDeck(file){
  const ext=path.extname(file).toLowerCase(), abs=path.resolve(file);
  if(!fs.existsSync(abs))throw new Error('Input not found: '+abs);
  if(ext==='.json')return JSON.parse(fs.readFileSync(abs,'utf8'));
  if(ext==='.md'||ext==='.markdown'||ext==='.txt')return plainToDeck(fs.readFileSync(abs,'utf8'),path.basename(file,ext));
  if(ext==='.docx'){
    const mammoth=await import('mammoth');
    const r=await mammoth.extractRawText({path:abs});
    return plainToDeck(r.value,path.basename(file,ext));
  }
  if(ext==='.pdf'){
    if(!exists('pdftotext'))throw new Error('PDF import requires poppler: brew install poppler');
    const r=spawnSync('pdftotext',['-layout',abs,'-'],{encoding:'utf8',maxBuffer:20*1024*1024});
    if(r.status!==0)throw new Error('pdftotext failed; scanned PDF needs manual transcription');
    if(!r.stdout.trim())throw new Error('No extractable text in PDF; scanned PDF/OCR not supported');
    return plainToDeck(r.stdout,path.basename(file,ext));
  }
  throw new Error('Use .json, .md, .txt, .docx, or text-based .pdf');
}
function validate(deck){
  const errs=[];
  if(!deck||!Array.isArray(deck.slides)||!deck.slides.length)errs.push('slides[] must contain >=1 page');
  const ids=new Set((deck.sources||[]).map(s=>s.id));
  for(const [i,s] of (deck.slides||[]).entries()){
    if(!s.headline)errs.push('Slide '+(i+1)+': missing headline');
    if(s.type==='metrics')for(const m of (s.metrics||[])){
      if(!m.assumption && !m.sourceId)errs.push('Slide '+(i+1)+': metric '+(m.label||'?')+' needs sourceId or assumption=true');
      if(m.sourceId && !ids.has(m.sourceId))errs.push('Slide '+(i+1)+': unknown sourceId '+m.sourceId);
    }
    if(s.type==='chart'&&(!Array.isArray(s.labels)||!Array.isArray(s.values)||s.labels.length!==s.values.length))
      errs.push('Slide '+(i+1)+': chart labels[] and values[] mismatch');
  }
  return errs;
}
function theme(deck){
  const isBrand=(deck.brand||'').toLowerCase()==='maillardhelp';
  return isBrand?{bg:'FAF8F4',ink:'21201E',accent:'A95237',muted:'716D68',line:'D9D2C9'}
    :{bg:'F7F9FC',ink:'172033',accent:'2351B5',muted:'5A6578',line:'DDE4ED'};
}
function tx(slide,content,x,y,w,h,opts={}){
  slide.addText(String(content||''),{x,y,w,h,fontFace:'Aptos',fontSize:opts.size||18,color:opts.color||'21201E',
    margin:0,breakLine:false,valign:'mid',fit:'shrink',bold:!!opts.bold,
    lineSpacingMultiple:1.1, ...opts});
}
function base(slide,n,deck,t){
  slide.background={color:t.bg};
  slide.addShape('line',{x:.72,y:.46,w:11.9,h:0,line:{color:t.line,width:.85}});
  tx(slide,deck.brand==='maillardhelp'?'MAILLARDHELP  /  STRATEGY':'LB  /  PRESENTATION',.72,.16,6,.25,{size:10.5,bold:true,color:t.accent});
  tx(slide,String(n).padStart(2,'0')+' / '+String(deck.slides.length).padStart(2,'0'),11.4,.17,1.2,.23,{size:10,color:t.muted,align:'right'});
  slide.addShape('line',{x:.72,y:7.06,w:11.9,h:0,line:{color:t.line,width:.65}});
  tx(slide,'LB PRESENTATION STUDIO  •  EDITABLE PPTX',.72,7.12,8,.16,{size:8,color:t.muted});
}
function header(slide,s,t){
  tx(slide,title(s.headline,45),.75,.8,11.75,1.05,{size:31,bold:true,color:t.ink,valign:'top'});
  slide.addShape('line',{x:.75,y:2.02,w:1.05,h:0,line:{color:t.accent,width:3}});
}
function drawCard(slide,x,y,w,h,label,detail,t){
  slide.addShape('roundRect',{x,y,w,h,rectRadius:.05,fill:{color:'FFFFFF'},line:{color:t.line,width:.8},radius:.05});
  tx(slide,label,x+.2,y+.22,w-.4,.5,{size:19,bold:true,color:t.ink,valign:'top'});
  if(detail)tx(slide,detail,x+.2,y+.83,w-.4,h-1.05,{size:14,color:t.muted,valign:'top'});
}
function addSlide(pptx,deck,s,n,t){
  const slide=pptx.addSlide();base(slide,n,deck,t);
  if(s.type==='cover'){
    tx(slide,(s.eyebrow||'BRAND  /  BUSINESS').toUpperCase(),.77,1.12,10,.4,{size:15,bold:true,color:t.accent});
    tx(slide,title(s.headline,53),.76,2,11.7,2.05,{size:49,bold:true,color:t.ink,valign:'mid'});
    tx(slide,s.subtitle||'商业计划 · 品牌战略 · 可编辑演示',.78,4.55,11,.7,{size:23,color:t.muted});
    slide.addShape('rect',{x:.77,y:5.75,w:2.05,h:.11,line:{color:t.accent},fill:{color:t.accent}});
    return;
  }
  header(slide,s,t);
  if(s.type==='flow'){
    const steps=(s.steps||[]).slice(0,5),gap=.16,w=(11.84-gap*Math.max(0,steps.length-1))/Math.max(1,steps.length);
    steps.forEach((step,j)=>{let x=.75+j*(w+gap);drawCard(slide,x,2.56,w,2.85,String(step.label||''),String(step.detail||''),t);
      if(j<steps.length-1)tx(slide,'→',x+w-.05,5.46,.45,.4,{size:19,bold:true,color:t.accent});});
    if(s.insight)tx(slide,s.insight,.8,6.04,11.6,.7,{size:21,bold:true,color:t.accent});
  }else if(s.type==='metrics'){
    const met=(s.metrics||[]).slice(0,4),gap=.22,w=(11.84-gap*Math.max(0,met.length-1))/Math.max(1,met.length);
    met.forEach((m,j)=>{const x=.75+j*(w+gap);
      slide.addShape('rect',{x,y:2.5,w,h:2.7,line:{color:t.line,width:1},fill:{color:'FFFFFF'}});
      tx(slide,String(m.value||''),x+.2,2.96,w-.4,.85,{size:35,bold:true,color:t.accent});
      tx(slide,m.label||'',x+.2,4.05,w-.4,.5,{size:16,bold:true,color:t.ink});
      tx(slide,m.assumption?'经营假设':('来源: '+(m.sourceId||'?')),x+.2,4.74,w-.4,.23,{size:10,color:t.muted});});
    if(s.note)tx(slide,s.note,.8,5.76,11.6,.7,{size:17,color:t.muted});
  }else if(s.type==='comparison'){
    const rows=s.rows||[],cols=s.columns||['比较对象','优势','局限'];
    slide.addTable([cols,...rows],{x:.75,y:2.4,w:11.8,h:Math.min(3.8,.68*(rows.length+1)),fontFace:'Aptos',fontSize:14,
      border:{type:'solid',pt:.7,color:t.line},fill:{color:'FFFFFF'},color:t.ink,margin:.14,
      rowH:.64,autoFit:false,bold:false,
      colW:cols.map(()=>11.8/cols.length)});
    if(s.insight)tx(slide,s.insight,.8,6.25,11.6,.48,{size:19,color:t.accent,bold:true});
  }else if(s.type==='chart'){
    const arr=(s.values||[]).map(v=>Number(v));
    if(arr.some(v=>!Number.isFinite(v)))throw new Error('Chart contains non-numeric values');
    slide.addChart(pptx.ChartType.bar,[{name:s.series||'Series',labels:s.labels||[],values:arr}],{
      x:.85,y:2.15,w:11.1,h:4.45,showLegend:false,showTitle:false,showValue:true,showCatName:false,
      catAxisLabelFontSize:11,valAxisLabelFontSize:11,chartColors:[t.accent],showBorder:false,showMarker:false});
    if(s.sourceId)tx(slide,'来源: '+s.sourceId,.86,6.74,6,.2,{size:9,color:t.muted});
  }else if(s.type==='image'){
    if(!s.image)throw new Error('Image slide missing image path');
    const p=path.resolve(deck.__dir||process.cwd(),s.image);
    if(!fs.existsSync(p))throw new Error('Image missing: '+p);
    slide.addImage({path:p,x:.75,y:2.2,w:11.8,h:4.15,sizingContain:true});
    if(s.caption)tx(slide,s.caption,.77,6.45,11.7,.35,{size:15,color:t.muted});
  }else if(s.type==='sources'){
    const records=(deck.sources||[]).map(o=>o.id+'｜'+o.title+'｜'+(o.url||'内部资料')+'｜'+(o.kind||'待核实')).slice(0,10);
    tx(slide,records.join('\n')||'未提供来源。本演示不得被视为已核实研究报告。',.82,2.25,11.5,4.45,{size:16,color:t.ink,valign:'top',breakLine:false});
  }else{
    const sentence=s.statement||'请补充本页核心论证。',
      supports=(s.support||[]).slice(0,4);
    tx(slide,sentence,.82,2.34,11.3,1.42,{size:26,bold:true,color:t.accent,valign:'top'});
    supports.forEach((p,j)=>{ const y=4.08+j*.56;
      slide.addShape('ellipse',{x:.86,y:y+.11,w:.12,h:.12,line:{color:t.accent},fill:{color:t.accent}});
      tx(slide,text(p),1.17,y,11.06,.44,{size:17,color:t.ink});
    });
  }
}
async function make(file,out,opts={}){
  const deck=await inputDeck(file);deck.__dir=path.dirname(path.resolve(file));
  const issues=validate(deck);if(issues.length)throw new Error('Input validation failed:\n'+issues.join('\n'));
  const t=theme(deck),pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='LB Presentation Studio';pptx.subject='Editable presentations';pptx.title=deck.title||'Presentation';pptx.lang='zh-CN';
  deck.slides.forEach((s,i)=>addSlide(pptx,deck,s,i+1,t));
  if((deck.sources||[]).length && !deck.slides.some(s=>s.type==='sources')){
    deck.slides.push({type:'sources',headline:'来源与研究边界'});
    // Keep page counts consistent by rebuilding the footer page after source append.
    pptx._slides=[];deck.slides.forEach((s,i)=>addSlide(pptx,deck,s,i+1,t));
  }
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});
  await pptx.writeFile({fileName:path.resolve(out)});
  const report={output:path.resolve(out),slides:deck.slides.length,contentWarnings:[],editable:'native PowerPoint text/shapes/tables/charts; placed photos stay raster'};
  if(deck.status==='UNVERIFIED_DRAFT')report.contentWarnings.push('Auto-extracted outline is NOT fact-checked or strategically validated');
  if(opts.qc)report.qc=audit(out);
  if(opts.pdf){
    if(!exists('soffice'))throw new Error('PPTX created; PDF export requires LibreOffice: brew install --cask libreoffice');
    const r=spawnSync('soffice',['-env:UserInstallation=file:///tmp/lbp-libreoffice-'+process.pid,'--headless','--convert-to','pdf','--outdir',path.dirname(path.resolve(out)),path.resolve(out)],{encoding:'utf8'});
    if(r.status!==0)throw new Error('PPTX created but PDF export failed: '+r.stderr);
    report.pdf=path.resolve(out).replace(/\.pptx$/i,'.pdf');
    if(!fs.existsSync(report.pdf))throw new Error('PDF export did not produce a file');
  }
  fs.writeFileSync(path.resolve(out)+'.report.json',JSON.stringify(report,null,2));
  return report;
}
function audit(file){
  if(!exists('unzip'))return {status:'SKIPPED',reason:'unzip not installed'};
  const r=spawnSync('unzip',['-Z1',path.resolve(file)],{encoding:'utf8'});
  if(r.status!==0)throw new Error('Cannot read PPTX ZIP');
  const slides=r.stdout.split('\n').filter(x=>/^ppt\/slides\/slide\d+\.xml$/.test(x));
  let texts=0, shapes=0, pictures=0, charts=0;
  for(const s of slides){
    const xml=execFileSync('unzip',['-p',path.resolve(file),s],{encoding:'utf8'});
    texts+=(xml.match(/<a:t>/g)||[]).length;
    shapes+=(xml.match(/<p:sp>/g)||[]).length;
    pictures+=(xml.match(/<p:pic>/g)||[]).length;
    charts+=(xml.match(/<c:chart\b/g)||[]).length;
  }
  return {status:slides.length&&shapes>0?'STRUCTURE_PASS':'FAIL',slides:slides.length,nativeShapes:shapes,textRuns:texts,rasterPictures:pictures,charts,
    limitations:'ZIP check confirms native objects; it does not prove visual quality, editability of each image, or pixel-perfect rendering.'};
}
function usage(){
  console.log('LB Presentation Studio v1\n'+[
    'lbp create <input.json|md|txt|docx|pdf> --out file.pptx [--pdf] [--qc]',
    'lbp audit <file.pptx>',
    'lbp providers',
    'lbp skill <strategy|visual-director|pptx-builder|mono-color|gc-minimal-zine-poster|gpt-image2-ppt-skills|GordenSuperPPTSkills>',
    'lbp install-provider <mono-color|gc-minimal-zine-poster|gpt-image2-ppt-skills> (requires git)',
    'lbp doctor'
  ].join('\n'));
}
async function main(){
  if(cmd==='help'||cmd==='--help')return usage();
  if(cmd==='doctor'){console.log(JSON.stringify({node:process.version,git:exists('git'),pdftotext:exists('pdftotext'),soffice:exists('soffice'),unzip:exists('unzip'),codexSkillsDir:path.join(os.homedir(),'.codex','skills')},null,2));return;}
  if(cmd==='providers'){console.log(JSON.stringify(PROVIDERS,null,2));return;}
  if(cmd==='skill'){
    const name=args[0];
    if(['strategy','visual-director','pptx-builder'].includes(name)){
      const fp=path.join(ROOT,'skills',name,'SKILL.md');console.log(fs.readFileSync(fp,'utf8'));return;
    }
    if(!PROVIDERS[name])throw new Error('Unknown skill: '+name);
    console.log(JSON.stringify(PROVIDERS[name],null,2));return;
  }
  if(cmd==='install-provider'){
    const name=args[0],p=PROVIDERS[name];
    if(!p)throw new Error('Unknown skill');
    if(name==='GordenSuperPPTSkills')throw new Error('Custom license: review terms and install manually: '+p.repo);
    if(!exists('git'))throw new Error('git not installed');
    const dest=path.join(os.homedir(),'.codex','skills',p.installedName);
    if(fs.existsSync(dest))throw new Error('Already exists: '+dest+'. Please upgrade manually.');
    fs.mkdirSync(path.dirname(dest),{recursive:true});
    const r=spawnSync('git',['clone','--depth','1',p.repo,dest],{stdio:'inherit'});
    if(r.status!==0)throw new Error('Clone failed');
    console.log('Installed '+name+' into '+dest+'. Restart Codex. License: '+p.license);
    return;
  }
  if(cmd==='create'){
    if(!args[0])throw new Error('Missing input');
    const out=option('out',path.join('dist',path.basename(args[0],path.extname(args[0]))+'.pptx'));
    const report=await make(args[0],out,{pdf:flag('pdf'),qc:flag('qc')});
    console.log(JSON.stringify(report,null,2));return;
  }
  if(cmd==='audit'){if(!args[0])throw new Error('Missing PPTX');console.log(JSON.stringify(audit(args[0]),null,2));return;}
  usage();process.exitCode=1;
}
main().catch(e=>die(e.message));
