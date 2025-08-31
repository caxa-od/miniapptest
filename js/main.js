import { initRouter, navigate } from './router.js';
import { initMenu } from './components/menuDrawer.js';
import { initTabbar } from './components/tabbar.js';
import { initSheet } from './components/sheet.js';
import { loadScreen } from './screens/loadScreen.js';
import './state.js';

console.log('[BOOT] main loaded at', location.href);

async function bootstrap(){
  try{
    initRouter();
    initMenu();
    initTabbar();
    initSheet();
    console.log('[BOOT] load home');
    await loadScreen('home');
    navigate('home');
    console.log('[BOOT] done');
  }catch(e){
    console.error('[BOOT ERROR]', e);
  }
}
bootstrap();