import prisma from '../config/db.js';

const dateFilter = (from, to) => ({
  ...((from || to) && { createdAt: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }),
});

export const getSalesSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = dateFilter(from, to);
    const [aggregate, paymentBreakdown, topProducts, topCustomers] = await Promise.all([
      prisma.sale.aggregate({ where, _sum: { total: true, taxAmt: true, discountAmt: true }, _count: { id: true } }),
      prisma.sale.groupBy({ by: ['paymentMethod'], where, _sum: { total: true }, _count: { id: true } }),
      prisma.saleItem.groupBy({ by: ['productId'], where: { sale: where }, _sum: { qty: true, total: true }, orderBy: { _sum: { total: 'desc' } }, take: 10 }),
      prisma.sale.groupBy({ by: ['customerId'], where: { ...where, customerId: { not: null } }, _sum: { total: true }, _count: { id: true }, orderBy: { _sum: { total: 'desc' } }, take: 10 }),
    ]);

    const products = await prisma.product.findMany({ where: { id: { in: topProducts.map((p) => p.productId) } }, select: { id: true, name: true } });
    const productsMap = Object.fromEntries(products.map((p) => [p.id, p]));
    const customers = await prisma.customer.findMany({ where: { id: { in: topCustomers.map((c) => c.customerId).filter(Boolean) } }, select: { id: true, name: true } });
    const customersMap = Object.fromEntries(customers.map((c) => [c.id, c]));

    res.json({
      success: true,
      summary: { totalSales: aggregate._count.id, totalRevenue: aggregate._sum.total || 0, totalTax: aggregate._sum.taxAmt || 0, totalDiscount: aggregate._sum.discountAmt || 0 },
      paymentBreakdown: paymentBreakdown.map((p) => ({ method: p.paymentMethod, count: p._count.id, total: p._sum.total || 0 })),
      topProducts: topProducts.map((p) => ({ product: productsMap[p.productId], qtySold: p._sum.qty || 0, revenue: p._sum.total || 0 })),
      topCustomers: topCustomers.map((c) => ({ customer: customersMap[c.customerId], purchases: c._count.id, totalSpent: c._sum.total || 0 })),
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getPurchasesSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = dateFilter(from, to);
    const [aggregate, topSuppliers] = await Promise.all([
      prisma.purchase.aggregate({ where, _sum: { total: true }, _count: { id: true } }),
      prisma.purchase.groupBy({ by: ['supplierId'], where: { ...where, supplierId: { not: null } }, _sum: { total: true }, _count: { id: true }, orderBy: { _sum: { total: 'desc' } }, take: 10 }),
    ]);
    const suppliers = await prisma.supplier.findMany({ where: { id: { in: topSuppliers.map((s) => s.supplierId).filter(Boolean) } }, select: { id: true, name: true } });
    const suppliersMap = Object.fromEntries(suppliers.map((s) => [s.id, s]));
    res.json({ success: true, summary: { totalPurchases: aggregate._count.id, totalSpend: aggregate._sum.total || 0 }, topSuppliers: topSuppliers.map((s) => ({ supplier: suppliersMap[s.supplierId], purchases: s._count.id, totalSpend: s._sum.total || 0 })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getExpensesSummary = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { ...((from || to) && { date: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }) };
    const [aggregate, byCategory] = await Promise.all([
      prisma.expense.aggregate({ where, _sum: { amount: true }, _count: { id: true } }),
      prisma.expense.groupBy({ by: ['category'], where, _sum: { amount: true }, _count: { id: true }, orderBy: { _sum: { amount: 'desc' } } }),
    ]);
    res.json({ success: true, summary: { totalExpenses: aggregate._count.id, totalAmount: aggregate._sum.amount || 0 }, byCategory: byCategory.map((c) => ({ category: c.category || 'Uncategorized', count: c._count.id, total: c._sum.amount || 0 })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getProfitLoss = async (req, res) => {
  try {
    const { from, to } = req.query;
    const df = { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) };
    const [sales, purchases, expenses] = await Promise.all([
      prisma.sale.aggregate({ where: { createdAt: df }, _sum: { total: true, taxAmt: true, discountAmt: true } }),
      prisma.purchase.aggregate({ where: { createdAt: df }, _sum: { total: true } }),
      prisma.expense.aggregate({ where: { date: df }, _sum: { amount: true } }),
    ]);
    const revenue = sales._sum.total || 0;
    const costOfGoods = purchases._sum.total || 0;
    const expensesTotal = expenses._sum.amount || 0;
    res.json({ success: true, report: { revenue, costOfGoods, grossProfit: revenue - costOfGoods, expenses: expensesTotal, netProfit: revenue - costOfGoods - expensesTotal, tax: sales._sum.taxAmt || 0, discounts: sales._sum.discountAmt || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getStockValuation = async (req, res) => {
  try {
    const products = await prisma.product.findMany({ include: { stock: { include: { warehouse: true } } } });
    let totalCostValue = 0, totalSellingValue = 0;
    const report = products.map((product) => {
      const totalQty = product.stock.reduce((sum, s) => sum + s.quantity, 0);
      const costValue = totalQty * product.costPrice;
      const sellingValue = totalQty * product.sellingPrice;
      totalCostValue += costValue;
      totalSellingValue += sellingValue;
      return { product: { id: product.id, name: product.name }, totalQty, costPrice: product.costPrice, sellingPrice: product.sellingPrice, costValue, sellingValue, potentialProfit: sellingValue - costValue };
    });
    res.json({ success: true, summary: { totalProducts: products.length, totalCostValue, totalSellingValue, potentialProfit: totalSellingValue - totalCostValue }, report });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};