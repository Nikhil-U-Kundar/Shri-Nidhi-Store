import { jsPDF } from 'jspdf';
import type { Bill } from '@/entities/bill';
import { STORE } from '@/shared/config';

const PAGE_WIDTH_MM = 105; // A6-width receipt paper
const MARGIN_MM = 6;
const PAGE_HEIGHT_MM = 297;
const LINE_MM = 4.6;

/** Built-in PDF fonts have no rupee glyph, so amounts are written as "Rs.". */
const money = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

/** Lay out a bill as a receipt-width PDF, matching the on-screen cash memo. */
export function buildBillPdf(bill: Bill): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM] });
  const width = PAGE_WIDTH_MM - MARGIN_MM * 2;
  const right = PAGE_WIDTH_MM - MARGIN_MM;
  let y = 10;

  const ensureRoom = (needed: number) => {
    if (y + needed > PAGE_HEIGHT_MM - 10) {
      doc.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM]);
      y = 10;
    }
  };

  const centered = (text: string, size = 8, style: 'normal' | 'bold' = 'normal') => {
    ensureRoom(LINE_MM);
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    for (const part of doc.splitTextToSize(text, width)) {
      doc.text(part, PAGE_WIDTH_MM / 2, y, { align: 'center' });
      y += LINE_MM;
    }
  };

  const pair = (label: string, value: string, bold = false) => {
    ensureRoom(LINE_MM);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.text(label, MARGIN_MM, y);
    doc.text(value, right, y, { align: 'right' });
    y += LINE_MM;
  };

  const rule = (dashed = true) => {
    ensureRoom(3);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern(dashed ? [1, 1] : [], 0);
    doc.line(MARGIN_MM, y, right, y);
    doc.setLineDashPattern([], 0);
    y += 3;
  };

  centered(STORE.legalName, 9, 'bold');
  centered(STORE.billAddress, 8);
  centered(`Ph: ${STORE.phoneDisplay}`, 8);
  centered('RETAIL INVOICE / CASH MEMO', 8, 'bold');
  rule();

  pair('Bill Number:', bill.billNumber, true);
  pair('Date & Time:', `${bill.date} ${bill.time}`);
  pair('Customer:', bill.customerName, true);
  pair('Mobile:', bill.customerPhone);
  pair('Payment:', `${bill.paymentMethod} (${bill.paymentStatus})`);
  rule();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Item [Unit]', MARGIN_MM, y);
  doc.text('Qty x Rate = Total', right, y, { align: 'right' });
  y += LINE_MM;
  rule(false);

  for (const item of bill.items) {
    const name = doc.splitTextToSize(`${item.name}${item.unit ? ` (${item.unit})` : ''}`, width - 28);
    ensureRoom(name.length * LINE_MM + 1);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(name, MARGIN_MM, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.qty} x ${money(item.price)} = ${money(item.total)}`, right, y, { align: 'right' });
    y += name.length * LINE_MM + 1;
  }
  rule();

  pair('Items Subtotal:', money(bill.subtotal));
  if (bill.discount > 0) pair('Discount / Round Off:', `- ${money(bill.discount)}`);
  if (bill.tax > 0) pair('Tax (GST):', `+ ${money(bill.tax)}`);
  rule(false);
  pair('NET TOTAL PAID:', money(bill.total), true);
  rule();

  centered('Thank you for visiting Sri Nidhi Store!', 8, 'bold');
  centered('For Khata balance or returns, please bring this bill slip.', 7);

  return doc;
}

export function billPdfFilename(bill: Bill): string {
  return `Bill_${bill.billNumber}.pdf`;
}
