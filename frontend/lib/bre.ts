// Client-side mirror of the server's BRE, used ONLY for instant inline
// feedback while typing. The server re-runs the same checks and is the
// only source of truth for whether an application is actually accepted —
// this copy exists purely for UX, never for the real decision.
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export function calculateAge(dobStr: string): number {
  if (!dobStr) return NaN;
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}
