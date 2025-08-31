import { getOffers } from '../state.js';
import { createOfferCard } from '../components/offerCard.js';
import { navigate } from '../router.js';

export function setupResultsGreen(section){
  const list = section.querySelector('#greenOffers');
  list.innerHTML = '';
  const offers = getOffers('green');
  offers.forEach(o=>{
    const card = createOfferCard(o, model=>{
      sessionStorage.setItem('selectedOffer', JSON.stringify(model));
      navigate('form-green');
    });
    list.appendChild(card);
  });
}