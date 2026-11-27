import { MAX_VALID_FOR_DAYS } from './kinds';
import { CSV_TEMPLATE, CSV_TYPES, MAX_IMPORT_ROWS, parseCsv } from './csv';

/**
 * The CSV template as an Excel workbook, so a merchant filling it in Excel or Google Sheets gets a
 * drop-down for `type` and cells that only take a date or a whole number. They save it as CSV and
 * import it as before: the importer itself only reads CSV. Built in the browser from the CSV
 * template, so the two always have the same columns and example rows.
 */
export function buildXlsxTemplate(): Uint8Array {
  const [header, ...rows] = parseCsv(CSV_TEMPLATE);
  const sheet = templateSheet(header, rows);
  const guide = guideSheet();
  return zip([
    ['[Content_Types].xml', CONTENT_TYPES],
    ['_rels/.rels', ROOT_RELS],
    ['xl/workbook.xml', WORKBOOK],
    ['xl/_rels/workbook.xml.rels', WORKBOOK_RELS],
    ['xl/styles.xml', STYLES],
    ['xl/worksheets/sheet1.xml', sheet],
    ['xl/worksheets/sheet2.xml', guide],
  ]);
}

/** Columns that hold a whole number, with the smallest and largest value a cell may take. */
const WHOLE_NUMBERS: Record<string, [number, number]> = {
  points_cost: [0, 2_000_000_000],
  total_supply: [1, 2_000_000_000],
  per_member_limit: [1, 2_000_000_000],
  valid_for_days: [1, MAX_VALID_FOR_DAYS],
  buy_quantity: [1, 1000],
  get_quantity: [1, 1000],
};
const DATES = new Set(['claims_open_on', 'claims_close_on']);
const NUMBERS = new Set([
  ...Object.keys(WHOLE_NUMBERS),
  'value',
  'max_discount_vnd',
  'min_order_vnd',
  'price_vnd',
]);
/** Rows a merchant can fill: the header, then up to the importer's limit. */
const LAST_ROW = MAX_IMPORT_ROWS + 1;

/** Style ids in STYLES: 0 normal, 1 bold header, 2 date as YYYY-MM-DD, 3 text (keeps leading zeros). */
const BOLD = 1;
const DATE = 2;
const TEXT = 3;

const letter = (index: number): string =>
  (index >= 26 ? letter(Math.floor(index / 26) - 1) : '') + String.fromCharCode(65 + (index % 26));

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const textCell = (ref: string, text: string, style = 0) =>
  `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${escape(text)}</t></is></c>`;

/** Days since 30 Dec 1899, how spreadsheets store a date. */
const serialOf = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 86_400_000;
};

function templateSheet(header: string[], rows: string[][]): string {
  const cells = (cells: string[], row: number) =>
    cells
      .map((value, i) => {
        const ref = `${letter(i)}${row}`;
        const column = header[i];
        if (!value) return DATES.has(column) ? `<c r="${ref}" s="${DATE}"/>` : '';
        if (DATES.has(column)) return `<c r="${ref}" s="${DATE}"><v>${serialOf(value)}</v></c>`;
        if (NUMBERS.has(column) && /^\d+(\.\d+)?$/.test(value))
          return `<c r="${ref}"><v>${value}</v></c>`;
        return textCell(ref, value, TEXT);
      })
      .join('');
  const sheetRows = [
    `<row r="1">${header.map((name, i) => textCell(`${letter(i)}1`, name, BOLD)).join('')}</row>`,
    ...rows.map((cells_, i) => `<row r="${i + 2}">${cells(cells_, i + 2)}</row>`),
  ].join('');
  const range = (column: string) => {
    const at = letter(header.indexOf(column));
    return `${at}2:${at}${LAST_ROW}`;
  };
  const validations = [
    `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Unknown type" error="Pick a type from the list." promptTitle="type" prompt="Pick the kind of voucher; the Guide sheet says which columns it needs." showInputMessage="1" sqref="${range('type')}"><formula1>"${CSV_TYPES.join(',')}"</formula1></dataValidation>`,
    ...[...DATES].map(
      (column) =>
        `<dataValidation type="date" operator="greaterThan" allowBlank="1" showErrorMessage="1" errorTitle="Not a date" error="Enter a date, e.g. 2027-12-31." sqref="${range(column)}"><formula1>${serialOf('2000-01-01')}</formula1></dataValidation>`,
    ),
    ...Object.entries(WHOLE_NUMBERS).map(
      ([column, [min, max]]) =>
        `<dataValidation type="whole" operator="between" allowBlank="1" showErrorMessage="1" errorTitle="Not a whole number" error="Enter a whole number from ${min} to ${max}." sqref="${range(column)}"><formula1>${min}</formula1><formula2>${max}</formula2></dataValidation>`,
    ),
  ];
  // Date cells keep the YYYY-MM-DD format down the whole column, so a date typed later looks the same.
  const cols = header
    .map((name, i) => {
      const width = Math.max(12, name.length + 2);
      const style = DATES.has(name)
        ? ` style="${DATE}"`
        : NUMBERS.has(name)
          ? ''
          : ` style="${TEXT}"`;
      return `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"${style}/>`;
    })
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${sheetRows}</sheetData><dataValidations count="${validations.length}">${validations.join('')}</dataValidations></worksheet>`;
}

/** What each type needs, and how to turn the workbook into a CSV to import. */
const GUIDE: string[][] = [
  ['How to use this template'],
  ['1. Fill one row per voucher on the Vouchers sheet (at most 100). Replace the example rows.'],
  [
    '2. Pick a type from the drop-down. Dates are YYYY-MM-DD; in Google Sheets, double-click a date cell to pick one.',
  ],
  ['3. Save as CSV: Excel › File › Save as › CSV UTF-8. Google Sheets › File › Download › CSV.'],
  ['4. In OctaP, Vouchers › Import CSV, and choose that CSV file.'],
  [''],
  ['type', 'Voucher', 'Columns it needs'],
  ['percent_off', 'A percentage off', 'value (1–100); max_discount_vnd optional'],
  ['amount_off', 'An amount off, in VND', 'value'],
  ['free_item', 'A free item', 'item'],
  ['buy_x_get_y', 'Buy X get Y free', 'buy_quantity, get_quantity, item'],
  ['free_shipping', 'Free delivery', 'max_discount_vnd optional'],
  ['fixed_price', 'A special price', 'price_vnd, item'],
  ['custom', 'Any other gift', 'benefit'],
  [''],
  ['Every type', '', 'title and points_cost are required; code is made from the title when empty.'],
  [
    '',
    '',
    'min_order_vnd, applies_to, total_supply, per_member_limit, claims_open_on, claims_close_on, valid_for_days and description are optional.',
  ],
];

function guideSheet(): string {
  const rows = GUIDE.map(
    (cells, r) =>
      `<row r="${r + 1}">${cells
        .map((text, c) =>
          text ? textCell(`${letter(c)}${r + 1}`, text, r === 0 || r === 6 ? BOLD : 0) : '',
        )
        .join('')}</row>`,
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="16" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="3" width="70" customWidth="1"/></cols><sheetData>${rows}</sheetData></worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const WORKBOOK = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Vouchers" sheetId="1" r:id="rId1"/><sheet name="Guide" sheetId="2" r:id="rId2"/></sheets></workbook>`;

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

/* ------------------------------------------------- a zip with stored entries */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** A zip of `[path, text]` entries, stored without compression: the files are small. */
function zip(entries: [string, string][]): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const [path, text] of entries) {
    const name = encoder.encode(path);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, part) => n + part.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, part) => n + part.length, 0));
  let at = 0;
  for (const part of all) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
