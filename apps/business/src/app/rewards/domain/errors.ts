import { OctapError } from '@octap/internal-sdk';
import type { DraftErrors, DraftField } from './draft';

/**
 * Core answers a 400 or 409 with one sentence that starts with the field it is about. Map it to
 * the form field, so the message shows under the right input.
 */
export function fieldOfCoreError(message: string): DraftField | 'form' {
  const rules: [RegExp, DraftField][] = [
    [/^code\b|code .*already exists|^Voucher with code/i, 'code'],
    [/^title\b|^code, title/i, 'title'],
    [/^description\b|must fit in \d+ bytes/i, 'description'],
    [/^pointsCost\b/i, 'pointsCost'],
    [/^discountValue\b|^Percentage discount/i, 'value'],
    [/^totalSupply\b|^Supply cannot/i, 'totalSupply'],
    [/^perMemberLimit\b/i, 'perMemberLimit'],
    [/^validForDays\b/i, 'validForDays'],
    [/^startsAt\b/i, 'startsOn'],
    [/^expiresAt\b|stay valid for at least 24 hours/i, 'closesOn'],
  ];
  return rules.find(([pattern]) => pattern.test(message))?.[1] ?? 'form';
}

/** Every error the form can show from a failed Core request, keyed by the field it is about. */
export function coreErrors(error: unknown): DraftErrors {
  if (!(error instanceof Error)) return {};
  if (!(error instanceof OctapError)) return { form: error.message };
  if (error.status === 403) return { form: "You can't make this change to the voucher." };
  if (error.status === 422)
    return { form: 'This organization has no loyalty program on-chain yet. Contact OctaP.' };
  // No status means no answer at all: offline, CORS or the 30 second timeout.
  if (error.status === null || error.status >= 500)
    return { form: 'Core could not complete the request. Try again.' };
  return { [fieldOfCoreError(error.message)]: error.message };
}

/** One message for a toast. */
export const coreMessage = (error: unknown) =>
  Object.values(coreErrors(error))[0] ?? 'Something went wrong.';

/** Shown when a review has no submission id: the list was loaded before it was sent. */
export const MISSING_APPROVAL =
  'This submission is not in the list yet. Reload the page and try again.';
