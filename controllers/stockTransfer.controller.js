import prisma from '../config/db.js';

export const getStockTransfers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [transfers, total] = await prisma.$transaction([
      prisma.stockTransfer.findMany({
        skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { product: true, fromWarehouse: true, toWarehouse: true },
      }),
      prisma.stockTransfer.count(),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), transfers });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockTransfer = async (req, res) => {
  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: req.params.id },
      include: { product: true, fromWarehouse: true, toWarehouse: true },
    });
    if (!transfer) return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    res.json({ success: true, transfer });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createStockTransfer = async (req, res) => {
  try {
    const { productId, fromWarehouseId, toWarehouseId, qty, note } = req.body;
    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ success: false, message: 'Source and destination warehouse must be different' });
    }

    const transfer = await prisma.$transaction(async (tx) => {
      // Deduct from source product stock
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');
      if (product.stock < qty) throw new Error(`Insufficient stock for ${product.name}`);

      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: Number(qty) } },
      });

      return tx.stockTransfer.create({
        data: { productId, fromWarehouseId, toWarehouseId, qty: Number(qty), note: note || null },
        include: { product: true, fromWarehouse: true, toWarehouse: true },
      });
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