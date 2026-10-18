import '../components/theme-button.js';

const root = document.documentElement;
const button = document.querySelector('theme-button');
const embedded = root.dataset.embedded === 'true';

if (embedded) {
  // 对比页是唯一状态源；此分支不创建存储/系统监听或页面动效。
  button.setAttribute('size', '1.5');
  button.addEventListener('change', event => {
    if (event.detail !== 'light' && event.detail !== 'dark') return;
    parent.postMessage({ type:'shiran-demo-change', theme:event.detail, point:event.point || null }, location.origin);
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'shiran-demo-theme') return;
    const theme = event.data.theme;
    if (theme !== 'light' && theme !== 'dark') return;
    root.dataset.theme = theme;
    button.setAttribute('value', theme);
  });
  window.demo = { embedded:true };
} else {
  const [{ createThemeController }, { createFlowWave }] = await Promise.all([
    import('../components/theme-controller.js'), import('../adapters/flow-wave.js')
  ]);
  const content = document.querySelector('#content');
  const header = document.querySelector('header');
  const wave = createFlowWave({ content, shells:[document.body,header], targetSelector:'body,header,button,h1,h2,p,a' });
  const controller = createThemeController({ storageKey:'shiran-v5-demo', wave, surfaces:[header,content], backgrounds:{ light:'#f8fafc', dark:'#0f172a' } });
  const status = document.querySelector('#status');
  const updateStatus = () => { status.textContent = controller.preference ? '已保存偏好 · 点击“跟随系统”可恢复自动切换' : '当前跟随系统主题'; };
  button.addEventListener('change', updateStatus);
  document.querySelector('#system').addEventListener('click', () => { controller.followSystem(); updateStatus(); });
  window.addEventListener('storage', updateStatus);
  updateStatus();
  window.demo = { embedded:false, controller, wave };
}
