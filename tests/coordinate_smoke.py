"""本次用户激活坐标的独立浏览器回归；不是帧率测试。"""
import argparse
import functools
import json
import os
import threading
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright
from browser_smoke import ROOT, OUT, Handler


def install_capture(page):
    page.evaluate('''() => {
      window.__coordinates = {click:null, changes:[]};
      document.addEventListener('click', event => {
        if(event.target.localName==='theme-button')window.__coordinates.click={x:event.clientX,y:event.clientY};
      }, true);
      document.querySelector('theme-button').addEventListener('change', event => {
        window.__coordinates.changes.push({detail:event.detail,point:event.point ?? null});
      });
    }''')


def pointer(locator, touch, right=False):
    box = locator.bounding_box()
    position = {'x': round(box['width'] - 8 if right else 8), 'y': round(box['height'] / 2)}
    if touch:
        locator.page.touchscreen.tap(box['x'] + position['x'], box['y'] + position['y'])
    else:
        locator.click(position=position)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--label', default='current')
    parser.add_argument('--base', help='可选的已部署 HTTP(S) 根地址；省略则启动本地服务')
    args = parser.parse_args()
    if not args.label.replace('-', '').isalnum():
        parser.error('label must contain only letters, digits or hyphens')
    if args.base and (urlparse(args.base).scheme not in ('http', 'https') or not urlparse(args.base).netloc):
        parser.error('base must be an absolute HTTP(S) URL')
    OUT.mkdir(exist_ok=True)
    server = None
    if args.base:
        origin = args.base.rstrip('/')
    else:
        server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        origin = f'http://127.0.0.1:{server.server_port}'
    report = {'passed': False, 'label':args.label, 'timestamp':datetime.now(timezone.utc).isoformat(),
              'kind':'synthetic-coordinate-regression-not-device-performance', 'base':origin, 'cases':[]}
    failures = []
    try:
        with sync_playwright() as p:
            launch = {'headless':True}
            if os.environ.get('CHROME_PATH'):
                launch['executable_path'] = os.environ['CHROME_PATH']
            browser = p.chromium.launch(**launch)
            report['browser'] = browser.version
            try:
                for width, touch in [(390, True), (1440, False)]:
                    context = browser.new_context(viewport={'width':width, 'height':844}, has_touch=touch,
                        is_mobile=touch, device_scale_factor=1, color_scheme='light')
                    page = context.new_page()
                    errors, resources = [], []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.on('response', lambda response: resources.append(response.url)
                        if response.status >= 400 and response.request.resource_type in ('script', 'stylesheet', 'document') else None)
                    row = {'width':width, 'touch':touch, 'checks':[]}
                    report['cases'].append(row)
                    page.goto(origin + '/examples/long-page.html')
                    page.wait_for_function('window.example !== undefined')
                    install_capture(page)
                    button = page.locator('theme-button')

                    def check_disk(name, pointer_expected):
                        sample = page.evaluate('''() => {
                          const disk=document.querySelector('.shiran-theme-disk');
                          return {click:window.__coordinates.click, change:window.__coordinates.changes.at(-1),
                            actual:disk?{x:parseFloat(disk.style.left),y:parseFloat(disk.style.top)}:null,
                            fallback:{x:document.documentElement.clientWidth/2,y:28}};
                        }''')
                        expected = sample['click'] if pointer_expected else sample['fallback']
                        sample.update({'name':name, 'expected':expected, 'passed':sample['actual'] == expected})
                        if sample['change']['point'] != (sample['click'] if pointer_expected else None):
                            sample['passed'] = False
                        if sample['change']['detail'] not in ('light', 'dark'):
                            sample['passed'] = False
                        if not sample['passed']:
                            failures.append({'width':width, **sample})
                        row['checks'].append(sample)

                    pointer(button, touch)
                    check_disk('first-pointer-left', True)
                    pointer(button, touch, right=True)
                    check_disk('rapid-second-pointer-right', True)
                    button.focus()
                    page.keyboard.press('Enter')
                    check_disk('keyboard-enter-not-old-pointer', False)
                    pointer(button, touch, right=True)
                    check_disk('pointer-before-program-click', True)
                    button.evaluate('(element)=>element.click()')
                    check_disk('program-click-not-old-pointer', False)
                    page.keyboard.press('Space')
                    check_disk('keyboard-space', False)
                    page.wait_for_function("!document.querySelector('.shiran-theme-layer')")
                    page.screenshot(path=str(OUT / f'coordinates-{args.label}-{width}.png'))

                    # 销毁后按钮仍能单独工作，但不再改宿主主题或建立动画。
                    page.evaluate('window.example.controller.destroy()')
                    before = page.evaluate('document.documentElement.dataset.theme')
                    pointer(button, touch)
                    destroyed = page.evaluate('''() => ({theme:document.documentElement.dataset.theme,
                      layers:document.querySelectorAll('.shiran-theme-layer').length})''')
                    good = destroyed == {'theme':before, 'layers':0}
                    row['checks'].append({'name':'destroy-unbound', 'passed':good, **destroyed})
                    if not good:
                        failures.append({'width':width, 'name':'destroy-unbound', **destroyed})

                    # 嵌入演示没有页面控制器，同样必须传本次点，而不是前一次点。
                    page.goto(origin + '/')
                    page.wait_for_function("document.querySelector('#v5frame').contentWindow.demo?.embedded===true")
                    page.evaluate('''() => {
                      window.__bridge=[];
                      addEventListener('message', event => {
                        if(event.source===document.querySelector('#v5frame').contentWindow &&
                          event.data?.type==='shiran-demo-change')window.__bridge.push(event.data);
                      });
                    }''')
                    frame = page.frame_locator('#v5frame')
                    embedded = frame.locator('theme-button')
                    embedded.scroll_into_view_if_needed()
                    child = page.locator('#v5frame').element_handle().content_frame()
                    install_capture(child)
                    for name, right in [('embedded-first-left', False), ('embedded-second-right', True)]:
                        pointer(embedded, touch, right=right)
                        count = len([check for check in row['checks'] if check['name'].startswith('embedded-')]) + 1
                        page.wait_for_function('count=>window.__bridge.length>=count', arg=count)
                        actual = page.evaluate('window.__bridge.at(-1).point')
                        expected = child.evaluate('window.__coordinates.click')
                        good = actual == expected
                        row['checks'].append({'name':name, 'passed':good, 'actual':actual, 'expected':expected})
                        if not good:
                            failures.append({'width':width, 'name':name, 'actual':actual, 'expected':expected})
                        page.wait_for_function("!document.querySelector('[data-comparison-vt]')")
                    embedded.focus()
                    page.keyboard.press('Enter')
                    page.wait_for_function('window.__bridge.length===3')
                    actual = page.evaluate('window.__bridge.at(-1).point')
                    good = actual is None
                    row['checks'].append({'name':'embedded-keyboard-clears-point', 'passed':good, 'actual':actual})
                    if not good:
                        failures.append({'width':width, 'name':'embedded-keyboard-clears-point', 'actual':actual})
                    row['errors'] = errors
                    row['failed_resources'] = resources
                    if errors or resources:
                        failures.append({'width':width, 'errors':errors, 'failed_resources':resources})
                    print(json.dumps(row, ensure_ascii=False), flush=True)
                    context.close()
                report['passed'] = not failures
                report['failures'] = failures
            finally:
                browser.close()
    finally:
        if server:
            server.shutdown()
            server.server_close()
        (OUT / f'coordinates-{args.label}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    assert not failures, f'{len(failures)} coordinate regressions; see test-results/coordinates-{args.label}.json'


if __name__ == '__main__':
    main()
