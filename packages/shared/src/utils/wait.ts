/** Resolves after `ms` milliseconds (at least 1), with the delay it waited. */
export function wait(ms = 500) {
  ms = Math.max(1, Math.round(ms));
  return new Promise<number>((res) => {
    setTimeout(() => res(ms), ms);
  });
}
