import Joi from 'joi';
// ─── WAREHOUSE ───────────────────────────────────────────────
export const createWarehouseSchema = Joi.object({
  name: Joi.string().required(),
  location: Joi.string().optional().allow('', null),
  description: Joi.string().optional().allow('', null),
});

export const updateWarehouseSchema = Joi.object({
  name: Joi.string().optional(),
  location: Joi.string().optional().allow('', null),
  description: Joi.string().optional().allow('', null),
});

// ─── SUPPLIERS ───────────────────────────────────────────────
export const createSupplierSchema = Joi.object({
  name:          Joi.string().required(),
  email:         Joi.string().email().optional().allow('', null),
  phone:         Joi.string().optional().allow('', null),
  address:       Joi.string().optional().allow('', null),
  balance:       Joi.number().optional().default(0),
  contactPerson: Joi.string().optional().allow('', null),
  notes:         Joi.string().optional().allow('', null),
});

export const updateSupplierSchema = Joi.object({
  name:          Joi.string().optional(),
  email:         Joi.string().email().optional().allow('', null),
  phone:         Joi.string().optional().allow('', null),
  address:       Joi.string().optional().allow('', null),
  balance:       Joi.number().optional(),
  contactPerson: Joi.string().optional().allow('', null),
  notes:         Joi.string().optional().allow('', null),
});

// ─── PRODUCTS ────────────────────────────────────────────────
export const createProductSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().optional().allow('', null),
  barcode: Joi.string().optional().allow('', null),
  description: Joi.string().optional().allow('', null),
  price: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  stock: Joi.number().integer().min(0).optional().default(0),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  categoryId: Joi.string().optional().allow('', null),
  supplierId: Joi.string().optional().allow('', null),
  warehouseId: Joi.string().optional().allow('', null),
  unit: Joi.string().optional().allow('', null),
  imageUrl: Joi.string().optional().allow('', null),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().optional(),
  sku: Joi.string().optional().allow('', null),
  barcode: Joi.string().optional().allow('', null),
  description: Joi.string().optional().allow('', null),
  price: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  stock: Joi.number().integer().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  categoryId: Joi.string().optional().allow('', null),
  supplierId: Joi.string().optional().allow('', null),
  warehouseId: Joi.string().optional().allow('', null),
  unit: Joi.string().optional().allow('', null),
  imageUrl: Joi.string().optional().allow('', null),
});

// ─── CUSTOMERS ───────────────────────────────────────────────
export const createCustomerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  loyaltyPoints: Joi.number().integer().min(0).optional().default(0),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  loyaltyPoints: Joi.number().integer().min(0).optional(),
});

// ─── SALES ───────────────────────────────────────────────────
export const completeSaleSchema = Joi.object({
  customerId:     Joi.string().optional().allow('', null),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      qty:       Joi.number().integer().min(1).required(),
      price:     Joi.number().min(0).optional(),
      discount:  Joi.number().min(0).max(100).optional(),
      total:     Joi.number().min(0).optional(),
    })
  ).min(1).required(),
  paymentMethod:  Joi.string().valid('CASH', 'CARD', 'TRANSFER', 'CREDIT', 'OTHER').optional(),
  subtotal:       Joi.number().min(0).optional(),
  discount:       Joi.number().min(0).optional(),
  tax:            Joi.number().min(0).optional(),
  total:          Joi.number().min(0).optional(),
  taxRate:        Joi.number().min(0).max(100).optional(),
  note:           Joi.string().optional().allow('', null),
  pointsRedeemed: Joi.number().integer().min(0).optional(),
  redeemPoints:   Joi.number().integer().min(0).optional(),
  salesRepId:     Joi.string().optional().allow('', null),
  salesRepName:   Joi.string().optional().allow('', null),
  origin:         Joi.string().optional().allow('', null),
});

// ─── PURCHASES ───────────────────────────────────────────────
export const createPurchaseSchema = Joi.object({
  supplierId: Joi.string().required(),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
      costPrice: Joi.number().min(0).required(),
    })
  ).min(1).required(),
  note: Joi.string().optional().allow('', null),
  paidAmount: Joi.number().min(0).optional(),
});

// ─── EXPENSES ────────────────────────────────────────────────
export const createExpenseSchema = Joi.object({
  title: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  category: Joi.string().optional().allow('', null),
  note: Joi.string().optional().allow('', null),
  date: Joi.date().optional(),
});

export const updateExpenseSchema = Joi.object({
  title: Joi.string().optional(),
  amount: Joi.number().min(0).optional(),
  category: Joi.string().optional().allow('', null),
  note: Joi.string().optional().allow('', null),
  date: Joi.date().optional(),
});

// ─── QUOTES ──────────────────────────────────────────────────
export const createQuoteSchema = Joi.object({
  customerId: Joi.string().optional().allow('', null),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).optional(),
      discount: Joi.number().min(0).max(100).optional(),
    })
  ).min(1).required(),
  validUntil: Joi.date().optional(),
  note: Joi.string().optional().allow('', null),
  discount: Joi.number().min(0).optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
});

// ─── CREDIT NOTES ────────────────────────────────────────────
export const createCreditNoteSchema = Joi.object({
  customerId: Joi.string().optional().allow('', null),
  saleId: Joi.string().optional().allow('', null),
  amount: Joi.number().min(0).required(),
  reason: Joi.string().optional().allow('', null),
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required(),
    })
  ).optional(),
});

// ─── STOCK TRANSFER ──────────────────────────────────────────
export const createStockTransferSchema = Joi.object({
  productId: Joi.string().required(),
  fromWarehouseId: Joi.string().required(),
  toWarehouseId: Joi.string().required(),
  qty: Joi.number().integer().min(1).required(),
  note: Joi.string().optional().allow('', null),
});

// ─── SETTINGS ────────────────────────────────────────────────
export const updateSettingsSchema = Joi.object({
  companyName: Joi.string().optional().allow('', null),
  address: Joi.string().optional().allow('', null),
  phone: Joi.string().optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  currency: Joi.string().optional(),
  taxRate: Joi.number().min(0).max(100).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  invoicePrefix: Joi.string().optional().allow('', null),
  receiptPrefix: Joi.string().optional().allow('', null),
  quotePrefix: Joi.string().optional().allow('', null),
  creditNotePrefix: Joi.string().optional().allow('', null),
  enableBulkDiscount: Joi.boolean().optional(),
  loyaltyPointsRate: Joi.number().min(0).optional(),
  loyaltyRedemptionRate: Joi.number().min(0).optional(),
});

export const toggleBulkDiscountSchema = Joi.object({
  enabled: Joi.boolean().required(),
});

export const bulkDiscountTierSchema = Joi.object({
  name: Joi.string().required(),
  minQty: Joi.number().integer().min(1).required(),
  maxQty: Joi.number().integer().min(1).optional().allow(null),
  discountPct: Joi.number().min(0).max(100).required(),
  active: Joi.boolean().optional().default(true),
});