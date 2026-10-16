/**
 * 普通长文流的主题颜色波坐标缓存；不负责修改主题、绘制或接管点击。
 *
 * content 的直接子块必须按普通文档流纵向排序；多列、绝对定位或虚拟列表
 * 不能直接套用本索引。超大单块仍可能包含较多目标，不保证目标数量恒定。
 * 动态增删直接子块后调用 refresh()；其他宿主布局变化调用 invalidate()。
 * getTargets() 只返回当前缓存，不会临时扫描或测量正文；调用方不要修改它。
 */
export function createFlowWave(options = {}) {
  const {
    content = null,
    shells = [],
    targetSelector,
    excludeSelector = '[data-theme-static],pre *',
    fixedImageSelector = '[data-theme-image-frame] > img',
    ignoreScrollSelector = '[data-theme-static],pre',
  } = options;
  if (typeof targetSelector !== 'string' || !targetSelector.trim()) {
    throw new TypeError('createFlowWave requires targetSelector');
  }

  const roots = [...new Set(shells.filter(Boolean))];
  const doc = content?.ownerDocument || roots[0]?.ownerDocument || document;
  const win = doc.defaultView;
  // 仅校验选择器语法，不执行 document / 全文 querySelectorAll。
  const probe = doc.createElement('div');
  [targetSelector, excludeSelector, fixedImageSelector, ignoreScrollSelector]
    .filter(Boolean).forEach(selector => probe.matches(selector));

  const visible = new Map();
  const counters = { created: 0, disconnected: 0, geometry: 0, targets: 0 };
  let blocks = [];
  let observer = null;
  let timer = null;
  let idle = null;
  let destroyed = false;
  let generation = 0;
  const supported = typeof win.IntersectionObserver === 'function';

  function cancelPending() {
    if (timer !== null) win.clearTimeout(timer);
    if (idle !== null && win.cancelIdleCallback) win.cancelIdleCallback(idle);
    timer = idle = null;
  }

  function clearCoordinates() {
    if (observer) {
      observer.disconnect();
      observer = null;
      counters.disconnected++;
    }
    visible.clear();
    counters.targets = 0;
  }

  function measure(element) {
    counters.geometry++;
    return element.getBoundingClientRect();
  }

  function excluded(element) {
    return Boolean(excludeSelector && element.closest(excludeSelector));
  }

  function collect(root, targets, shell = false) {
    const pending = [root];
    while (pending.length) {
      const element = pending.pop();
      if (!element.isConnected || excluded(element) ||
          win.getComputedStyle(element).display === 'none') continue;
      const folded = element.closest('details:not([open])');
      if (folded && element !== folded && !element.closest('summary')) continue;
      if (element.matches(targetSelector)) targets.add(element);
      // 代码框本身可换色；高亮 token 子树不应被遍历或观察。
      // body/html 即使误作为 shell 传入，也仅收集自身，不递归整章。
      if (element.tagName === 'PRE' || (shell && element === content) || element === doc.body ||
          element === doc.documentElement) continue;
      for (let i = element.children.length - 1; i >= 0; i--) {
        const child = element.children[i];
        // 宽泛的布局 shell 也不能再次递归整个 content。
        if (shell && child === content) continue;
        pending.push(child);
      }
    }
  }

  function selectTargets(version) {
    if (destroyed || version !== generation || !supported) return;
    const targets = new Set();
    roots.forEach(root => collect(root, targets, true));

    const viewportHeight = doc.documentElement.clientHeight;
    const margin = 120;
    const rectangles = new Map();
    function rectAt(index) {
      if (!rectangles.has(index)) rectangles.set(index, measure(blocks[index]));
      return rectangles.get(index);
    }
    function hasBox(rect) { return rect.width > 0 && rect.height > 0; }

    if (content?.isConnected && !excluded(content) && hasBox(measure(content))) {
      let low = 0;
      let high = blocks.length;
      // 普通流二分通常只测 O(log N) 个块，再测视口附近的少量块。
      // 零矩形不能当作文档坐标0；连续隐藏/空块需向前探查，极端情况下
      // 不保证严格 O(log N)。不以预先测量全部子块换取这个边界。
      while (low < high) {
        const middle = (low + high) >> 1;
        let at = middle;
        while (at < high && !hasBox(rectAt(at))) at++;
        if (at === high) { high = middle; continue; }
        if (rectAt(at).bottom < -margin) low = at + 1;
        else high = at;
      }
      for (let index = low; index < blocks.length; index++) {
        const rect = rectAt(index);
        if (!hasBox(rect)) continue;
        if (rect.top > viewportHeight + margin) break;
        if (rect.bottom >= -margin) collect(blocks[index], targets);
      }
    }

    const next = new win.IntersectionObserver(entries => {
      // disconnect 后排队中的旧回调不得污染下一轮坐标。
      if (destroyed || observer !== next || version !== generation) return;
      entries.forEach(entry => {
        const element = entry.target;
        const hit = entry.intersectionRect;
        if (!entry.isIntersecting || hit.width <= 0 || hit.height <= 0 ||
            win.getComputedStyle(element).visibility === 'hidden') {
          visible.delete(element);
          return;
        }
        const rect = entry.boundingClientRect;
        visible.set(element, {
          left: rect.left, top: rect.top, width: rect.width, height: rect.height,
        });
      });
    }, { root: null, rootMargin: '0px', threshold: 0 });
    observer = next;
    counters.created++;
    counters.targets = targets.size;
    targets.forEach(element => next.observe(element));
  }

  function invalidate(delay = 140) {
    if (destroyed) return;
    cancelPending();
    const version = ++generation;
    // 滚动刚发生时旧坐标已不可靠；点击期间宁用宿主固定少量 fallback。
    clearCoordinates();
    if (!supported) return;
    timer = win.setTimeout(() => {
      timer = null;
      if (destroyed || version !== generation) return;
      if (win.requestIdleCallback) {
        idle = win.requestIdleCallback(() => {
          idle = null;
          selectTargets(version);
        }, { timeout: 1000 });
      } else {
        selectTargets(version);
      }
    }, Math.max(0, delay));
  }

  function refresh() {
    if (destroyed) return;
    // 复制直接子块索引；不逐块读取样式或几何，不扫描正文后代。
    blocks = content ? Array.from(content.children) : [];
    invalidate(0);
  }

  function owns(element) {
    return Boolean(content?.contains(element) || roots.some(root => root.contains(element)));
  }

  function onScroll(event) {
    const element = event.target;
    if (element?.nodeType === 1) {
      if (ignoreScrollSelector && element.closest(ignoreScrollSelector)) return;
      // 正文祖先的独立滚动容器也会移动缓存坐标；表格横滚不能过滤。
      if (!owns(element) && !element.contains(content) &&
          !roots.some(root => element.contains(root))) return;
    }
    invalidate();
  }

  function onToggle(event) {
    if (event.target?.tagName === 'DETAILS' && owns(event.target)) invalidate(80);
  }

  function onLoad(event) {
    const image = event.target;
    if (image?.tagName !== 'IMG' || !owns(image)) return;
    // 此标记是宿主保证几何固定的契约，不是给任意图片跳过刷新的开关。
    if (fixedImageSelector && image.matches(fixedImageSelector)) return;
    invalidate();
  }

  function onResize() { invalidate(); }
  const scrollOptions = { capture: true, passive: true };
  if (supported) {
    doc.addEventListener('scroll', onScroll, scrollOptions);
    doc.addEventListener('toggle', onToggle, true);
    doc.addEventListener('load', onLoad, true);
    win.addEventListener('resize', onResize, { passive: true });
    // 不监听抽屉点击或全章 MutationObserver。常驻面板应只改自身状态。
    refresh();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    generation++;
    cancelPending();
    clearCoordinates();
    blocks = [];
    if (supported) {
      doc.removeEventListener('scroll', onScroll, scrollOptions);
      doc.removeEventListener('toggle', onToggle, true);
      doc.removeEventListener('load', onLoad, true);
      win.removeEventListener('resize', onResize);
    }
  }

  return {
    getTargets: () => visible,
    invalidate,
    refresh,
    destroy,
    // 仅本地只读操作计数；不含页面文字、URL或用户行为记录。
    stats: () => Object.freeze({ ...counters }),
  };
}
