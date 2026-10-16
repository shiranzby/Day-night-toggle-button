"""独立 Chromium 的组件/状态/长文边界验收；不是设备帧率基准。"""
import base64
import functools
import json
import os
import threading
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'test-results'
INIT = """(() => {
  window.__testShadows=[];
  const attach=Element.prototype.attachShadow;
  Element.prototype.attachShadow=function(options){
    const root=attach.call(this,options);
    if(this.localName==='theme-button')window.__testShadows.push(root);
    return root;
  };
})();"""


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def svg(width, height):
    return 'data:image/svg+xml;base64,' + base64.b64encode(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}"></svg>'.encode()).decode()


def settle(page):
    page.wait_for_timeout(1300)
    page.wait_for_function('window.example.wave.stats().targets>0')


def geometry(page):
    return page.evaluate('''() => ({width:document.documentElement.clientWidth,
      scrollWidth:document.documentElement.scrollWidth,innerWidth,scale:visualViewport.scale,
      height:document.documentElement.scrollHeight,y:scrollY})''')


def change_image(page, selector, source):
    return page.locator(selector).evaluate('''(img,src)=>new Promise((resolve,reject)=>{
      img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});
      img.onerror=()=>reject(new Error('image load failed'));img.src=src;
    })''', source)


def scroll_element(element):
    value = element.evaluate('''el=>new Promise(resolve=>{
      let fired=false;el.addEventListener('scroll',()=>fired=true,{once:true});el.scrollLeft=80;
      requestAnimationFrame(()=>requestAnimationFrame(()=>resolve({left:el.scrollLeft,fired})));
    })''')
    assert value['left'] == 80 and value['fired'], value


def activate(locator, touch):
    locator.tap() if touch else locator.click()


