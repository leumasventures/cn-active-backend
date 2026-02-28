import prisma from '../config/db.js';

// Get next sequential number and increment counter in settings
export const getNextNumber = async (type) => {
  const fieldMap = {
    invoice:    { field: 'nextInvoiceNo',    prefix: 'invoicePrefix',    default: 'INV' },
    receipt:    { field: 'nextReceiptNo',     prefix: 'receiptPrefix',    default: 'REC' },
    quote:      { field: 'nextQuoteNo',       prefix: 'quotePrefix',      default: 'QUO' },
    creditNote: { field: 'nextCreditNoteNo',  prefix: 'creditNotePrefix', default: 'CN'  },
    purchase:   { field: 'nextPurchaseNo',    prefix: 'invoicePrefix',    default: 'PO'  },
  };

  const map = fieldMap[type];
  if (!map) throw new Error(`Unknown number type: ${type}`);

  const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
  const current = settings?.[map.field] ?? 1001;
  const prefix = settings?.[map.prefix] ?? map.default;

  await prisma.settings.update({
    where: { id: 'global' },
    data: { [map.field]: current + 1 },
  });

  return `${prefix}-${current}`;
};

// Get applicable bulk discount percentage for a given quantity
export const getBulkDiscount = async (qty) => {
  const settings = await prisma.settings.findUnique({
    where: { id: 'global' },
    include: { bulkDiscountTiers: { where: { active: true }, orderBy: { minQty: 'desc' } } },
  });

  if (!settings?.enableBulkDiscount) return 0;

  const tier = settings.bulkDiscountTiers.find(
    t => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty)
  );

  return tier?.discountPct ?? 0;
};

// Calculate line total after per-item discount
export const calcLineTotal = (price, qty, discountPct = 0) => {
  const gross = price * qty;
  return round2(gross - (gross * discountPct) / 100);
};

// Calculate tax amount
export const calcTax = (amount, taxRate = 0) => {
  return round2((amount * taxRate) / 100);
};

// Round to 2 decimal places
export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;