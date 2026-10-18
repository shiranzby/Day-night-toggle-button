// Original sun, moon, clouds and stars from v4.0; page state belongs to the host.
const cloudPositions = [[-20, 10, 50], [-10, -25, 60], [20, -40, 60], [50, -35, 60], [75, -60, 75], [110, -50, 60]];
const starPositions = [[11, 39, 15], [39, 91, 15], [26, 19, 10], [37, 66, 10], [21, 75, 6], [51, 38, 6]];
const clouds = () => cloudPositions.map(([right, bottom, size]) => `<div class="cs" style="--right:${right}em;--bottom:${bottom}em;width:${size}em;height:${size}em"></div>`).join('');
const stars = starPositions.map(([top, left, size]) => `<div class="sr" style="top:${top}em;left:${left}em;width:${size}em;height:${size}em;--half:${size / 2}em"><div class="ss"></div><div class="ss"></div><div class="ss"></div><div class="ss"></div></div>`).join('');

const template = document.createElement('template');
template.innerHTML = `
<style>
  :host { display:inline-grid; place-items:center; min-width:44px; min-height:44px; vertical-align:middle; line-height:0; border-radius:100px; cursor:pointer; -webkit-tap-highlight-color:transparent; }
  :host(:focus-visible) { outline:2px solid currentColor; outline-offset:5px; }
  :host([disabled]) { cursor:default; }
  *, *::before, *::after { box-sizing:border-box; }
  .wrap { position:relative; display:inline-block; }
  .ct { width:180em; height:70em; position:relative; overflow:hidden; border-radius:100em; background:rgba(70,133,192,1); box-shadow:inset 0 0 5em 3em rgba(0,0,0,.5); transition:background .7s cubic-bezier(0,.5,1,1); }
  .mb { margin:7.5em 0 0 7.5em; width:55em; height:55em; position:relative; z-index:3; border-radius:50%; background:rgba(255,195,35,1); box-shadow:3em 3em 5em rgba(0,0,0,.5),inset -3em -5em 3em -3em rgba(0,0,0,.5),inset 4em 5em 2em -2em rgba(255,230,80,1); transition:transform 1s cubic-bezier(.56,1.35,.52,1),background 1s,box-shadow 1s; }
  .mo { position:absolute; background:rgba(150,160,180,1); box-shadow:inset 0 0 1em 1em rgba(0,0,0,.3); border-radius:50%; transition:opacity .5s; opacity:0; }
  .mo:nth-child(1) { top:7.5em; left:25em; width:12.5em; height:12.5em; }
  .mo:nth-child(2) { top:20em; left:7.5em; width:20em; height:20em; }
  .mo:nth-child(3) { top:32.5em; left:32.5em; width:12.5em; height:12.5em; }
  .db { position:absolute; border-radius:50%; transition:transform 1s cubic-bezier(.56,1.35,.52,1); }
  .db:nth-of-type(2) { top:-20em; left:-20em; width:110em; height:110em; background:rgba(255,255,255,.2); z-index:-2; }
  .db:nth-of-type(3) { top:-32.5em; left:-17.5em; width:135em; height:135em; background:rgba(255,255,255,.1); z-index:-3; }
  .db:nth-of-type(4) { top:-45em; left:-15em; width:160em; height:160em; background:rgba(255,255,255,.05); z-index:-4; }
  .cl { transform:translateY(10em); z-index:-2; }
  .cll { position:absolute; right:0; bottom:25em; opacity:.5; z-index:-3; }
  .settled .cll { transform:translateY(10em); }
  .cl, .cll { transition:transform 1s cubic-bezier(.56,1.35,.52,1); }
  .cs { position:absolute; right:var(--right); bottom:var(--bottom); background:#fff; border-radius:50%; z-index:-1; transition:right 1s,bottom 1s; }
  .st { transform:translateY(-125em); opacity:0; z-index:-2; transition:transform 1s cubic-bezier(.56,1.35,.52,1),opacity 1s; }
  .sr { position:absolute; transition:top 1s,left 1s; }
  .ss { float:left; width:var(--half); height:var(--half); background-image:radial-gradient(circle var(--half) at left top,transparent var(--half),#fff); }
  .ss:nth-child(2) { background-image:radial-gradient(circle var(--half) at right top,transparent var(--half),#fff); }
  .ss:nth-child(3) { background-image:radial-gradient(circle var(--half) at left bottom,transparent var(--half),#fff); }
  .ss:nth-child(4) { background-image:radial-gradient(circle var(--half) at right bottom,transparent var(--half),#fff); }
  .dark { background:rgba(25,30,50,1); }
  .dark .mb { transform:translateX(110em); background:rgba(195,200,210,1); box-shadow:3em 3em 5em rgba(0,0,0,.5),inset -3em -5em 3em -3em rgba(0,0,0,.5),inset 4em 5em 2em -2em rgba(255,255,210,1); }
  .dark .db:nth-of-type(2) { transform:translateX(110em); }
  .dark .db:nth-of-type(3) { transform:translateX(80em); }
  .dark .db:nth-of-type(4) { transform:translateX(50em); }
  .dark .cl, .dark .cll { transform:translateY(80em); }
  .dark .mo { opacity:1; }
  .dark .st { transform:translateY(-62.5em); opacity:1; }
  @media (hover:hover) and (pointer:fine) {
    .hover:not(.dark) .mb, .hover:not(.dark) .db:nth-of-type(2) { transform:translateX(10em); }
    .hover:not(.dark) .db:nth-of-type(3) { transform:translateX(7em); }
    .hover:not(.dark) .db:nth-of-type(4) { transform:translateX(4em); }
    .hover:not(.dark) .cl .cs:nth-child(1) { right:-24em; bottom:10em; }
    .hover:not(.dark) .cl .cs:nth-child(2) { right:-12em; bottom:-27em; }
    .hover:not(.dark) .cl .cs:nth-child(3) { right:17em; bottom:-43em; }
    .hover:not(.dark) .cl .cs:nth-child(4) { right:46em; bottom:-39em; }
    .hover:not(.dark) .cl .cs:nth-child(5) { right:70em; bottom:-65em; }
    .hover:not(.dark) .cl .cs:nth-child(6) { right:109em; bottom:-54em; }
    .hover:not(.dark) .cll .cs:nth-child(1) { right:-23em; bottom:10em; }
    .hover:not(.dark) .cll .cs:nth-child(2) { right:-11em; bottom:-26em; }
    .hover:not(.dark) .cll .cs:nth-child(3) { right:18em; bottom:-42em; }
    .hover:not(.dark) .cll .cs:nth-child(4) { right:47em; bottom:-38em; }
    .hover:not(.dark) .cll .cs:nth-child(5) { right:74em; bottom:-64em; }
    .hover:not(.dark) .cll .cs:nth-child(6) { right:110em; bottom:-55em; }
    .hover.dark .mb, .hover.dark .db:nth-of-type(2) { transform:translateX(100em); }
    .hover.dark .db:nth-of-type(3) { transform:translateX(73em); }
    .hover.dark .db:nth-of-type(4) { transform:translateX(46em); }
    .hover.dark .sr:nth-child(1) { top:10em !important; left:36em !important; }
    .hover.dark .sr:nth-child(2) { top:40em !important; left:87em !important; }
    .hover.dark .sr:nth-child(3) { top:26em !important; left:16em !important; }
    .hover.dark .sr:nth-child(4) { top:38em !important; left:63em !important; }
    .hover.dark .sr:nth-child(5) { top:20.5em !important; left:72em !important; }
    .hover.dark .sr:nth-child(6) { top:51.5em !important; left:35em !important; }
  }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { transition:none !important; animation:none !important; } }
</style>
<div class="wrap" aria-hidden="true"><div class="ct"><div class="mb"><div class="mo"></div><div class="mo"></div><div class="mo"></div></div><div class="db"></div><div class="db"></div><div class="db"></div><div class="cl">${clouds()}</div><div class="cll">${clouds()}</div><div class="st">${stars}</div></div></div>`;

