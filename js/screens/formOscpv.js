import { navigate } from '../../router.js';

export function setupFormOscpv(section){
  const form = section.querySelector('#oscpvFullForm');
  const periodBox = section.querySelector('#oscpvPeriodSummary');
  periodBox.textContent = '01.09.2025 – 31.08.2026 (12 місяців)';
  form.addEventListener('submit', e=>{
    e.preventDefault();
    navigate('payment');
  });
}