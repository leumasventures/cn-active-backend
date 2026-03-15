// routes/index.js
import express from 'express';
import authRoutes          from './auth.routes.js';
import adminRoutes         from './admin.routes.js';
import settingsRoutes      from './settings.routes.js';
import productRoutes       from './products.routes.js';
import customerRoutes      from './customers.routes.js';
import supplierRoutes      from './suppliers.routes.js';
import warehouseRoutes     from './warehouses.routes.js';
import saleRoutes          from './sales.routes.js';
import purchaseRoutes      from './purchases.routes.js';
import quoteRoutes         from './quotes.routes.js';
import creditNoteRoutes    from './creditNotes.routes.js';
import expenseRoutes       from './expenses.routes.js';
import reportRoutes        from './reports.routes.js';
import stockTransferRoutes from './stockTransfers.routes.js';
import stateRoutes         from './state.routes.js';
import salesRepRoutes      from './salesReps.routes.js';

const router = express.Router();

router.use('/auth',            authRoutes);
router.use('/admin',           adminRoutes);
router.use('/settings',        settingsRoutes);
router.use('/products',        productRoutes);
router.use('/customers',       customerRoutes);
router.use('/suppliers',       supplierRoutes);
router.use('/warehouses',      warehouseRoutes);
router.use('/sales',           saleRoutes);
router.use('/purchases',       purchaseRoutes);
router.use('/quotes',          quoteRoutes);
router.use('/credit-notes',    creditNoteRoutes);
router.use('/expenses',        expenseRoutes);
router.use('/reports',         reportRoutes);
router.use('/stock-transfers', stockTransferRoutes);
router.use('/state',           stateRoutes);
router.use('/sales-reps',      salesRepRoutes);

/* ── Ping ─────────────────────────────────────────────────────────
   GET /api/ping
   Used by the frontend SYNC module to verify the backend is alive.
─────────────────────────────────────────────────────────────────── */
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong', timestamp: new Date().toISOString() });
});

