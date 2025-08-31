import { loadScreen } from './screens/loadScreen.js';

const loaded = new Set();
export function initRouter(){
  document.addEventListener('click', async e=>{
    const btn = e.target.closest('[data-nav]');
    if(!btn) return;
    const target = btn.dataset.nav;
    await ensureScreen(target);
    navigate(target);
  });
  window.addEventListener('popstate', e=>{
    const s = e.state?.screen;
    if(s) navigate(s,false);
  });
}

async function ensureScreen(name){
  if(loaded.has(name)) return;
  await loadScreen(name);
  loaded.add(name);
}

export function navigate(name, push=true){
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.toggle('active', s.dataset.screen === name);
  });
  document.querySelectorAll('.tabbar-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.nav === name);
  });
  if(push) history.pushState({screen:name},'', '#'+name);
  window.scrollTo({top:0});
}