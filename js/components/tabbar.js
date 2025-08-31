import { navigate } from '../router.js';
export function initTabbar(){
  document.querySelectorAll('.tabbar-btn').forEach(b=>{
    b.addEventListener('click',()=>navigate(b.dataset.nav));
  });
}