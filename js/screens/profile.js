export function setupProfile(section){
  section.querySelector('[data-action="logout"]').addEventListener('click',()=>{
    alert('Сесія завершена (demo).');
  });
}