class ThemeButton extends HTMLElement {
  static observedAttributes = ['value', 'size', 'disabled'];

  constructor() {
    super();
    const shadow = this.attachShadow({mode:'closed'});
    shadow.append(template.content.cloneNode(true));
    this._wrapper = shadow.querySelector('.wrap');
    this._scene = shadow.querySelector('.ct');
    this._hoverMedia = matchMedia('(hover:hover) and (pointer:fine)');
    this._lastToggle = -Infinity;
    this._wasDisabled = false;
    this.addEventListener('click', event => {
      if (this.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      this._activate(event);
    }, true);
    this.addEventListener('keydown', event => {
      if (!['Enter', ' ', 'Spacebar'].includes(event.key)) return;
      event.preventDefault();
      if (this.disabled) event.stopImmediatePropagation();
      else if (!event.repeat) this._activate(event);
    });
    shadow.querySelector('.mb').addEventListener('mousemove', () => {
      if (!this.disabled && this._hoverMedia.matches && performance.now() - this._lastToggle >= 500) this._scene.classList.add('hover');
    });
    shadow.querySelector('.mb').addEventListener('mouseleave', () => this._scene.classList.remove('hover'));
  }

  connectedCallback() {
    // Support properties assigned before this custom element was registered.
    for (const property of ['value', 'size', 'disabled']) {
      if (Object.prototype.hasOwnProperty.call(this, property)) {
        const value = this[property];
        delete this[property];
        this[property] = value;
      }
    }
    if (!this.hasAttribute('value')) this.value = this.ownerDocument.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    this.setAttribute('role', 'switch');
    if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) this.setAttribute('aria-label', '切换日夜主题');
    if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
    this._render();
  }

