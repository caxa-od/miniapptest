import { navigate } from '../router.js';
let timerRef;
export function setupPending(section){
  const timer = section.querySelector('#pendingTimer');
  let sec = 30;
  clearInterval(timerRef);
  timer.textContent = sec;
  timerRef = setInterval(()=>{
    sec--;
    timer.textContent = sec;
    if(sec<=0){clearInterval(timerRef);navigate('success');}
  },1000);
  section.querySelector('[data-action="refreshStatus"]').addEventListener('click',()=>{
    navigate('success');
  });
}