import prisma from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = {
      ...(search && { OR: [{ name: { contains: search } }, { barcode: { contains: search } }] }),
      ...(category && { categoryId: category }),
    };
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { category: true, supplier: true, warehouse: true },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, supplier: true, warehouse: true },
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createProduct = async (req, res) => {
  try {
    const { name, categoryId, unit, barcode, description, costPrice, price, stock, warehouseId, supplierId } = req.body;
    const product = await prisma.product.create({
      data: { name, categoryId, unit, barcode, description, costPrice, price, stock: stock || 0, warehouseId, supplierId },
      include: { category: true, supplier: true, warehouse: true },
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Barcode already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, unit, barcode, description, costPrice, price, stock, lowStockThreshold, warehouseId, supplierId } = req.body;
    const data = { name, categoryId, unit, barcode, description, costPrice, price, warehouseId, supplierId };
    if (typeof stock === 'number') data.stock = stock;
    if (typeof lowStockThreshold === 'number') data.lowStockThreshold = lowStockThreshold;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
      include: { category: true, supplier: true, warehouse: true },
    });
    res.json({ success: true, product });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Product not found' });
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Barcode already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (typeof quantity !== 'number') return res.status(400).json({ success: false, message: 'quantity is required' });
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stock: quantity },
    });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getLowStock = async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const threshold = settings?.lowStockThreshold ?? 10;
    const products = await prisma.product.findMany({
      where: { stock: { lte: threshold } },
      include: { category: true, supplier: true, warehouse: true },
    });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Product not found' });
    if (err.code === 'P2003') return res.status(400).json({ success: false, message: 'Cannot delete product referenced in sales or purchases' });
    res.status(500).json({ success: false, message: err.message });
  }
};