/* ── Sync all ─────────────────────────────────────────────────────
   GET /api/sync/all
   Returns every collection in one shot so the frontend can hydrate
   STATE on page load without issuing 15 separate requests.

   IMPORTANT: adjust the import path to match where your DB pool/
   connection is exported. Common paths tried in order:
     ../db/pool.js
     ../config/db.js
     ../db/index.js
─────────────────────────────────────────────────────────────────── */
router.get('/sync/all', async (req, res, next) => {
  try {
    const { default: prisma } = await import('../config/db.js');

    const [
      warehouses,
      products,
      customers,
      suppliers,
      salesReps,
      sales,
      purchases,
      expenses,
      quotes,
      creditNotes,
      settings,
    ] = await Promise.all([
      // Warehouses
      prisma.warehouse.findMany({ orderBy: { name: 'asc' } }),

      // Products — include category, supplier, warehouse, stock transfers
      prisma.product.findMany({
        orderBy: { name: 'asc' },
        include: {
          category:  { select: { id: true, name: true } },
          supplier:  { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
        },
      }),

      // Customers
      prisma.customer.findMany({ orderBy: { name: 'asc' } }),

      // Suppliers
      prisma.supplier.findMany({ orderBy: { name: 'asc' } }),

      // Sales reps (CASHIER + MANAGER roles only)
      prisma.user.findMany({
        where:   { role: { in: ['CASHIER', 'MANAGER'] }, active: true },
        select:  { id: true, name: true, email: true, role: true, appState: true },
        orderBy: { name: 'asc' },
      }),

      // Sales (latest 500) with items
      prisma.sale.findMany({
        take:    500,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, unit: true } } },
          },
          customer: { select: { id: true, name: true } },
        },
      }),

      // Purchases (latest 200) with items
      prisma.purchase.findMany({
        take:    200,
        orderBy: { createdAt: 'desc' },
        include: {
          items:    { include: { product: { select: { id: true, name: true, unit: true } } } },
          supplier: { select: { id: true, name: true } },
          warehouse:{ select: { id: true, name: true } },
        },
      }),

      // Expenses (latest 200)
      prisma.expense.findMany({
        take:    200,
        orderBy: { date: 'desc' },
      }),

      // Quotes (latest 200) with items
      prisma.quote.findMany({
        take:    200,
        orderBy: { createdAt: 'desc' },
        include: {
          items:    { include: { product: { select: { id: true, name: true, unit: true } } } },
          customer: { select: { id: true, name: true } },
        },
      }),

      // Credit notes with items
      prisma.creditNote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          items:    { include: { product: { select: { id: true, name: true } } } },
          customer: { select: { id: true, name: true } },
        },
      }),

      // Settings (single global row) including bulk discount tiers
      prisma.settings.findUnique({
        where:   { id: 'global' },
        include: { bulkDiscountTiers: true },
      }),
    ]);

    // ── Shape products to match what sync.js mapProduct() expects ──
    // Your schema stores stock as a single `stock` int on Product and
    // uses warehouseId as a FK (one warehouse per product).
    // We expose it as warehouseStock array so the frontend mapper works.
    const shapedProducts = products.map(p => ({
      id:           p.id,
      name:         p.name,
      sku:          p.sku          || '',
      barcode:      p.barcode      || '',
      category:     p.category?.name || '',
      categoryId:   p.categoryId   || null,
      unit:         p.unit         || '',
      costPrice:    p.costPrice    ?? 0,
      sellingPrice: p.price,               // schema calls it `price`
      reorderLevel: p.lowStockThreshold    ?? 10,
      supplierId:   p.supplierId   || null,
      description:  p.description  || '',
      active:       p.active,
      warehouseId:  p.warehouseId  || null,
      // Expose stock per warehouse (single warehouse model)
      warehouseStock: p.warehouseId
        ? [{ warehouseId: p.warehouseId, quantity: p.stock }]
        : [],
    }));

    // ── Shape sales ────────────────────────────────────────────
    const shapedSales = sales.map(s => ({
      id:            s.id,
      receiptNo:     s.receiptNo,
      invoiceNo:     null,                  // schema uses receiptNo for all
      customerId:    s.customerId   || null,
      customerName:  s.customer?.name || 'Walk-in',
      subtotal:      s.subtotal,
      totalDiscountAmt: s.discount  || 0,
      taxAmt:        s.tax          || 0,
      total:         s.total,
      redeemPts:     s.pointsRedeemed || 0,
      paymentMethod: s.paymentMethod || 'cash',
      paymentStatus: 'paid',
      date:          s.createdAt.toISOString(),
      notes:         s.note         || '',
      items: s.items.map(i => ({
        productId:   i.productId,
        name:        i.product?.name || '',
        unit:        i.product?.unit || '',
        qty:         i.qty,
        unitPrice:   i.price,
        lineDiscount:i.discount || 0,
        total:       i.total,
      })),
    }));

    // ── Shape purchases ────────────────────────────────────────
    const shapedPurchases = purchases.map(p => ({
      id:            p.id,
      invoiceNo:     p.purchaseNo,
      supplierId:    p.supplierId,
      supplierName:  p.supplier?.name || '',
      warehouseId:   p.warehouseId    || null,
      warehouseName: p.warehouse?.name || '',
      grandTotal:    p.total,
      paidAmt:       p.paidAmount     || 0,
      owed:          Math.max(0, p.total - (p.paidAmount || 0)),
      paymentStatus: p.paidAmount >= p.total ? 'paid'
                   : p.paidAmount > 0        ? 'partial' : 'credit',
      notes:         p.notes || p.note || '',
      date:          p.createdAt.toISOString(),
      items: p.items.map(i => ({
        productId: i.productId,
        name:      i.product?.name || '',
        unit:      i.product?.unit || '',
        qty:       i.qty,
        cost:      i.costPrice,
        total:     i.total,
      })),
    }));

    // ── Shape quotes ───────────────────────────────────────────
    const shapedQuotes = quotes.map(q => ({
      id:           q.id,
      quoteNo:      q.quoteNo,
      customerId:   q.customerId   || null,
      customerName: q.customer?.name || 'Walk-in',
      subtotal:     q.subtotal,
      extraDiscPct: q.discount     || 0,
      taxAmt:       q.tax          || 0,
      total:        q.total,
      validDays:    q.validUntil
        ? Math.round((new Date(q.validUntil) - new Date(q.createdAt)) / 86400000)
        : 7,
      status:       q.status.toLowerCase(),
      date:         q.createdAt.toISOString(),
      notes:        q.note || '',
      items: q.items.map(i => ({
        productId:           i.productId,
        name:                i.product?.name || '',
        unit:                i.product?.unit || '',
        qty:                 i.qty,
        unitPrice:           i.price,
        manualDiscountPct:   i.discount || 0,
        effectiveDiscountPct:i.discount || 0,
        total:               i.total,
      })),
    }));

    // ── Shape credit notes ─────────────────────────────────────
    const shapedCreditNotes = creditNotes.map(cn => ({
      id:                cn.id,
      creditNoteNo:      cn.creditNo,
      originalInvoiceNo: cn.saleId || '',
      customerId:        cn.customerId   || null,
      customerName:      cn.customer?.name || '',
      amount:            cn.amount,
      reason:            cn.reason || '',
      notes:             '',
      date:              cn.createdAt.toISOString(),
      status:            'issued',
    }));

    // ── Shape bulk discount tiers ──────────────────────────────
    const shapedTiers = (settings?.bulkDiscountTiers || []).map(t => ({
      id:          t.id,
      name:        t.name,
      discountPct: t.discountPct,
      minQty:      t.minQty,
      maxQty:      t.maxQty ?? 99999,
      productIds:  [],        // schema has no per-product tier restriction
      active:      t.active,
    }));

    res.json({
      success: true,
      data: {
        warehouses,
        products:          shapedProducts,
        customers,
        suppliers,
        salesReps: salesReps.map(r => {
          let extra = {};
          try { extra = JSON.parse(r.appState || '{}'); } catch {}
          return {
            id:          r.id,
            name:        r.name,
            email:       r.email        || '',
            phone:       extra.phone    || '',
            warehouseId: extra.warehouseId || null,
            commission:  extra.commission  ?? 2,
            totalSales:  extra.totalSales  ?? 0,
          };
        }),
        sales:             shapedSales,
        purchases:         shapedPurchases,
        expenses,
        quotes:            shapedQuotes,
        creditNotes:       shapedCreditNotes,
        bulkDiscountTiers: shapedTiers,
        settings:          settings || {},
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ── Health ───────────────────────────────────────────────────────
   GET /api/health
─────────────────────────────────────────────────────────────────── */
router.get('/health', (req, res) => {
  res.status(200).json({
    success:     true,
    status:      'ok',
    uptime:      process.uptime(),
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.use('/{*path}', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

export default router;