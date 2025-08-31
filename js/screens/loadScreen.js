import { screenEnhancers } from './registry.js';

export async function loadScreen(name){
  const root = document.getElementById('app-root');
  if(root.querySelector(`.screen[data-screen="${name}"]`)) return;
  const resp = await fetch(`partials/${name}.html`);
  if(!resp.ok){console.error('Не найден partial', name);return;}
  const html = await resp.text();
  const wrap = document.createElement('div');
  wrap.innerHTML = html.trim();
  const section = wrap.querySelector('.screen');
  if(!section){console.warn('Нет .screen в partial', name);return;}
  root.appendChild(section);
  const enhance = screenEnhancers[name];
  if(enhance) enhance(section);
}