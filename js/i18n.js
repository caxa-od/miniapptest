let dict = {};
let current = 'ua';

export async function loadLocale(lang){
  const resp = await fetch(`i18n/${lang}.json`);
  if(resp.ok){
    dict = await resp.json();
    current = lang;
  }
}
export function t(path){
  return path.split('.').reduce((o,k)=>o && o[k], dict) || path;
}
export function getLang(){ return current; }