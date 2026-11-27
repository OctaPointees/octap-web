/** Up to two initials for an avatar: `Nguyễn Hoàng Anh` gives `NH`. */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('') || '?';
