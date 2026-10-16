import { createThemeController } from '../components/theme-controller.js';
import { createFlowWave } from '../adapters/flow-wave.js';

const content = document.querySelector('#content');
const drawer = document.querySelector('.drawer');
const outline = document.querySelector('.desktop-outline');
const menu = document.querySelector('#menu');
for (let i = 1; i <= 100; i++) {
  // 直接子块按普通流排列；动态完成后再建立索引。
  const title = document.createElement('h2'); title.id = `chapter-${i}`; title.textContent = `第 ${i} 节 · 性能适配`;
  const paragraph = document.createElement('p'); paragraph.textContent = '主题切换不应该触发整章几何扫描。按实际布局变化刷新缓存，保留锚点、文字和局部横滚。'.repeat(4);
  const pre = document.createElement('pre'); pre.dataset.codeLines = '12'; pre.style.setProperty('--code-lines', '12');
  pre.textContent = Array.from({length:12},(_,n)=>`line ${n+1}: `+'long-code-segment '.repeat(16)).join('\n');
  content.append(title, paragraph, pre);
  for (const navigation of [drawer, outline]) { const link=document.createElement('a'); link.href=`#${title.id}`; link.textContent=`第 ${i} 节`; navigation.append(link); }
}
const frame=document.createElement('span'); frame.dataset.themeImageFrame='';
const image=new Image();image.alt='固定比例示例图';image.width=320;image.height=180;
image.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#89a3ba"/></svg>');
frame.append(image);
content.insertBefore(frame, content.children[3]);
const table=document.createElement('table'); table.id='wide-table';
table.innerHTML='<tbody><tr><td style="min-width:900px">横滚表格仍需刷新单元格位置</td><td style="min-width:300px">右侧</td></tr></tbody>';
content.insertBefore(table, content.children[3]);

const wave=createFlowWave({content,shells:[document.body,document.querySelector('header'),outline],targetSelector:'body,header,button,h1,h2,p,a,pre,td,th,table,img'});
const controller=createThemeController({storageKey:'shiran-example-long',pageSize:'long',wave,surfaces:[document.querySelector('header'),content,outline]});
function close(){drawer.classList.remove('open');drawer.inert=true;menu.setAttribute('aria-expanded','false');}
menu.onclick=()=>{const open=drawer.classList.toggle('open');drawer.inert=!open;menu.setAttribute('aria-expanded',String(open));};
drawer.addEventListener('click',event=>{if(event.target.closest('a'))close();});
document.querySelector('#system').onclick=()=>controller.followSystem();
window.example={controller,wave};
