import { emptyDraft, suggestCode, type BenefitKind, type RewardDraft } from './benefit';

/** At most this many rows per file: each one is a separate create request. */
export const MAX_IMPORT_ROWS = 100;

const COLUMNS: { header: string; field: keyof RewardDraft }[] = [
  { header: 'type', field: 'kind' },
  { header: 'title', field: 'title' },
  { header: 'code', field: 'code' },
  { header: 'points_cost', field: 'pointsCost' },
  { header: 'value', field: 'value' },
  { header: 'max_discount_vnd', field: 'maxDiscountVnd' },
  { header: 'min_order_vnd', field: 'minOrderVnd' },
  { header: 'item', field: 'item' },
  { header: 'buy_quantity', field: 'buyQuantity' },
  { header: 'get_quantity', field: 'getQuantity' },
  { header: 'price_vnd', field: 'priceVnd' },
  { header: 'benefit', field: 'benefit' },
  { header: 'applies_to', field: 'appliesTo' },
  { header: 'total_supply', field: 'totalSupply' },
  { header: 'starts_on', field: 'startsOn' },
  { header: 'expires_on', field: 'expiresOn' },
  { header: 'description', field: 'description' },
];

const KIND_ALIASES: Record<string, BenefitKind> = {
  percent_off: 'PERCENT_OFF',
  percent: 'PERCENT_OFF',
  amount_off: 'AMOUNT_OFF',
  amount: 'AMOUNT_OFF',
  free_item: 'FREE_ITEM',
  buy_x_get_y: 'BUY_X_GET_Y',
  free_shipping: 'FREE_SHIPPING',
  free_delivery: 'FREE_SHIPPING',
  fixed_price: 'FIXED_PRICE',
  special_price: 'FIXED_PRICE',
  custom: 'CUSTOM',
};

/** One example row per kind, so the template documents itself. */
export const CSV_TEMPLATE = [
  COLUMNS.map((c) => c.header).join(','),
  'percent_off,20% off drinks,DRINKS-20,300,20,50000,200000,,,,,,Drinks only,100,,2027-12-31,',
  'amount_off,30000 off,SAVE-30K,400,30000,,150000,,,,,,,,,2027-12-31,',
  'free_item,A free latte,FREE-LATTE,500,,,,"Latte, size M",,,,,,50,,2027-12-31,',
  'buy_x_get_y,Buy 1 get 1 tea,B1G1-TEA,600,,,,Milk tea,1,1,,,,,,2027-12-31,',
  'free_shipping,Free delivery,FREE-SHIP,200,,20000,100000,,,,,,,,,2027-12-31,',
  'fixed_price,Combo 99k,COMBO-99K,350,,,,Burger and drink,,,99000,,,,,2027-12-31,',
  'custom,Spa afternoon,SPA-PASS,2000,,,,,,,,One 60-minute treatment,,10,,2027-12-31,Book 2 days ahead',
].join('\n');

/** RFC 4180 CSV: quoted fields may hold commas, quotes ("") and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  // A UTF-8 BOM, which Excel writes at the start of a CSV.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

export type ImportRow = { line: number; draft: RewardDraft; problem?: string };

/** Turns a CSV file into reward drafts; a row it cannot read carries a `problem`. */
export function draftsFromCsv(text: string): { rows: ImportRow[]; error?: string } {
  const [header, ...body] = parseCsv(text);
  if (!header) return { rows: [], error: 'The file is empty.' };
  const index = header.map((h) => h.trim().toLowerCase());
  const missing = ['type', 'title', 'points_cost'].filter((h) => !index.includes(h));
  if (missing.length)
    return { rows: [], error: `Missing column(s): ${missing.join(', ')}. Use the template.` };
  if (body.length > MAX_IMPORT_ROWS)
    return {
      rows: [],
      error: `At most ${MAX_IMPORT_ROWS} rewards per file; this one has ${body.length}.`,
    };
  const rows = body.map((cells, i): ImportRow => {
    const value = (header: string) => (cells[index.indexOf(header)] ?? '').trim();
    const kind =
      KIND_ALIASES[value('type').toLowerCase()] ??
      KIND_ALIASES[value('type').toLowerCase().replace(/\s+/g, '_')];
    const draft = emptyDraft(kind ?? 'CUSTOM');
    for (const { header: column, field } of COLUMNS) {
      if (field === 'kind' || index.indexOf(column) < 0) continue;
      const cell = value(column);
      if (cell) draft[field] = cell as never;
    }
    if (!draft.code) draft.code = suggestCode(draft.title);
    return {
      line: i + 2,
      draft,
      ...(kind ? {} : { problem: `Unknown type "${value('type')}"` }),
    };
  });
  return { rows };
}
