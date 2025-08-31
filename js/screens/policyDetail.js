export function setupPolicyDetail(section){
  section.querySelector('#policyTitle').textContent = 'Поліс #123456';
  section.querySelector('#policyMain').innerHTML = `
    <li><span>Продукт</span><strong>ОСЦПВ</strong></li>
    <li><span>Страховик</span><strong>USG</strong></li>
    <li><span>Період</span><strong>01.09.2025–31.08.2026</strong></li>`;
  section.querySelector('#policyVehicle').innerHTML = `
    <li><span>Номер</span><strong>AA1234AA</strong></li>
    <li><span>VIN</span><strong>TM9BY...</strong></li>`;
}