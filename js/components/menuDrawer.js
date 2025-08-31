export function initMenu(){
  const menu = document.getElementById('menu');
  const backdrop = document.getElementById('overlay-backdrop');
  document.addEventListener('click', e=>{
    if(e.target.dataset.action === 'openMenu'){
      open();
    }
    if(e.target.dataset.action === 'closeMenu'){
      close();
    }
  });
  function open(){
    menu.classList.add('open');
    backdrop.classList.remove('hidden');
    backdrop.onclick = close;
    menu.innerHTML = `
      <div class="menu-drawer__header">
        <div class="brand-slot">LOGO</div>
        <button class="icon-btn" data-action="closeMenu">×</button>
      </div>
      <ul class="menu-drawer__list">
        <li><button data-nav="support">Підтримка</button></li>
        <li><button data-nav="profile">Профіль</button></li>
      </ul>
      <div class="menu-drawer__footer">© 2025 Riskins</div>`;
  }
  function close(){
    menu.classList.remove('open');
    backdrop.classList.add('hidden');
    backdrop.onclick = null;
  }
}