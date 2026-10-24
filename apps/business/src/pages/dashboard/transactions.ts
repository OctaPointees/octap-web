export type Tx = {
  type: 'Earn' | 'Redeem' | 'Adjust';
  amount: string;
  member: string;
  channel: string;
  time: string;
  digest: string;
};

export const TRANSACTIONS: Tx[] = [
  { type: 'Earn', amount: '+52', member: 'Nguyễn Văn An · •••456', channel: 'POS', time: 'Oct 20, 2026 · 14:02 · 2m ago', digest: '0x4a7f1e9c2d8b6301ffa2c5e8b9d0714a8f23e291' },
  { type: 'Redeem', amount: '-180', member: 'Trần Thị Bích · •••091', channel: 'SDK', time: 'Oct 20, 2026 · 13:50 · 14m ago', digest: '0x91c3d07a5be2f4486a1d9c03e7b52fa6140d8c77' },
  { type: 'Earn', amount: '+118', member: 'Lê Minh Quân · •••233', channel: 'Dashboard', time: 'Oct 20, 2026 · 13:38 · 26m ago', digest: '0x7be20f4d1a93c85e6d0b42a1f9873ce05a6d1b34' },
  { type: 'Adjust', amount: '+25', member: 'Phạm Gia Hân · •••778', channel: 'Dashboard', time: 'Oct 20, 2026 · 13:23 · 41m ago', digest: '0x2d85a1c0e7f94b3a6c1d08e52fb7a49d0c63e1f8' },
];

