import { getPolicies } from '../state.js';
import { navigate } from '../router.js';

export function setupPolicies(section){
  const list = section.querySelector('#policyList');
  list.innerHTML = '';
  const policies = getPolicies();
  if(!policies.length){
    const empty = document.createElement('div');
    empty.className='placeholder-block';
    empty.textContent='Немає полісів.';
    list.appendChild(empty);
    return;
  }
  policies.forEach(p=>{
    const li = document.createElement('li');
    li.className='policy-card';
    li.dataset.nav='policy-detail';
    li.innerHTML = `
      <div class="policy-icon">${p.type==='oscpv'?'A':'G'}</div>
      <div class="policy-info">
        <div class="policy-title">${p.title}</div>
        <div class="policy-meta">${p.statusText}</div>
      </div>
      <span class="status-badge ${p.status}">${p.statusText}</span>`;
    li.addEventListener('click',()=>navigate('policy-detail'));
    list.appendChild(li);
  });
}