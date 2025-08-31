import { navigate } from '../router.js';
export function setupFormGreen(section){
  const form = section.querySelector('#greenFullForm');
  form.addEventListener('submit', e=>{
    e.preventDefault();
    navigate('payment');
  });
}