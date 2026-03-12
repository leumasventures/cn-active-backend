import prisma from '../config/db.js';

export const getPurchases = async (req, res) => {
  try {
    const { search, supplierId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(supplierId && { supplierId }),
      ...(search && { OR: [
        { purchaseNo: { contains: search } },
        { supplier: { name: { contains: search } } },
      ]}),
    };
    const [purchases, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
      }),
      prisma.purchase.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), purchases });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPurchase = async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, warehouse: true, items: { include: { product: true } } },
    });
    if (!purchase) return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.json({ success: true, purchase });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, warehouseId, items, note, notes } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'No items provided' });

    const total = items.reduce((sum, item) => sum + item.qty * item.costPrice, 0);

    const purchase = await prisma.$transaction(async (tx) => {
      const s = await tx.settings.findUnique({ where: { id: 'global' } });
      const num = String(s?.nextPurchaseNo ?? 3001).padStart(4, '0');
      const prefix = s?.receiptPrefix ?? 'PUR';
      const purchaseNo = `${prefix}-${num}`;
      await tx.settings.update({ where: { id: 'global' }, data: { nextPurchaseNo: { increment: 1 } } });

      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNo,
          supplierId:  supplierId  || null,
          warehouseId: warehouseId || null,
          repId:       req.user?.id || null,
          total,
          note:  note  || null,
          notes: notes || null,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              qty:       Number(item.qty),
              costPrice: Number(item.costPrice),
              total:     Number(item.qty) * Number(item.costPrice),
            })),
          },
        },
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
      });

      // Update product stock and cost price
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock:     { increment: Number(item.qty) },
            costPrice: Number(item.costPrice),
          },
        });
      }

      // Update supplier balance
      if (supplierId) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: { balance: { increment: total } },
        });
      }

      return newPurchase;
    });

    res.status(201).json({ success: true, purchase });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deletePurchase = async (req, res) => {
  try {
    await prisma.purchase.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Purchase deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Purchase not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};