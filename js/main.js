import { initRouter, navigate } from './router.js';
import { initMenu } from './components/menuDrawer.js';
import { initTabbar } from './components/tabbar.js';
import { initSheet } from './components/sheet.js';
import { loadScreen } from './screens/loadScreen.js';
import './state.js';

async function bootstrap(){
  initRouter();
  initMenu();
  initTabbar();
  initSheet();
  await loadScreen('home');
  navigate('home');
}
bootstrap();