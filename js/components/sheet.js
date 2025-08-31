let sheet, backdrop;
export function initSheet(){
  sheet = document.getElementById('sheet-container');
  backdrop = document.getElementById('overlay-backdrop');
  document.addEventListener('click', e=>{
    if(e.target.dataset.action === 'closeSheet') closeSheet();
  });
}
export function openSheet(title, html){
  sheet.innerHTML = `
    <div class="sheet__handle"></div>
    <div class="sheet__header">
      <h3>${title}</h3>
      <button class="icon-btn" data-action="closeSheet">×</button>
    </div>
    <div class="sheet__body">${html}</div>`;
  sheet.classList.remove('hidden');
  backdrop.classList.remove('hidden');
  backdrop.onclick = closeSheet;
}
export function closeSheet(){
  sheet.classList.add('hidden');
  backdrop.classList.add('hidden');
  backdrop.onclick = null;
}