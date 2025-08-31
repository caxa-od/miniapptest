export function createOfferCard(model,onBuy){
  const li = document.createElement('li');
  li.className = 'offer-card';
  li.innerHTML = `
    <div class="offer-card__main">
      <div class="offer-logo">${model.logo || 'LOGO'}</div>
      <div class="offer-prices">
        <div class="offer-prices__row">
          ${model.discount ? `<span class="discount-badge">${model.discount}%</span>`:''}
          ${model.oldPrice ? `<span class="old-price">${format(model.oldPrice)}</span>`:''}
        </div>
        <div class="current-price">${format(model.price)}</div>
        ${model.rating ? `<div class="meta-line"><span class="rating">★★★★★</span>${model.limit?`<span class="limit">${model.limit}</span>`:''}</div>`:''}
      </div>
      <div class="offer-actions">
        <button class="btn btn-primary" data-action="buy">Купити</button>
      </div>
    </div>
    <div class="offer-card__more">
      <button class="link-small" data-action="toggleMore">Додаткова інформація ▾</button>
      <div class="more-content" hidden>
        <p class="placeholder-block">Покриття / Виключення ...</p>
      </div>
    </div>`;
  li.addEventListener('click', e=>{
    if(e.target.dataset.action === 'toggleMore'){
      const mc = li.querySelector('.more-content');
      const hidden = mc.hasAttribute('hidden');
      hidden ? mc.removeAttribute('hidden') : mc.setAttribute('hidden','');
      e.target.textContent = hidden ? 'Згорнути ▲' : 'Додаткова інформація ▾';
    }
    if(e.target.dataset.action === 'buy'){
      onBuy && onBuy(model);
    }
  });
  return li;
}
function format(n){ return Number(n).toFixed(2)+' грн.'; }