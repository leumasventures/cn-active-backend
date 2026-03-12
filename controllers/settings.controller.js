import prisma from '../config/db.js';

const ensureSettings = async () => {
  return prisma.settings.upsert({
    where:  { id: 'global' },
    update: {},
    create: { id: 'global' },
    include: { bulkDiscountTiers: true },
  });
};

export const getSettings = async (req, res) => {
  try {
    const settings = await ensureSettings();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    await ensureSettings();
    const {
      companyName, address, phone, email, currency,
      taxRate, lowStockThreshold, invoicePrefix,
      receiptPrefix, quotePrefix, creditNotePrefix,
      enableBulkDiscount, loyaltyPointsRate, loyaltyRedemptionRate,
    } = req.body;
    const settings = await prisma.settings.update({
      where: { id: 'global' },
      data: {
        companyName, address, phone, email, currency,
        taxRate, lowStockThreshold, invoicePrefix,
        receiptPrefix, quotePrefix, creditNotePrefix,
        enableBulkDiscount, loyaltyPointsRate, loyaltyRedemptionRate,
      },
      include: { bulkDiscountTiers: true },
    });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleBulkDiscount = async (req, res) => {
  try {
    await ensureSettings();
    const { enabled } = req.body;
    const settings = await prisma.settings.update({
      where: { id: 'global' },
      data:  { enableBulkDiscount: enabled },
      include: { bulkDiscountTiers: true },
    });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBulkDiscountTier = async (req, res) => {
  try {
    await ensureSettings();
    const { tierId } = req.params;
    const { name, minQty, maxQty, discountPct, active } = req.body;
    const tier = tierId === 'new'
      ? await prisma.bulkDiscountTier.create({
          data: { settingsId: 'global', name, minQty, maxQty: maxQty || null, discountPct, active: active ?? true },
        })
      : await prisma.bulkDiscountTier.update({
          where: { id: tierId },
          data:  { name, minQty, maxQty: maxQty || null, discountPct, active },
        });
    res.json({ success: true, tier });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Tier not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBulkDiscountTier = async (req, res) => {
  try {
    await prisma.bulkDiscountTier.delete({ where: { id: req.params.tierId } });
    res.json({ success: true, message: 'Tier deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Tier not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const resetNumberCounters = async (req, res) => {
  try {
    await ensureSettings();
    const { confirm } = req.body;
    if (confirm !== 'yes') {
      return res.status(400).json({ success: false, message: 'Send { confirm: "yes" } to reset all counters' });
    }
    const settings = await prisma.settings.update({
      where: { id: 'global' },
      data:  { nextInvoiceNo: 1001, nextReceiptNo: 5001, nextQuoteNo: 2001, nextCreditNoteNo: 4001 },
      include: { bulkDiscountTiers: true },
    });
    res.json({ success: true, message: 'All counters reset to defaults', settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
