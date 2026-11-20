import { OctapError } from '@octap/internal-sdk';
import { fieldOfCoreError, type DraftErrors } from './benefit';

/** Every error a form can show, from the form's own checks or from Core. */
export function coreErrors(error: unknown): DraftErrors {
  if (!(error instanceof Error)) return {};
  if (error instanceof OctapError) {
    if (error.status === 403) return { form: 'Only the Owner can create or change rewards.' };
    if (error.status === 422)
      return { form: 'This organization has no loyalty program on-chain yet. Contact OctaP.' };
    // No status means no answer at all: offline, CORS or the 30 second timeout.
    if (error.status === null || error.status >= 500)
      return { form: 'Core could not complete the request. Try again.' };
    return { [fieldOfCoreError(error.message)]: error.message };
  }
  return { form: error.message };
}
