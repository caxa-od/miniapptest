export const patterns = {
  plate:/^[A-ZА-ЯІЇЄ]{2}\d{4}[A-ZА-ЯІЇЄ]{2}$/u,
  vin:/^[A-HJ-NPR-Z0-9]{17}$/,
  taxId:/^[0-9]{10}$/
};

export function validatePlate(v){return patterns.plate.test(v.toUpperCase());}
export function validateVin(v){return patterns.vin.test(v.toUpperCase());}
export function validateTaxId(v){return patterns.taxId.test(v);}

export function setFieldError(input,msg){
  let err = input.parentElement.querySelector('.error-msg');
  if(!err){
    err = document.createElement('small');
    err.className='error-msg';
    input.parentElement.appendChild(err);
  }
  if(msg){
    err.textContent = msg;
    err.hidden = false;
    input.classList.add('is-error');
  }else{
    err.hidden = true;
    input.classList.remove('is-error');
  }
}