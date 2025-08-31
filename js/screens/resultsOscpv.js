import { getOffers } from '../../state.js';
import { createOfferCard } from '../../components/offerCard.js';
import { navigate } from '../../router.js';

export function setupResultsOscpv(section){
  const list = section.querySelector('#oscpvOffers');
  list.innerHTML = '';
  const offers = getOffers('oscpv');
  offers.forEach(o=>{
    const card = createOfferCard(o, model=>{
      sessionStorage.setItem('selectedOffer', JSON.stringify(model));
      navigate('form-oscpv');
    });
    list.appendChild(card);
  });
}