import { navigate } from '../../router.js';
import { validatePlate } from '../../validation.js';
import { setOffers } from '../../state.js';

export function setupCalcOscpv(section){
  const plate = section.querySelector('input[name="plate"]');
  const btn = section.querySelector('[data-action="calc"]');
  function validate(){
    const val = (plate.value||'').toUpperCase();
    plate.value = val;
    btn.disabled = !validatePlate(val);
  }
  plate.addEventListener('input', validate);
  validate();
  btn.addEventListener('click', ()=>{
    // Заглушка предложений
    setOffers('oscpv',[
      {id:'1',price:3349,oldPrice:4294,discount:22,logo:'USG',rating:5,limit:'Без обмежень'},
      {id:'2',price:3702,oldPrice:4460,discount:17,logo:'АРХ',rating:5,limit:'Без обмежень'}
    ]);
    navigate('results-oscpv');
  });
}