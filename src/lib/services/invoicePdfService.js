import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Embedded fallback ShipShaft brand icon (PNG 64x64, 2.9KB)
const SHIPSHAFT_ICON_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAB+RJREFU' +
  'eNrsW3uIVVUU/r7zzv3oODN2nFHHxkdqaYhpmppZqWj0qP1IRWkpKxUqqCiUv8r+qB89kMoe9mQ9gqwgtJcRllDqgWZlpYlW2UwaZ17jnHHu3Hs/31p7771nn7mP' +
  'GZ05Z5gL73P23t9e31prr732PpAkSZ6W03JazktyWs7fP021b4Xo2XyHqP1zQz3e/zK7W+9t6rZ1h7qj29R19V4v133j/a83h1q/Vteb1W2n9L3b1H16T2e379T7' +
  'pbpP7zfqvr763kH1e7XuN+m5Y7qf0Pd/p+8b0/uT6rG9uq9Pj1V8/4jaf0Hvf9Zz1+m9s3q/qPv0XoOem6vnB/Ve1ffn6T1W5fsA/X9R1y/X8/vU7/eovVn39anf' +
  '5+q537X/qNqvq90R9fs/2vfXauuR2vtK9/eqvd26fqL7vFv3/2/vX9L379d7N6kfv9L3b1R7j+s9Vu29pvt03126r0fvterdE7r2qK5br+tq1O60rv8G7/H3p9T3' +
  'e2vvM3rPdN2l1v7j+F3/r1W7z6m/d+g1U7p/u76b1f2rdJ9eS/U3vF/3D+m6U3p/u/r7pt6j+1P6bX/Wb6b7dF/H61u/6dZ9u6b3b2vf7+rfu9Vvt9r7Uu9xqvV7' +
  'qf1H1N/H9P3/qn9f1Guh/n223q/1nK179L2b+80f9Fqg15fqe7l6rqOed733kPr5pL7bovrR7d4/uU26/vC4+ntf92e9fkBbr9U9W7Xvy1Vvvqrvd2rrl3p/pda5' +
  '6Hqdrnf198G3/lXf91C3+r/bvd854LqN99fqveM6wG7396jV1+sA0t6rdK/7tV/d98Tbr/Pj2v9a73m1jru35/T7t1b/30D3dqq/0+p513X/f913dC9797/e06n7' +
  'b9G/r9P7PZ7j6h1x70v6zVndl916r/d43X9B172s7754f9VvWfW871329l9f9z+n1+P6/V9714/p+lfd29/3/h91/VbdR911X3/vd1639d6R979X9390v1O/c7/n' +
  '3l+6r/578f7737t8t/f7t1r9/2L/e0G9676r51fqvvvcf0f1/Qvd36v0/4fu84q+n9X71O/16t6mflvVfQ/p9bH+vdG7/7fU1V/rtdF1/799/0Pvf7v/7v49rfsG' +
  '3fvftf4f6v6/6/c/7f1f9r/t2u8Pus8Nuj/p+h/U62u9f1DvpXrtq3173vWn9P6Gvh/R60t997q+/7n69qj+P6rr9uv1vd4r/9W+X3ff3eD9/xvv/7Du413r9+r7' +
  'o7r+Nf37rPZ/qtfN3utP/197f1f33fLe//F37f8P1e/R/f+r7k8P6D7Vf7/3/Vf0O093n/77l+/1rF7ndd9/3Pv71e/R/d/76n1WfX9Uv7dZ323R6359P9a7/n/X' +
  '4/fptVP3f6h/P+G6H/W/E7p/v+/t0fXj+vcfen+d97rZ5Xp9ptdX6v/v1f13q9+36D3W6j/qPqfqvdP673tq7xW1t1/3rdH1U/rvW3p/p+c/pPsP1P8vdH9P3v9b' +
  'qZ7fU/fv1H3/1PWn/b3f6L7Lup6q+5X1nqv19161x9/e0ft/q/X9r/Z1v6rrf3j79e1/eNfv1O9f13vd/zN67QW194ba3af7Pjyg62/W81vU74t1v1mvu/Sez+j1' +
  'gfr/pP4913sf9f4Fvd7X77zrvW77q/e/3v3H3t+q9t6p66fq/v9Y31/T+3+r776u9y7ptVn9/3f393G97yN6/Z76e5/+vVnX3q7rj6q/c17v26P3bXb/N2vfX7jv' +
  'f9F/b9G6N+n/3/f6hLqTqn7b1V49Wb2m63/V9Ztq3xf022/pv0f13rO6f73/P/jB991jFfXjG9X1R/X+a/TvY/q7+73fve/W99P1/t/of5/rvXfq/7drfQ5r7396' +
  'f7Hup/q/5/X/J/R7H1X3V173/r+l/z9Q+27q92/t9QvdN6L1/b26/w2995DuX6Z1jqu9W/V1qO4f0P071N7j6vdv/G/3/6/q+vH3/7f/P3/P61/T9df7/2/6/6O1' +
  '7z26fr/aO6b3b/H7b9d7X9b9/3v9/l1eP+57B/R1rvuP6X5m1a/U/7l7b9bv3aX33O/r2vtVvX/Y67P6/x+9/4/e//v37f+f0/8fe8/9/0v3+7f6/p66f2qg+zZ7' +
  '/wvuv2rvj173e+7/c/W9fTqArP8V1d8L3f6n/x/4/nv1/eW/sPZ977uP6/q39dqZeq2t53vU53e6b7Pv/5b39j/r/v9T696s+/t1f0rv3er9bvd/V137t7r9k75/' +
  'r/v3r773gK5/z7vv1f3rdN/j+k+316/pvf3q93rd52nd53jdf/V7339/9/5u9b2m1773e3+n7pvV/Tv191r9P+/eT3rPtfr74wPOe0Hvv6PvH1J/36/f/aWuvUXP' +
  'e0TXv1z/+5K+d5W+u0b/fUzfX+j1r/rO9P7P1f59/n9Z7/Wuv6f3n9Zzrfp3v/4+Vb/T9b5j6vf56vu93nOzfvdfqdd9/u9+z33/X/f91Xv/m2u87739e1+vjep7' +
  'e3X/q35/v95zXff36f5l3m9c9417/Yv6/g+99/33X7/qPvd7f6z79N4r9P5jup56f5vuv/V+197/VvV/re/v1nt79f0r9N3D3v/KAP2h44/T8/O0nM/b8n9e/g8A' +
  'AP//AQwAMk3460EAAAA=';

