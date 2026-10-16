// 解析最终HTML内联脚本；浏览器模块图与交互另由浏览器验收。
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
for (const file of ['index.html', 'v5.0/index.html']) {
  const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|\btype\s*=\s*["']module["']/i.test(match[1])) continue;
    new vm.Script(match[2], { filename:file });
  }
}
console.log('HTML inline scripts: OK');
