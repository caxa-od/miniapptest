const memory = {
  drafts:{},
  offers:{oscpv:[],green:[]},
  policies:[]
};

export function saveDraft(key,data){
  memory.drafts[key] = {...data, updated:Date.now()};
}
export function getDraft(key){
  return memory.drafts[key] || null;
}
export function setOffers(type,list){
  memory.offers[type] = list;
}
export function getOffers(type){
  return memory.offers[type];
}
export function addPolicy(p){
  memory.policies.push(p);
}
export function getPolicies(){
  return memory.policies;
}
window.__appState = memory;