  disconnectedCallback() {
    this._scene.classList.remove('hover');
  }

  attributeChangedCallback() {
    this._render();
  }

  get value() { return this.getAttribute('value') === 'dark' ? 'dark' : 'light'; }
  set value(value) { this.setAttribute('value', value === 'dark' ? 'dark' : 'light'); }
  get size() {
    const value = Number(this.getAttribute('size'));
    return Number.isFinite(value) && value > 0 ? value : 3;
  }
  set size(value) { this.setAttribute('size', value); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(value) { this.toggleAttribute('disabled', Boolean(value)); }

  click() {
    if (!this.disabled) super.click();
  }

  _render() {
    this._wrapper.style.fontSize = `${this.size / 3}px`;
    if (this._renderedTheme !== undefined && this._renderedTheme !== this.value) this._scene.classList.add('settled');
    this._renderedTheme = this.value;
    this._scene.classList.toggle('dark', this.value === 'dark');
    this._scene.classList.remove('hover');
    this.setAttribute('aria-checked', String(this.value === 'dark'));
    this.setAttribute('aria-disabled', String(this.disabled));
    if (this.disabled && !this._wasDisabled) {
      this._enabledTabIndex = this.getAttribute('tabindex') ?? '0';
      this.setAttribute('tabindex', '-1');
    } else if (!this.disabled && this._wasDisabled) {
      this.setAttribute('tabindex', this._enabledTabIndex);
    }
    this._wasDisabled = this.disabled;
  }

  _activate(source) {
    this._lastToggle = performance.now();
    this.value = this.value === 'dark' ? 'light' : 'dark';
    const point = source?.type === 'click' && source.detail > 0 &&
      Number.isFinite(source.clientX) && Number.isFinite(source.clientY)
      ? {x:source.clientX, y:source.clientY} : null;
    const event = new CustomEvent('change', {detail:this.value, bubbles:true, composed:true});
    // 同步派发前绑定本次坐标，不依赖宿主与控制器 click 监听的注册顺序。
    Object.defineProperty(event, 'point', {value:point, enumerable:true});
    this.dispatchEvent(event);
  }
}

if (!customElements.get('theme-button')) customElements.define('theme-button', ThemeButton);
