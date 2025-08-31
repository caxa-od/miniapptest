import { setupCalcOscpv } from './calcOscpv.js';
import { setupResultsOscpv } from './resultsOscpv.js';
import { setupFormOscpv } from './formOscpv.js';
import { setupCalcGreen } from './calcGreen.js';
import { setupResultsGreen } from './resultsGreen.js';
import { setupFormGreen } from './formGreen.js';
import { setupPayment } from './payment.js';
import { setupPending } from './pending.js';
import { setupSuccess } from './success.js';
import { setupPolicies } from './policies.js';
import { setupPolicyDetail } from './policyDetail.js';
import { setupProfile } from './profile.js';
import { setupHome } from './home.js';
import { setupSupport } from './support.js';

export const screenEnhancers = {
  'home':setupHome,
  'calc-oscpv':setupCalcOscpv,
  'results-oscpv':setupResultsOscpv,
  'form-oscpv':setupFormOscpv,
  'calc-green':setupCalcGreen,
  'results-green':setupResultsGreen,
  'form-green':setupFormGreen,
  'payment':setupPayment,
  'pending':setupPending,
  'success':setupSuccess,
  'policies':setupPolicies,
  'policy-detail':setupPolicyDetail,
  'profile':setupProfile,
  'support':setupSupport
};