let cachedFontBase64 = null;

function getGeistFontBase64() {
  if (cachedFontBase64) return cachedFontBase64;
  try {
    const fontPath = path.join(process.cwd(), 'src', 'lib', 'assets', 'fonts', 'Geist-Regular.ttf');
    if (fs.existsSync(fontPath)) {
      cachedFontBase64 = fs.readFileSync(fontPath).toString('base64');
    }
  } catch (err) {
    console.warn('[invoicePdfService] Could not read Geist-Regular.ttf:', err.message);
  }
  return cachedFontBase64;
}

function getLogoBase64() {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'icon.png');
    if (fs.existsSync(iconPath)) {
      return fs.readFileSync(iconPath).toString('base64');
    }
  } catch (err) {
    console.warn('[invoicePdfService] Could not read public/icon.png:', err.message);
  }
  return SHIPSHAFT_ICON_BASE64;
}

function formatPdfDate(val) {
  if (!val) {
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMoney(amount, hasGeist = true) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  const validNum = isNaN(num) ? 0 : num;
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(validNum);
  return hasGeist ? `₹ ${formatted}` : `INR ${formatted}`;
}

/**
 * Helper to print wrapped text safely within bounds
 */
function printWrapped(doc, text, x, y, maxWidth, lineHeight = 3.6, maxLines = 2) {
  if (!text) return y;
  const lines = doc.splitTextToSize(String(text), maxWidth);
  const toPrint = lines.slice(0, maxLines);
  for (let i = 0; i < toPrint.length; i++) {
    doc.text(toPrint[i], x, y + i * lineHeight);
  }
  return y + toPrint.length * lineHeight;
}

/**
 * Generates an official, publication-quality ShipShaft Tax Invoice & Digital Receipt PDF.
 *
 * @param {Object} rawData - Populated or composite invoice data
 * @returns {Buffer} PDF binary buffer
 */
export function generateInvoicePdfBuffer(rawData) {
  const invoiceNumber = rawData.invoiceNumber || 'INV-DRAFT';
  const issuedAt = rawData.issuedAt || rawData.createdAt || new Date();

  // Normalize customer
  const customer =
    rawData.customer ||
    (rawData.customerId && typeof rawData.customerId === 'object' ? rawData.customerId : {}) ||
    {};

  // Normalize shipment
  const shipment =
    rawData.shipment ||
    (rawData.shipmentId && typeof rawData.shipmentId === 'object' ? rawData.shipmentId : {}) ||
    {};

  // Normalize payment
  const payment = rawData.payment || {};

  // Financial calculations
  const subtotal = rawData.subtotal != null ? rawData.subtotal : shipment.shippingCost || 0;
  const tax = rawData.tax != null ? rawData.tax : 0;
  const total = rawData.total != null ? rawData.total : subtotal + tax;

  // Initialize jsPDF document (A4 portrait, mm)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Load custom font for Indian Rupee Unicode symbol support
  const fontBase64 = getGeistFontBase64();
  let hasGeist = false;
  if (fontBase64) {
    try {
      doc.addFileToVFS('Geist-Regular.ttf', fontBase64);
      doc.addFont('Geist-Regular.ttf', 'Geist', 'normal');
      doc.setFont('Geist');
      hasGeist = true;
    } catch (e) {
      console.warn('[invoicePdfService] Failed to register Geist font:', e.message);
      doc.setFont('helvetica');
    }
  } else {
    doc.setFont('helvetica');
  }

  const currSym = hasGeist ? '₹' : 'INR';

  // Layout metrics
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Brand Palette
  const COLOR_PRIMARY = [0, 74, 198]; // Deep Cobalt
  const COLOR_DARK = [19, 27, 46]; // Midnight Charcoal
  const COLOR_MUTED = [67, 70, 85]; // Slate Muted Text
  const COLOR_BORDER = [215, 220, 235]; // Light border
  const COLOR_BG_LIGHT = [244, 246, 253]; // Soft Container
  const COLOR_SUCCESS = [0, 123, 110]; // Emerald
  const COLOR_SUCCESS_BG = [230, 247, 244]; // Light Emerald Tint

  let y = 14;

  // 1. BRAND HEADER & INVOICE STATUS
  const logoB64 = getLogoBase64();
  if (logoB64) {
    try {
      doc.addImage('data:image/png;base64,' + logoB64, 'PNG', margin, y, 13, 13);
    } catch (e) {
      console.warn('[invoicePdfService] Could not add logo to PDF:', e.message);
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('ShipShaft', margin + 16, y + 5.5);

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('PRECISION LOGISTICS INTELLIGENCE', margin + 16, y + 10);

  // Top Right: Tax Invoice Title & Number
  doc.setFontSize(15);
  doc.setTextColor(...COLOR_DARK);
  doc.text('TAX INVOICE', pageWidth - margin, y + 4.5, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(invoiceNumber, pageWidth - margin, y + 9.5, { align: 'right' });

  // Status Badge (PAID / SUCCESS)
  const isPaid =
    payment.status === 'PAID' ||
    payment.status === 'SUCCESS' ||
    rawData.status === 'PAID' ||
    !payment.status; // Default to PAID for invoices issued after payment
  const statusLabel = isPaid ? 'PAID' : payment.status || 'PENDING';

  doc.setFillColor(...(isPaid ? COLOR_SUCCESS_BG : [255, 244, 229]));
  doc.roundedRect(pageWidth - margin - 24, y + 11.5, 24, 5.5, 2, 2, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(...(isPaid ? COLOR_SUCCESS : [180, 83, 9]));
  doc.text(statusLabel, pageWidth - margin - 12, y + 15.3, { align: 'center' });

  y += 18;

  // Header Details Sub-bar (Corporate identification & dates)
  doc.setFontSize(7.2);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    'ShipShaft Express Logistics Ltd. | GSTIN: 07AAAAA0000A1Z5 | Support: billing@shipshaft.com',
    margin,
    y
  );
  doc.text(`Date of Issue: ${formatPdfDate(issuedAt)}`, pageWidth - margin, y, { align: 'right' });

  y += 3.5;

  // Horizontal Accent Divider
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);

  y += 5;

  // 2. PARTIES SECTION (TWO BALANCED CARDS: BILL TO & SHIPMENT ROUTING)
  const cardW = (contentWidth - 6) / 2; // 88mm
  const cardH = 47;

  // Card 1 (Left): Customer & Billing Details
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(margin, y, cardW, cardH, 2.5, 2.5, 'F');
  doc.setDrawColor(...COLOR_BORDER);
  doc.roundedRect(margin, y, cardW, cardH, 2.5, 2.5, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('BILLED TO (CUSTOMER)', margin + 4, y + 5.5);

  const customerName = customer.name || shipment.senderName || 'Valued Logistics Client';
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_DARK);
  doc.text(customerName.slice(0, 36), margin + 4, y + 11);

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  let billY = y + 16;
  if (customer.company) {
    doc.text(String(customer.company).slice(0, 38), margin + 4, billY);
    billY += 4.5;
  }
  doc.text(`Email: ${customer.email || 'customer@shipshaft.com'}`, margin + 4, billY);
  billY += 4.5;
  doc.text(`Phone: ${customer.phone || shipment.senderPhone || '—'}`, margin + 4, billY);
  billY += 4.5;

  const billingAddr = shipment.senderAddress || 'Designated Commercial Billing Address';
  printWrapped(doc, `Address: ${billingAddr}`, margin + 4, billY, cardW - 8, 3.6, 2);

  // Card 2 (Right): Shipment Route & Transit Parties
  const rightX = margin + cardW + 6;
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(rightX, y, cardW, cardH, 2.5, 2.5, 'F');
  doc.roundedRect(rightX, y, cardW, cardH, 2.5, 2.5, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('SHIPMENT ROUTE & PARTIES', rightX + 4, y + 5.5);

  // Sender Sub-block
  const senderName = shipment.senderName || customer.name || 'Origin Dispatcher';
  const senderPhone = shipment.senderPhone ? ` | ${shipment.senderPhone}` : '';
  const originBranch = shipment.originBranchId || shipment.originBranch || {};
  const originBranchText = originBranch.name
    ? `Hub: ${originBranch.name} (${originBranch.code || 'ORIG'})`
    : `Hub: ${originBranch.city || 'Origin Dispatch Center'}`;

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`SENDER: ${senderName}`.slice(0, 42), rightX + 4, y + 10.5);

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  const senderAddrShort = (shipment.senderAddress || 'Origin Center') + senderPhone;
  printWrapped(doc, senderAddrShort, rightX + 4, y + 14.5, cardW - 8, 3.4, 1);
  doc.text(originBranchText, rightX + 4, y + 18.5);

  // Subtle separator inside card
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(rightX + 4, y + 21.5, rightX + cardW - 4, y + 21.5);

  // Receiver Sub-block
  const receiverName = shipment.receiverName || 'Consignee Recipient';
  const receiverPhone = shipment.receiverPhone ? ` | ${shipment.receiverPhone}` : '';
  const destBranch = shipment.destinationBranchId || shipment.destinationBranch || {};
  const destBranchText = destBranch.name
    ? `Hub: ${destBranch.name} (${destBranch.code || 'DEST'})`
    : `Hub: ${destBranch.city || 'Destination Hub'}`;

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`RECEIVER: ${receiverName}`.slice(0, 42), rightX + 4, y + 26.5);

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  const receiverAddrShort = (shipment.receiverAddress || 'Destination Address') + receiverPhone;
  printWrapped(doc, receiverAddrShort, rightX + 4, y + 30.5, cardW - 8, 3.4, 1);
  doc.text(destBranchText, rightX + 4, y + 34.5);

  y += cardH + 5;

  // 3. SHIPMENT & PARCEL SPECIFICATIONS CARD
  const specH = 19;
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(margin, y, contentWidth, specH, 2.5, 2.5, 'F');
  doc.roundedRect(margin, y, contentWidth, specH, 2.5, 2.5, 'S');

  const colW = contentWidth / 4;

  // Spec 1: Tracking ID
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('TRACKING NUMBER', margin + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text(shipment.trackingNumber || 'SHP-LOGISTICS', margin + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Status: ${shipment.status || 'BOOKED'}`, margin + 4, y + 15);

  // Spec 2: Service Level
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('SERVICE LEVEL', margin + colW + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(shipment.serviceType || 'Standard Ground', margin + colW + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Door-to-Door Delivery', margin + colW + 4, y + 15);

  // Spec 3: Parcel Details
  const weightVal = shipment.weight ? `${Number(shipment.weight).toFixed(2)} kg` : '1.00 kg';
  const dimsText =
    shipment.length && shipment.width && shipment.height
      ? `${shipment.length}×${shipment.width}×${shipment.height} cm`
      : 'Standard Parcel Box';

  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('PARCEL SPECIFICATIONS', margin + colW * 2 + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`Weight: ${weightVal}`, margin + colW * 2 + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Dims: ${dimsText}`, margin + colW * 2 + 4, y + 15);

  // Spec 4: Payment Reference
  const txnId = payment.transactionId || 'PAY-CONFIRMED';
  const method = payment.method || 'UPI / SIMULATED';
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('PAYMENT REFERENCE', margin + colW * 3 + 4, y + 5);
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(txnId.slice(0, 16), margin + colW * 3 + 4, y + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Mode: ${method}`, margin + colW * 3 + 4, y + 15);

  y += specH + 6;

  // 4. ITEMIZED CHARGES TABLE
  const thHeight = 8;
  doc.setFillColor(...COLOR_PRIMARY);
  doc.roundedRect(margin, y, contentWidth, thHeight, 1.5, 1.5, 'F');

  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('DESCRIPTION / LOGISTICS SERVICE', margin + 4, y + 5.2);
  doc.text('QTY / UNIT', margin + 110, y + 5.2, { align: 'center' });
  doc.text(`RATE (${currSym})`, margin + 145, y + 5.2, { align: 'right' });
  doc.text(`AMOUNT (${currSym})`, pageWidth - margin - 4, y + 5.2, { align: 'right' });

  y += thHeight;

  // Table Row
  const trH = 16;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, trH, 'F');
  doc.setDrawColor(...COLOR_BORDER);
  doc.line(margin, y + trH, pageWidth - margin, y + trH);

  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_DARK);
  doc.text(`${shipment.serviceType || 'Precision Freight'} Transit Fee`, margin + 4, y + 5.5);

  const origCode = originBranch.code || 'ORIG';
  const destCode = destBranch.code || 'DEST';
  const pkgDesc = shipment.packageDescription ? ` | Content: ${shipment.packageDescription}` : '';
  const itemSubtitle = `Route: ${origCode} → ${destCode} | Billable Weight: ${weightVal}${pkgDesc} | Secured Handling`;

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  printWrapped(doc, itemSubtitle, margin + 4, y + 10, 100, 3.4, 1);

  const subtotalFormatted = formatMoney(subtotal, hasGeist);

  doc.setFontSize(8);
  doc.setTextColor(...COLOR_DARK);
  doc.text('1 shipment', margin + 110, y + 7, { align: 'center' });
  doc.text(subtotalFormatted, margin + 145, y + 7, { align: 'right' });
  doc.text(subtotalFormatted, pageWidth - margin - 4, y + 7, { align: 'right' });

  y += trH + 5;

  // 5. TOTALS & PAYMENT VERIFICATION SECTION
  const summaryBoxW = 76;
  const summaryBoxX = pageWidth - margin - summaryBoxW;

  // Left Receipt & Verification Box
  const notesW = contentWidth - summaryBoxW - 6;
  const noteBoxH = 38;
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(margin, y, notesW, noteBoxH, 2, 2, 'F');
  doc.roundedRect(margin, y, notesW, noteBoxH, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('PAYMENT VERIFICATION & RECEIPT', margin + 4, y + 5.5);

  doc.setFontSize(7);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`Payment Status: ${statusLabel} (Fully Settled)`, margin + 4, y + 11);
  doc.text(`Transaction Reference: ${txnId}`, margin + 4, y + 15.5);
  doc.text(`Payment Channel: ${method}`, margin + 4, y + 20);

  // Digital verification code derived from invoiceNumber and txnId
  const hashSeed = `${invoiceNumber}:${txnId}`;
  let hashVal = 0;
  for (let i = 0; i < hashSeed.length; i++) {
    hashVal = (hashVal << 5) - hashVal + hashSeed.charCodeAt(i);
    hashVal |= 0;
  }
  const authCode = Math.abs(hashVal).toString(16).toUpperCase().padStart(8, '0');

  doc.text(`Electronic Verification Token: SS-${authCode}`, margin + 4, y + 24.5);
  doc.text(
    'This computer-generated tax invoice serves as official proof of payment.',
    margin + 4,
    y + 29
  );
  doc.text('No physical signature required under IT Act, 2000.', margin + 4, y + 33.5);

  // Right Totals Box
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(summaryBoxX, y, summaryBoxW, noteBoxH, 2, 2, 'F');
  doc.roundedRect(summaryBoxX, y, summaryBoxW, noteBoxH, 2, 2, 'S');

  let rowY = y + 5.5;
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  doc.text('Freight Charges', summaryBoxX + 4, rowY);
  doc.text(subtotalFormatted, pageWidth - margin - 4, rowY, { align: 'right' });

  rowY += 5;
  doc.text('Subtotal', summaryBoxX + 4, rowY);
  doc.text(subtotalFormatted, pageWidth - margin - 4, rowY, { align: 'right' });

  rowY += 5;
  doc.text('Taxes / GST (0% Standard)', summaryBoxX + 4, rowY);
  doc.text(formatMoney(tax, hasGeist), pageWidth - margin - 4, rowY, { align: 'right' });

  rowY += 4.5;
  doc.setDrawColor(...COLOR_PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(summaryBoxX + 4, rowY, pageWidth - margin - 4, rowY);

  rowY += 6;
  doc.setFillColor(...COLOR_BG_LIGHT);
  doc.roundedRect(summaryBoxX + 2, rowY - 4, summaryBoxW - 4, 9.5, 1.5, 1.5, 'F');

  doc.setFontSize(9);
  doc.setTextColor(...COLOR_PRIMARY);
  doc.text('TOTAL PAID', summaryBoxX + 4, rowY + 2);
  doc.setFontSize(10.5);
  doc.text(formatMoney(total, hasGeist), pageWidth - margin - 4, rowY + 2, { align: 'right' });

  // 6. BOTTOM FOOTER & SECURITY NOTICE
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

  doc.setFontSize(6.8);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(
    'Thank you for shipping with ShipShaft. All deliveries are covered under ShipShaft Precision Cargo Care.',
    margin,
    pageHeight - 17.5
  );
  doc.text(
    'For billing inquiries or disputes, contact billing@shipshaft.com or call +91 (800) 555-0199.',
    margin,
    pageHeight - 13.5
  );
  doc.text(
    `Official ShipShaft Tax Invoice | ${invoiceNumber} | Page 1 of 1`,
    pageWidth - margin,
    pageHeight - 13.5,
    { align: 'right' }
  );

  return Buffer.from(doc.output('arraybuffer'));
}
