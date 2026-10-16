"""v5独立入口与五版本桥接验收；不作为长页性能基准。"""
import functools
import json
import os
import threading
from http.server import ThreadingHTTPServer

from playwright.sync_api import sync_playwright
from browser_smoke import ROOT, OUT, Handler, activate, geometry


def main():
    OUT.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f'http://127.0.0.1:{server.server_port}'
    report = {'passed': False, 'cases': []}
    try:
        with sync_playwright() as p:
            launch = {'headless': True}
            if os.environ.get('CHROME_PATH'):
                launch['executable_path'] = os.environ['CHROME_PATH']
            browser = p.chromium.launch(**launch)
            report['browser'] = browser.version
            try:
                for width, touch in [(390, True), (1440, False)]:
                    context = browser.new_context(viewport={'width': width, 'height': 844},
                        has_touch=touch, is_mobile=touch, device_scale_factor=1, color_scheme='light')
                    page = context.new_page()
                    errors, resources = [], []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.on('response', lambda response: resources.append(response.url)
                        if response.status >= 400 and response.request.resource_type in ('script', 'stylesheet', 'document') else None)
                    page.goto(origin + '/')
                    frame = page.frame_locator('#v5frame')
                    frame.locator('theme-button').wait_for()
                    page.wait_for_function("document.querySelector('#v5frame').contentWindow.demo?.embedded===true")
                    assert page.locator('.grid > .card').count() == 5
                    assert geometry(page)['scrollWidth'] == width
                    for selector in ['#t1', '#t2', '#v3wrap theme-button', '#v4wrap theme-button', None]:
                        dark = not page.evaluate("document.body.classList.contains('dark')")
                        activate(page.locator(selector) if selector else frame.locator('theme-button'), touch)
                        page.wait_for_function("dark=>document.body.classList.contains('dark')===dark", arg=dark)
                        page.wait_for_timeout(1650)
                        expected = 'dark' if dark else 'light'
                        assert page.locator('#v3wrap theme-button').get_attribute('value') == expected
                        assert page.locator('#v4wrap theme-button').get_attribute('value') == expected
                        assert page.evaluate("[...document.querySelectorAll('theme-button')].every(e=>e._getState()===document.body.classList.contains('dark'))")
                        assert frame.locator('theme-button').get_attribute('value') == expected
                        assert frame.locator('theme-button').get_attribute('aria-checked') == str(dark).lower()
                        assert frame.locator('html').evaluate('(e)=>getComputedStyle(e).colorScheme') == 'normal'
                        assert page.evaluate('v1.isDark() && v2.isDark()' if dark else '!v1.isDark() && !v2.isDark()')
                        assert page.locator('[data-comparison-vt]').count() == 0
                    page.screenshot(path=str(OUT / f'comparison-{width}-dark.png'), full_page=True)
                    # 不接收来自顶层自身或错误主题值的伪造桥接消息。
                    page.evaluate("window.postMessage({type:'shiran-demo-change',theme:'light'},location.origin)")
                    page.wait_for_timeout(100)
                    assert page.evaluate("document.body.classList.contains('dark')")
                    page.emulate_media(color_scheme='dark')
                    page.wait_for_timeout(100)
                    assert frame.locator('theme-button').get_attribute('value') == 'dark'
                    page.emulate_media(reduced_motion='reduce')
                    frame.locator('theme-button').focus()
                    page.keyboard.press('Enter')
                    page.wait_for_function("!document.body.classList.contains('dark')")
                    assert page.locator('[data-comparison-vt]').count() == 0
                    page.keyboard.press('Space')
                    page.wait_for_function("document.body.classList.contains('dark')")
                    # 连续请求必须最终同步；不等上一轮动画播放完。
                    page.emulate_media(reduced_motion='no-preference')
                    page.evaluate('syncBody(false);syncBody(true);syncBody(false)')
                    page.wait_for_timeout(1800)
                    assert not page.evaluate("document.body.classList.contains('dark')")
                    assert frame.locator('theme-button').get_attribute('value') == 'light'
                    assert page.evaluate("[...document.querySelectorAll('theme-button')].every(e=>!e._getState())")
                    page.screenshot(path=str(OUT / f'comparison-{width}-light.png'), full_page=True)

                    page.goto(origin + '/v5.0/')
                    page.wait_for_function('window.demo?.embedded===false')
                    page.emulate_media(color_scheme='light')
                    page.wait_for_timeout(1700)
                    page.screenshot(path=str(OUT / f'v5-{width}-light.png'))
                    activate(page.locator('theme-button'), touch)
                    page.wait_for_function("document.documentElement.dataset.theme==='dark'")
                    page.wait_for_timeout(1700)
                    assert page.evaluate("localStorage.getItem('shiran-v5-demo')") == 'dark'
                    assert geometry(page)['scrollWidth'] == width
                    page.screenshot(path=str(OUT / f'v5-{width}-dark.png'))
                    page.reload()
                    page.wait_for_function('window.demo?.controller.theme===\'dark\'')
                    activate(page.locator('#system'), touch)
                    page.wait_for_function("document.documentElement.dataset.theme==='light'")
                    assert page.evaluate("localStorage.getItem('shiran-v5-demo')") is None
                    page.emulate_media(color_scheme='dark')
                    page.wait_for_function("document.documentElement.dataset.theme==='dark'")
                    assert not errors and not resources, {'errors': errors, 'resources': resources}
                    row = {'width': width, 'touch': touch, 'all_five_click_sync': True,
                        'keyboard_reduce_rapid_source_guard': True, 'standalone_preference_system_reload': True,
                        'errors': errors, 'failed_resources': resources}
                    report['cases'].append(row)
                    print(json.dumps(row, ensure_ascii=False), flush=True)
                    context.close()
                report['passed'] = True
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        (OUT / 'version-smoke.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
