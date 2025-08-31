import { navigate } from '../../router.js';
export function setupPayment(section){
  section.querySelector('[data-nav="pending"]').addEventListener('click', ()=>navigate('pending'));
}