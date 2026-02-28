import prisma from '../config/db.js';

export const getStockTransfers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = search ? { transferNo: { contains: search } } : {};
    const [transfers, total] = await prisma.$transaction([
      prisma.stockTransfer.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } } }),
      prisma.stockTransfer.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), transfers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockTransfer = async (req, res) => {
  try {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id: req.params.id }, include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } } });
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    res.json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createStockTransfer = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, items, notes } = req.body;
    if (fromWarehouseId === toWarehouseId) return res.status(400).json({ success: false, message: 'Source and destination warehouse must be different' });

    for (const item of items) {
      const stock = await prisma.productStock.findUnique({ where: { productId_warehouseId: { productId: item.productId, warehouseId: fromWarehouseId } } });
      if (!stock || stock.quantity < item.qty) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product?.name || item.productId}` });
      }
    }

    const transfer = await prisma.$transaction(async (tx) => {
      const transferNo = `TRF-${Date.now()}`;
      const newTransfer = await tx.stockTransfer.create({ data: { transferNo, fromWarehouseId, toWarehouseId, notes, items: { create: items.map((item) => ({ productId: item.productId, qty: item.qty })) } }, include: { fromWarehouse: true, toWarehouse: true, items: { include: { product: true } } } });

      for (const item of items) {
        await tx.productStock.update({ where: { productId_warehouseId: { productId: item.productId, warehouseId: fromWarehouseId } }, data: { quantity: { decrement: item.qty } } });
        await tx.productStock.upsert({ where: { productId_warehouseId: { productId: item.productId, warehouseId: toWarehouseId } }, update: { quantity: { increment: item.qty } }, create: { productId: item.productId, warehouseId: toWarehouseId, quantity: item.qty } });
      }

      return newTransfer;
    });

    res.status(201).json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteStockTransfer = async (req, res) => {
  try {
    await prisma.stockTransfer.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Stock transfer deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    res.status(500).json({ success: false, message: err.message });
  }
};