import prisma from '../config/db.js';

export const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where = { ...(search && { OR: [{ name: { contains: search } }, { barcode: { contains: search } }] }), ...(category && { category }) };
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { stock: { include: { warehouse: true } } } }),
      prisma.product.count({ where }),
    ]);
    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), products });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id }, include: { stock: { include: { warehouse: true } } } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const createProduct = async (req, res) => {
  try {
    const { name, category, unit, barcode, description, costPrice, sellingPrice, stock } = req.body;
    const product = await prisma.product.create({
      data: { name, category, unit, barcode, description, costPrice, sellingPrice, ...(stock && { stock: { create: stock.map(({ warehouseId, quantity }) => ({ warehouseId, quantity })) } }) },
      include: { stock: { include: { warehouse: true } } },
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Barcode already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, category, unit, barcode, description, costPrice, sellingPrice } = req.body;
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { name, category, unit, barcode, description, costPrice, sellingPrice }, include: { stock: { include: { warehouse: true } } } });
    res.json({ success: true, product });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Product not found' });
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Barcode already exists' });
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { warehouseId, quantity } = req.body;
    if (!warehouseId || typeof quantity !== 'number') return res.status(400).json({ success: false, message: 'warehouseId and quantity are required' });
    const stock = await prisma.productStock.upsert({
      where: { productId_warehouseId: { productId: req.params.id, warehouseId } },
      update: { quantity },
      create: { productId: req.params.id, warehouseId, quantity },
    });
    res.json({ success: true, stock });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getLowStock = async (req, res) => {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 'global' } });
    const threshold = settings?.lowStockThreshold ?? 10;
    const products = await prisma.product.findMany({ where: { stock: { some: { quantity: { lte: threshold } } } }, include: { stock: { include: { warehouse: true } } } });
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