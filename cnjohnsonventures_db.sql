-- ============================================================
--  DATABASE: u986504880_cn_johnson
--  Website:  cnjohnsonventures.com
--  Host:     Hostinger (phpMyAdmin)
--  Backend:  Express + Socket.IO | Prisma ORM (relationMode=prisma)
--  Generated: 2026-03-09
--
--  NOTE: relationMode = "prisma" — Foreign keys are NOT enforced
--        at the DB level. Prisma client handles all relations.
--        All PKs use VARCHAR(191) to match Prisma cuid() output.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `u986504880_cn_johnson`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `u986504880_cn_johnson`;

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- TABLE: User
-- Admin, Manager, Cashier accounts with JWT auth
-- ============================================================
CREATE TABLE IF NOT EXISTS `User` (
  `id`          VARCHAR(191)  NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `email`       VARCHAR(191)  NOT NULL,
  `password`    VARCHAR(191)  NOT NULL,
  `role`        VARCHAR(50)   NOT NULL DEFAULT 'CASHIER',
  `active`      BOOLEAN       NOT NULL DEFAULT TRUE,
  `approved`    BOOLEAN       NOT NULL DEFAULT FALSE,
  `privileges`  JSON          DEFAULT NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  INDEX `idx_user_role`     (`role`),
  INDEX `idx_user_active`   (`active`),
  INDEX `idx_user_approved` (`approved`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `active`, `approved`)
VALUES (
  'cjadmin0001000000000000001',
  'CN Johnson Admin',
  'admin@cnjohnsonventures.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'ADMIN', TRUE, TRUE
);


-- ============================================================
-- TABLE: Customer
-- Retail and wholesale buyers with loyalty points & balance
-- ============================================================
CREATE TABLE IF NOT EXISTS `Customer` (
  `id`            VARCHAR(191)    NOT NULL,
  `name`          VARCHAR(191)    NOT NULL,
  `email`         VARCHAR(191)    DEFAULT NULL,
  `phone`         VARCHAR(50)     DEFAULT NULL,
  `address`       TEXT            DEFAULT NULL,
  `type`          VARCHAR(50)     NOT NULL DEFAULT 'RETAIL',
  `loyaltyPoints` INT             NOT NULL DEFAULT 0,
  `balance`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `active`        BOOLEAN         NOT NULL DEFAULT TRUE,
  `createdAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                  ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_email_key` (`email`),
  INDEX `idx_customer_type`   (`type`),
  INDEX `idx_customer_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Supplier
-- Vendors with outstanding balance tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS `Supplier` (
  `id`          VARCHAR(191)    NOT NULL,
  `name`        VARCHAR(191)    NOT NULL,
  `email`       VARCHAR(191)    DEFAULT NULL,
  `phone`       VARCHAR(50)     DEFAULT NULL,
  `address`     TEXT            DEFAULT NULL,
  `balance`     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `active`      BOOLEAN         NOT NULL DEFAULT TRUE,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_supplier_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Category
-- Flat product category list (unique names)
-- ============================================================
CREATE TABLE IF NOT EXISTS `Category` (
  `id`          VARCHAR(191)  NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Warehouse
-- Physical or logical storage locations
-- ============================================================
CREATE TABLE IF NOT EXISTS `Warehouse` (
  `id`          VARCHAR(191)  NOT NULL,
  `name`        VARCHAR(191)  NOT NULL,
  `location`    VARCHAR(255)  DEFAULT NULL,
  `active`      BOOLEAN       NOT NULL DEFAULT TRUE,
  `createdAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                              ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Warehouse_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Product
-- Core catalog linked to Category, Supplier, Warehouse
-- ============================================================
CREATE TABLE IF NOT EXISTS `Product` (
  `id`                VARCHAR(191)    NOT NULL,
  `name`              VARCHAR(191)    NOT NULL,
  `sku`               VARCHAR(191)    DEFAULT NULL,
  `barcode`           VARCHAR(191)    DEFAULT NULL,
  `description`       TEXT            DEFAULT NULL,
  `price`             DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `costPrice`         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `stock`             INT             NOT NULL DEFAULT 0,
  `lowStockThreshold` INT             NOT NULL DEFAULT 5,
  `categoryId`        VARCHAR(191)    DEFAULT NULL,
  `supplierId`        VARCHAR(191)    DEFAULT NULL,
  `warehouseId`       VARCHAR(191)    DEFAULT NULL,
  `active`            BOOLEAN         NOT NULL DEFAULT TRUE,
  `createdAt`         DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                      ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_sku_key`     (`sku`),
  UNIQUE KEY `Product_barcode_key` (`barcode`),
  INDEX `idx_product_category`  (`categoryId`),
  INDEX `idx_product_supplier`  (`supplierId`),
  INDEX `idx_product_warehouse` (`warehouseId`),
  INDEX `idx_product_active`    (`active`),
  INDEX `idx_product_stock`     (`stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Sale
-- POS transaction header with loyalty points support
-- ============================================================
CREATE TABLE IF NOT EXISTS `Sale` (
  `id`              VARCHAR(191)    NOT NULL,
  `receiptNo`       VARCHAR(191)    NOT NULL,
  `customerId`      VARCHAR(191)    DEFAULT NULL,
  `userId`          VARCHAR(191)    NOT NULL,
  `subtotal`        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `taxAmount`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `discountAmount`  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`           DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `paymentMethod`   VARCHAR(50)     NOT NULL DEFAULT 'CASH',
  `amountPaid`      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `change`          DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `pointsEarned`    INT             NOT NULL DEFAULT 0,
  `pointsRedeemed`  INT             NOT NULL DEFAULT 0,
  `notes`           TEXT            DEFAULT NULL,
  `status`          VARCHAR(50)     NOT NULL DEFAULT 'COMPLETED',
  `createdAt`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Sale_receiptNo_key` (`receiptNo`),
  INDEX `idx_sale_customer`  (`customerId`),
  INDEX `idx_sale_user`      (`userId`),
  INDEX `idx_sale_status`    (`status`),
  INDEX `idx_sale_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: SaleItem
-- Line items per sale
-- ============================================================
CREATE TABLE IF NOT EXISTS `SaleItem` (
  `id`          VARCHAR(191)    NOT NULL,
  `saleId`      VARCHAR(191)    NOT NULL,
  `productId`   VARCHAR(191)    NOT NULL,
  `quantity`    INT             NOT NULL DEFAULT 1,
  `unitPrice`   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `costPrice`   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `discount`    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_saleitem_sale`    (`saleId`),
  INDEX `idx_saleitem_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Purchase
-- Supplier purchase orders with partial payment tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS `Purchase` (
  `id`            VARCHAR(191)    NOT NULL,
  `invoiceNo`     VARCHAR(191)    NOT NULL,
  `supplierId`    VARCHAR(191)    NOT NULL,
  `userId`        VARCHAR(191)    NOT NULL,
  `total`         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `paidAmount`    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `paymentMethod` VARCHAR(50)     NOT NULL DEFAULT 'CASH',
  `status`        VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
  `notes`         TEXT            DEFAULT NULL,
  `createdAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                  ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Purchase_invoiceNo_key` (`invoiceNo`),
  INDEX `idx_purchase_supplier`  (`supplierId`),
  INDEX `idx_purchase_user`      (`userId`),
  INDEX `idx_purchase_status`    (`status`),
  INDEX `idx_purchase_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: PurchaseItem
-- Line items per purchase order
-- ============================================================
CREATE TABLE IF NOT EXISTS `PurchaseItem` (
  `id`          VARCHAR(191)    NOT NULL,
  `purchaseId`  VARCHAR(191)    NOT NULL,
  `productId`   VARCHAR(191)    NOT NULL,
  `quantity`    INT             NOT NULL DEFAULT 1,
  `unitCost`    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_purchaseitem_purchase` (`purchaseId`),
  INDEX `idx_purchaseitem_product`  (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Quote
-- Sales quotations PENDING -> ACCEPTED / REJECTED / EXPIRED
-- ============================================================
CREATE TABLE IF NOT EXISTS `Quote` (
  `id`              VARCHAR(191)    NOT NULL,
  `quoteNo`         VARCHAR(191)    NOT NULL,
  `customerId`      VARCHAR(191)    DEFAULT NULL,
  `userId`          VARCHAR(191)    NOT NULL,
  `subtotal`        DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `taxAmount`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `discountAmount`  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`           DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `status`          VARCHAR(50)     NOT NULL DEFAULT 'PENDING',
  `validUntil`      DATETIME(3)     DEFAULT NULL,
  `notes`           TEXT            DEFAULT NULL,
  `createdAt`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Quote_quoteNo_key` (`quoteNo`),
  INDEX `idx_quote_customer` (`customerId`),
  INDEX `idx_quote_user`     (`userId`),
  INDEX `idx_quote_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: QuoteItem
-- Line items per quote
-- ============================================================
CREATE TABLE IF NOT EXISTS `QuoteItem` (
  `id`          VARCHAR(191)    NOT NULL,
  `quoteId`     VARCHAR(191)    NOT NULL,
  `productId`   VARCHAR(191)    NOT NULL,
  `quantity`    INT             NOT NULL DEFAULT 1,
  `unitPrice`   DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `discount`    DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_quoteitem_quote`   (`quoteId`),
  INDEX `idx_quoteitem_product` (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: CreditNote
-- Refund/credit docs linked to Customer and optionally Sale
-- ============================================================
CREATE TABLE IF NOT EXISTS `CreditNote` (
  `id`          VARCHAR(191)    NOT NULL,
  `creditNo`    VARCHAR(191)    NOT NULL,
  `customerId`  VARCHAR(191)    NOT NULL,
  `saleId`      VARCHAR(191)    DEFAULT NULL,
  `userId`      VARCHAR(191)    NOT NULL,
  `total`       DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `reason`      TEXT            DEFAULT NULL,
  `status`      VARCHAR(50)     NOT NULL DEFAULT 'OPEN',
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CreditNote_creditNo_key` (`creditNo`),
  INDEX `idx_creditnote_customer` (`customerId`),
  INDEX `idx_creditnote_sale`     (`saleId`),
  INDEX `idx_creditnote_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: CreditNoteItem
-- Line items per credit note
-- ============================================================
CREATE TABLE IF NOT EXISTS `CreditNoteItem` (
  `id`            VARCHAR(191)    NOT NULL,
  `creditNoteId`  VARCHAR(191)    NOT NULL,
  `productId`     VARCHAR(191)    NOT NULL,
  `quantity`      INT             NOT NULL DEFAULT 1,
  `unitPrice`     DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `total`         DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `createdAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_creditnoteitem_creditnote` (`creditNoteId`),
  INDEX `idx_creditnoteitem_product`    (`productId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Expense
-- Business expenses with optional category tagging
-- ============================================================
CREATE TABLE IF NOT EXISTS `Expense` (
  `id`          VARCHAR(191)    NOT NULL,
  `description` VARCHAR(255)    NOT NULL,
  `amount`      DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
  `category`    VARCHAR(100)    DEFAULT NULL,
  `userId`      VARCHAR(191)    NOT NULL,
  `receiptPath` VARCHAR(255)    DEFAULT NULL,
  `notes`       TEXT            DEFAULT NULL,
  `expenseDate` DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_expense_user`     (`userId`),
  INDEX `idx_expense_category` (`category`),
  INDEX `idx_expense_date`     (`expenseDate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: StockTransfer
-- Product stock movement between warehouses
-- ============================================================
CREATE TABLE IF NOT EXISTS `StockTransfer` (
  `id`              VARCHAR(191)    NOT NULL,
  `productId`       VARCHAR(191)    NOT NULL,
  `fromWarehouseId` VARCHAR(191)    DEFAULT NULL,
  `toWarehouseId`   VARCHAR(191)    DEFAULT NULL,
  `quantity`        INT             NOT NULL DEFAULT 0,
  `userId`          VARCHAR(191)    NOT NULL,
  `notes`           TEXT            DEFAULT NULL,
  `createdAt`       DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_transfer_product`        (`productId`),
  INDEX `idx_transfer_from_warehouse` (`fromWarehouseId`),
  INDEX `idx_transfer_to_warehouse`   (`toWarehouseId`),
  INDEX `idx_transfer_user`           (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- TABLE: Settings  (singleton — id = 'global')
-- ============================================================
CREATE TABLE IF NOT EXISTS `Settings` (
  `id`                  VARCHAR(191)    NOT NULL DEFAULT 'global',
  `businessName`        VARCHAR(191)    NOT NULL DEFAULT 'CN Johnson Ventures',
  `businessAddress`     TEXT            DEFAULT NULL,
  `businessPhone`       VARCHAR(50)     DEFAULT NULL,
  `businessEmail`       VARCHAR(191)    DEFAULT NULL,
  `businessLogo`        VARCHAR(255)    DEFAULT NULL,
  `taxEnabled`          BOOLEAN         NOT NULL DEFAULT FALSE,
  `taxRate`             DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
  `taxLabel`            VARCHAR(50)     NOT NULL DEFAULT 'VAT',
  `receiptPrefix`       VARCHAR(20)     NOT NULL DEFAULT 'RCP-',
  `invoicePrefix`       VARCHAR(20)     NOT NULL DEFAULT 'INV-',
  `quotePrefix`         VARCHAR(20)     NOT NULL DEFAULT 'QTE-',
  `creditNotePrefix`    VARCHAR(20)     NOT NULL DEFAULT 'CN-',
  `receiptCounter`      INT             NOT NULL DEFAULT 1,
  `invoiceCounter`      INT             NOT NULL DEFAULT 1,
  `quoteCounter`        INT             NOT NULL DEFAULT 1,
  `creditNoteCounter`   INT             NOT NULL DEFAULT 1,
  `loyaltyEnabled`      BOOLEAN         NOT NULL DEFAULT FALSE,
  `pointsPerCurrency`   DECIMAL(8,2)    NOT NULL DEFAULT 1.00,
  `pointsRedeemRate`    DECIMAL(8,2)    NOT NULL DEFAULT 1.00,
  `enableBulkDiscount`  BOOLEAN         NOT NULL DEFAULT FALSE,
  `currencySymbol`      VARCHAR(10)     NOT NULL DEFAULT '$',
  `currencyCode`        VARCHAR(10)     NOT NULL DEFAULT 'USD',
  `updatedAt`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                        ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `Settings` (`id`, `businessName`, `businessEmail`)
VALUES ('global', 'CN Johnson Ventures', 'info@cnjohnsonventures.com')
ON DUPLICATE KEY UPDATE `id` = `id`;


-- ============================================================
-- TABLE: BulkDiscountTier
-- Tiered bulk pricing rules linked to Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS `BulkDiscountTier` (
  `id`          VARCHAR(191)    NOT NULL,
  `settingsId`  VARCHAR(191)    NOT NULL DEFAULT 'global',
  `minQuantity` INT             NOT NULL DEFAULT 1,
  `discountPct` DECIMAL(5,2)   NOT NULL DEFAULT 0.00,
  `label`       VARCHAR(100)    DEFAULT NULL,
  `createdAt`   DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_bulkdiscount_settings` (`settingsId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW `v_sale_summary` AS
  SELECT
    s.`id`,
    s.`receiptNo`,
    COALESCE(c.`name`, 'Walk-in') AS `customerName`,
    u.`name`                       AS `cashierName`,
    s.`total`,
    s.`paymentMethod`,
    s.`status`,
    s.`pointsEarned`,
    s.`pointsRedeemed`,
    s.`createdAt`
  FROM `Sale` s
  LEFT JOIN `Customer` c ON c.`id` = s.`customerId`
  LEFT JOIN `User`     u ON u.`id` = s.`userId`;

CREATE OR REPLACE VIEW `v_inventory_status` AS
  SELECT
    p.`id`,
    p.`sku`,
    p.`barcode`,
    p.`name`,
    cat.`name`  AS `category`,
    p.`stock`,
    p.`lowStockThreshold`,
    p.`price`,
    p.`costPrice`,
    CASE
      WHEN p.`stock` <= p.`lowStockThreshold` THEN 'REORDER NOW'
      ELSE 'OK'
    END         AS `stock_alert`,
    p.`active`
  FROM `Product` p
  LEFT JOIN `Category` cat ON cat.`id` = p.`categoryId`;

CREATE OR REPLACE VIEW `v_supplier_balances` AS
  SELECT
    s.`id`,
    s.`name`,
    s.`email`,
    s.`phone`,
    s.`balance`,
    COUNT(p.`id`)       AS `totalPurchases`,
    SUM(p.`total`)      AS `totalOrdered`,
    SUM(p.`paidAmount`) AS `totalPaid`
  FROM `Supplier` s
  LEFT JOIN `Purchase` p ON p.`supplierId` = s.`id`
  GROUP BY s.`id`, s.`name`, s.`email`, s.`phone`, s.`balance`
  ORDER BY s.`balance` DESC;


SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- END — 18 tables + 3 views
-- Upload via: phpMyAdmin > Import tab > Select this file > Go
-- ============================================================