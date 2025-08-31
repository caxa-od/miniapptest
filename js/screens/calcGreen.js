import { navigate } from '../router.js';
import { setOffers } from '../state.js';

export function setupCalcGreen(section){
  const btn = section.querySelector('[data-action="calc"]');
  btn.addEventListener('click', ()=>{
    setOffers('green',[
      {id:'g1',price:9992,oldPrice:10810,discount:7,logo:'Страх',rating:0},
      {id:'g2',price:10450,oldPrice:null,discount:0,logo:'Green',rating:0}
    ]);
    navigate('results-green');
  });
}