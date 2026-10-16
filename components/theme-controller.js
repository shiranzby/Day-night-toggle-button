/** MIT · Shiran. 页面状态/动效控制器；按钮和正文缓存分别独立。 */
import './theme-button.js';

const owners = new WeakMap();
const valid = value => value === 'light' || value === 'dark';

export function createThemeController(options = {}) {
  const root = options.root || document.documentElement;
  const doc = root.ownerDocument;
  if (root !== doc.documentElement) throw new Error('当前控制器面向整页；root 必须是 documentElement');
  if (owners.has(doc)) throw new Error('一个 document 只创建一个主题控制器');
  const buttons = [...(options.buttons || doc.querySelectorAll('theme-button'))];
  const key = options.storageKey || 'shiran-theme';
  const animation = options.animation || 'auto';
  if (!['auto', 'view-transition', 'ripple', 'none'].includes(animation)) throw new Error('无效 animation');
  const wave = options.wave;
  if (animation === 'ripple' && !wave) throw new Error('ripple 需要 wave 适配器，不能用纯色遮罩冒充内容揭示');
  const canvas = doc.body;
  if (!canvas) throw new Error('请在 body 已建立后创建控制器');
  const surfaces = [canvas, ...(options.surfaces || [])].filter(Boolean);
  const backgrounds = { light: '#ffffff', dark: '#0d1117', ...options.backgrounds };
  const system = matchMedia('(prefers-color-scheme: dark)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const points = new WeakMap();
  const cleanups = [];
  let preference = null;
  let theme;
  let active = null;
  let destroyed = false;
  try { const saved = localStorage.getItem(key); if (valid(saved)) preference = saved; } catch (_) {}

  function listen(target, event, callback, config) {
    target.addEventListener(event, callback, config);
    cleanups.push(() => target.removeEventListener(event, callback, config));
  }
  function persist(value) {
    preference = value;
    try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch (_) {}
  }
  function apply(value) {
    root.dataset.theme = value;
    root.style.colorScheme = value;
  }
  function syncButtons(value) { buttons.forEach(button => button.setAttribute('value', value)); }
  function restore(run) {
    for (const [element, value, priority] of run.styles) {
      if (value) element.style.setProperty('transition', value, priority);
      else element.style.removeProperty('transition');
    }
    run.styles.length = 0;
  }
  function end(run, cancelled = false) {
    if (active !== run) return;
    active = null; // 先撤身份，再取消可能异步派发回调的动画。
    clearTimeout(run.timer);
    run.frames.forEach(cancelAnimationFrame);
    if (run.animation) {
      run.animation.onfinish = run.animation.oncancel = null;
      try { run.animation.cancel(); } catch (_) {}
    }
    try { run.vt?.skipTransition(); } catch (_) {}
    restore(run);
    run.layer?.remove();
    root.removeAttribute('data-shiran-vt');
    run.resolve({ theme: run.theme, cancelled, mode: run.mode });
  }
  function direct(run) {
    if (active !== run) return;
    apply(run.theme);
    end(run);
  }
  function mode() {
    if (reduce.matches || animation === 'none') return 'none';
    const lightweight = options.pageSize === 'long' || matchMedia('(max-width:1023px),(pointer:coarse)').matches;
    if (animation === 'ripple') return 'ripple';
    if (animation === 'view-transition' || (!lightweight && doc.startViewTransition)) {
      return doc.startViewTransition ? 'view-transition' : (wave ? 'ripple' : 'none');
    }
    return wave ? 'ripple' : 'none';
  }
  function prepareWave(run, point, radius, width, height) {
    // 只消费空闲缓存；固定少量容器用视口矩形兜底，不在点击中扫描正文。
    const targets = new Map(wave.getTargets());
    if (!targets.size) surfaces.forEach(element => targets.set(element, { left: 0, top: 0, width, height }));
    targets.set(canvas, { left: 0, top: 0, width, height });
    for (const [element, rect] of targets) {
      if (!element.isConnected || rect.width <= 0 || rect.height <= 0) continue;
      const x = Math.min(Math.max(rect.left + rect.width / 2, 0), width);
      const y = Math.min(Math.max(rect.top + rect.height / 2, 0), height);
      const delay = element === canvas ? 850 : Math.round(Math.min(Math.hypot(x - point.x, y - point.y) / radius, 1) * 850);
      run.styles.push([element, element.style.getPropertyValue('transition'), element.style.getPropertyPriority('transition')]);
      element.style.transition = options.filterSelector && element.matches(options.filterSelector)
        ? `filter 1ms linear ${delay}ms`
        : ['background-color', 'color', 'border-color'].map(property => `${property} 250ms linear ${delay}ms`).join(',');
    }
  }
  function ripple(run, point, radius, width, height) {
    prepareWave(run, point, radius, width, height);
    apply(run.theme);
    const layer = doc.createElement('div');
    layer.className = 'shiran-theme-layer';
    layer.setAttribute('aria-hidden', 'true');
    const disk = doc.createElement('div');
    disk.className = 'shiran-theme-disk';
    Object.assign(disk.style, { left: `${point.x}px`, top: `${point.y}px`, background: backgrounds[run.theme] });
    layer.append(disk);
    canvas.append(layer);
    run.layer = layer;
    const scale = Math.ceil(2 * (radius + 2) / 20);
    run.animation = disk.animate([
      { transform: 'translate(-50%,-50%) scale(0)' },
      { offset: 1050 / 1300, transform: `translate(-50%,-50%) scale(${scale})` },
      { transform: `translate(-50%,-50%) scale(${scale})` }
    ], { duration: 1300, easing: 'cubic-bezier(0.4,0,0.5,1)', fill: 'forwards' });
    run.animation.onfinish = () => {
      if (active !== run) return;
      // 全程不透明；底色落定并经过两次绘制机会后才撤层，避免末帧闪烁。
      restore(run);
      run.frames.push(requestAnimationFrame(() => {
        if (active !== run) return;
        run.frames.push(requestAnimationFrame(() => end(run)));
      }));
    };
    run.animation.oncancel = () => direct(run);
    run.timer = setTimeout(() => direct(run), 2200);
  }
  function viewTransition(run, point, radius) {
    root.setAttribute('data-shiran-vt', '');
    const vt = doc.startViewTransition(() => { if (active === run) apply(run.theme); });
    run.vt = vt;
    // 这是异步异常兜底，无法中断已阻塞主线程的浏览器快照。
    run.timer = setTimeout(() => direct(run), 700);
    vt.ready.then(() => {
      if (active !== run) return;
      clearTimeout(run.timer);
      run.animation = root.animate({ clipPath: [
        `circle(0px at ${point.x}px ${point.y}px)`,
        `circle(${radius}px at ${point.x}px ${point.y}px)`
      ] }, { duration: 1400, easing: 'cubic-bezier(0.4,0,0.5,1)', fill: 'forwards', pseudoElement: '::view-transition-new(root)' });
      run.timer = setTimeout(() => direct(run), 2200);
    }).catch(() => direct(run));
    vt.finished.then(() => { if (active === run) end(run); }, () => direct(run));
  }
  function setTheme(value, { persist: save = true, animate = true, point = null } = {}) {
    if (destroyed) throw new Error('主题控制器已销毁');
    if (!valid(value)) throw new TypeError('theme 必须是 light 或 dark');
    if (save) persist(value);
    if (!active && theme === value && root.dataset.theme === value) return Promise.resolve({ theme: value, cancelled: false, mode: 'none' });
    if (active) end(active, true);
    theme = value;
    syncButtons(value);
    const selected = animate ? mode() : 'none';
    return new Promise((resolve, reject) => {
      const run = { theme: value, mode: selected, styles: [], frames: [], resolve };
      active = run;
      const width = root.clientWidth;
      const height = root.clientHeight;
      const origin = { x: point && Number.isFinite(point.x) ? point.x : width / 2,
        y: point && Number.isFinite(point.y) ? point.y : 28 };
      const radius = Math.hypot(Math.max(origin.x, width - origin.x), Math.max(origin.y, height - origin.y)) || 1;
      try {
        if (selected === 'ripple') ripple(run, origin, radius, width, height);
        else if (selected === 'view-transition') viewTransition(run, origin, radius);
        else direct(run);
      } catch (error) {
        try { apply(value); end(run); } catch (fallbackError) { end(run); reject(fallbackError); }
      }
    });
  }
  for (const button of buttons) {
    listen(button, 'click', event => {
      if (event.detail > 0) points.set(button, { x: event.clientX, y: event.clientY });
      else points.delete(button); // 键盘/程序调用不能复用先前指针坐标。
    }, true);
    listen(button, 'change', event => {
      if (event.target !== button || !valid(event.detail)) return;
      const point = points.get(button) || null;
      points.delete(button);
      setTheme(event.detail, { point });
    });
  }
  listen(system, 'change', () => { if (!preference) setTheme(system.matches ? 'dark' : 'light', { persist: false }); });
  listen(window, 'storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : null;
    setTheme(preference || (system.matches ? 'dark' : 'light'), { persist: false });
  });
  listen(window, 'resize', () => { if (active) direct(active); }, { passive: true });
  const api = {
    get theme() { return theme; },
    get preference() { return preference; },
    setTheme,
    followSystem() { persist(null); return setTheme(system.matches ? 'dark' : 'light', { persist: false }); },
    destroy() {
      if (destroyed) return;
      if (active) direct(active);
      cleanups.forEach(cleanup => cleanup());
      wave?.destroy();
      owners.delete(doc);
      destroyed = true;
    }
  };
  owners.set(doc, api);
  setTheme(preference || (system.matches ? 'dark' : 'light'), { persist: false, animate: false });
  return api;
}