def main():
    OUT.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    origin = f'http://127.0.0.1:{server.server_port}'
    report = {'cases': [], 'passed': False, 'timestamp': datetime.now(timezone.utc).isoformat(),
              'kind': 'synthetic-browser-smoke-not-device-performance'}
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
                    context.add_init_script(INIT)
                    page = context.new_page()
                    errors = []
                    page.on('pageerror', lambda error: errors.append(str(error)))
                    page.goto(origin + '/examples/basic.html')
                    page.wait_for_function('window.example !== undefined')
                    settle(page)
                    before = geometry(page)
                    row = {'width': width, 'touch': touch, 'checks': []}
                    report['cases'].append(row)
                    page.screenshot(path=str(OUT / f'basic-{width}-light.png'))
                    activate(page.locator('theme-button'), touch)
                    page.wait_for_function("document.documentElement.dataset.theme==='dark'")
                    page.wait_for_timeout(1700)
                    assert page.locator('theme-button').get_attribute('value') == 'dark'
                    assert page.locator('theme-button').get_attribute('aria-checked') == 'true'
                    assert geometry(page) == before
                    page.screenshot(path=str(OUT / f'basic-{width}-dark.png'))
                    page.reload()
                    page.wait_for_function('window.example !== undefined')
                    assert page.evaluate('window.example.controller.theme') == 'dark'
                    page.emulate_media(color_scheme='dark')
                    page.emulate_media(color_scheme='light')
                    page.wait_for_timeout(100)
                    assert page.evaluate('window.example.controller.theme') == 'dark'
                    page.evaluate('window.example.controller.followSystem()')
                    assert page.evaluate('window.example.controller.theme') == 'light'
                    assert page.evaluate("localStorage.getItem('shiran-example')") is None
                    page.emulate_media(color_scheme='dark')
                    page.wait_for_function("document.documentElement.dataset.theme==='dark'")
                    page.wait_for_timeout(1700)
                    row['checks'].append('preference-system-reload')
                    page.locator('theme-button').focus()
                    page.keyboard.press('Enter')
                    page.wait_for_function("document.documentElement.dataset.theme==='light'")
                    page.wait_for_timeout(1700)
                    page.keyboard.press('Space')
                    page.wait_for_function("document.documentElement.dataset.theme==='dark'")
                    page.wait_for_timeout(1700)
                    row['checks'].append('keyboard')
                    page.evaluate('''() => {
                      const button=document.querySelector('theme-button');const count=window.__testShadows.length;
                      button.remove();document.querySelector('header').append(button);
                      if(window.__testShadows.length!==count)throw new Error('duplicate shadow');
                      window.__changeCount=0;button.addEventListener('change',()=>window.__changeCount++);
                      button.setAttribute('value','light');
                    }''')
                    assert page.evaluate('window.__changeCount') == 0
                    page.locator('theme-button').evaluate('(button)=>button.setAttribute("disabled", "")')
                    page.locator('theme-button').evaluate('(button)=>button.click()')
                    assert page.evaluate('window.__changeCount') == 0
                    page.locator('theme-button').evaluate('(button)=>button.removeAttribute("disabled")')
                    page.emulate_media(reduced_motion='reduce')
                    result = page.evaluate("window.example.controller.setTheme('light')")
                    assert result['mode'] == 'none'
                    assert page.locator('.shiran-theme-layer').count() == 0
                    page.emulate_media(reduced_motion='no-preference')
                    page.evaluate('''() => {
                      document.querySelector('header').style.setProperty('transition','opacity 200ms linear','important');
                      window.__beforeTransitions=[...window.example.wave.getTargets().keys()].map(e=>[
                        e,e.style.getPropertyValue('transition'),e.style.getPropertyPriority('transition')]);
                    }''')
                    result = page.evaluate('''async () => {
                      const c=window.example.controller;
                      return Promise.all([c.setTheme('dark'),c.setTheme('light'),c.setTheme('dark')]);
                    }''')
                    assert result[0]['cancelled'] and result[1]['cancelled'] and not result[2]['cancelled'], result
                    assert page.evaluate("document.documentElement.dataset.theme") == 'dark'
                    assert page.locator('.shiran-theme-layer').count() == 0
                    assert page.evaluate('''window.__beforeTransitions.every(([e,value,priority])=>
                      e.style.getPropertyValue('transition')===value && e.style.getPropertyPriority('transition')===priority)''')
                    row['checks'].append('reconnect-silent-value-disabled-reduce-rapid')

                    page.emulate_media(color_scheme='light')
                    page.goto(origin + '/examples/long-page.html')
                    page.wait_for_function('window.example !== undefined')
                    settle(page)
                    start = page.evaluate('window.example.wave.stats()')
                    hidden = page.evaluate('''() => ({display:getComputedStyle(document.querySelector('.desktop-outline')).display,
                      count:[...window.example.wave.getTargets().keys()].filter(e=>e.closest('.desktop-outline')).length})''')
                    assert (hidden['count'] == 0) == (width < 1280), hidden
                    activate(page.locator('#menu'), touch)
                    page.wait_for_timeout(300)
                    assert page.evaluate('''document.querySelector('.drawer').getBoundingClientRect().top >=
                      document.querySelector('header').getBoundingClientRect().bottom''')
                    page.locator('.drawer').evaluate('(e)=>e.scrollTop=160')
                    page.wait_for_timeout(300)
                    activate(page.locator('#menu'), touch)
                    page.wait_for_timeout(1500)
                    assert page.evaluate('window.example.wave.stats()') == start
                    row['checks'].append('drawer-no-rebuild')
                    pre = page.locator('pre').first
                    pre.scroll_into_view_if_needed()
                    settle(page)
                    start = page.evaluate('window.example.wave.stats()')
                    scroll_element(pre)
                    page.wait_for_timeout(1500)
                    assert page.evaluate('window.example.wave.stats()') == start
                    table = page.locator('#wide-table')
                    table.scroll_into_view_if_needed()
                    settle(page)
                    start = page.evaluate('window.example.wave.stats()')
                    scroll_element(table)
                    settle(page)
                    assert page.evaluate('window.example.wave.stats().created') > start['created']
                    row['checks'].append('pre-filter-table-refresh')
                    image = page.locator('[data-theme-image-frame] > img')
                    image.scroll_into_view_if_needed()
                    settle(page)
                    start = page.evaluate('window.example.wave.stats()')
                    old = geometry(page)
                    assert change_image(page, '[data-theme-image-frame] > img', svg(111, 53)) == {'width': 111, 'height': 53}
                    page.wait_for_timeout(1500)
                    assert page.evaluate('window.example.wave.stats()') == start
                    assert geometry(page) == old
                    page.evaluate('''src=>{const img=new Image();img.id='unknown';img.src=src;
                      document.querySelector('#content').prepend(img);window.example.wave.refresh();}''', svg(20, 20))
                    page.evaluate('scrollTo(0,0)')
                    settle(page)
                    start = page.evaluate('window.example.wave.stats()')
                    change_image(page, '#unknown', svg(180, 140))
                    settle(page)
                    assert page.evaluate('window.example.wave.stats().created') > start['created']
                    row['checks'].append('fixed-image-filter-unknown-refresh')
                    page.evaluate('scrollTo(0,12000)')
                    settle(page)
                    old = geometry(page)
                    page.evaluate("window.example.controller.setTheme('dark')")
                    assert geometry(page) == old
                    activate(page.locator('#menu'), touch)
                    page.wait_for_timeout(300)
                    page.screenshot(path=str(OUT / f'long-{width}-dark-drawer.png'))
                    activate(page.locator('#menu'), touch)
                    assert old['width'] == old['scrollWidth'] == width and old['scale'] == 1
                    page.emulate_media(media='print')
                    assert pre.evaluate('(e)=>getComputedStyle(e).contentVisibility') == 'visible'
                    page.emulate_media(media='screen')
                    page.evaluate('window.example.controller.destroy()')
                    stopped = page.evaluate('window.example.wave.stats()')
                    page.evaluate('scrollTo(0,0)')
                    page.wait_for_timeout(1500)
                    assert page.evaluate('window.example.wave.stats()') == stopped
                    assert stopped['targets'] == 0 and not errors, errors
                    row['checks'].append('deep-wave-width-height-print-destroy')
                    row['errors'] = errors
                    print(json.dumps(row, ensure_ascii=False), flush=True)
                    context.close()
                report['passed'] = True
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        (OUT / 'browser-smoke.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')


if __name__ == '__main__':
    main()
