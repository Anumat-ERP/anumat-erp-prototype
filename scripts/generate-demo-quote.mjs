import { mkdirSync, writeFileSync } from 'node:fs';

// A labelled sample for the prototype, using only the details seeded in PR-1044.
// No vendor terms, signatures or approvals are represented as original content.
const text = (x, y, size, value, bold = false) => `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${value.replace(/[\\()]/g, '\\$&')}) Tj ET`;
const stream = [
  '0.97 0.97 0.97 rg 0 714 595 128 re f',
  '0.12 0.12 0.12 rg',
  text(48, 778, 18, 'ANUMAT', true),
  text(414, 781, 10, 'DEMO DOCUMENT', true),
  text(48, 739, 10, 'REQUEST ATTACHMENT / PR-1044'),
  text(48, 665, 25, 'Design software licences', true),
  '0.4 0.4 0.4 rg',
  text(48, 637, 11, 'Licence_Quote.pdf'),
  '0.88 0.88 0.88 RG 48 610 m 547 610 l S',
  text(48, 578, 10, 'REQUEST'), text(318, 578, 10, 'DEPARTMENT'),
  '0.12 0.12 0.12 rg',
  text(48, 556, 12, 'PR-1044', true), text(318, 556, 12, 'Product', true),
  text(48, 505, 13, 'Purchase summary', true),
  '0.4 0.4 0.4 rg',
  text(48, 478, 11, 'Annual licences for three designers.'),
  text(48, 455, 11, 'Replaces the monthly plan and saves about 18% a year.'),
  '0.97 0.97 0.97 rg 48 312 499 95 re f',
  '0.4 0.4 0.4 rg',
  text(68, 377, 10, 'REQUESTED AMOUNT'),
  '0.12 0.12 0.12 rg',
  text(68, 338, 27, '$2,160.00', true),
  '0.88 0.88 0.88 RG 48 267 m 547 267 l S',
  '0.4 0.4 0.4 rg',
  text(48, 237, 10, 'Sample attachment generated from the demo request details.'),
  text(48, 217, 10, 'This is not an original supplier quote or an approved purchase.'),
  text(48, 58, 9, 'Anumat prototype - demonstration only'), text(504, 58, 9, '1 / 1'),
].join('\n');
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
];
let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
mkdirSync('src/assets/documents', { recursive: true });
writeFileSync('src/assets/documents/licence-quote-demo.pdf', pdf);
