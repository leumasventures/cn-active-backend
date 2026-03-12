-- ================================================================
--  C.N. Johnson Ventures — MySQL Schema
--  Generated to match prisma/schema.prisma EXACTLY
--  Database: u986504880_cnjohnson_db
-- ================================================================

USE u986504880_cnjohnson_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop everything cleanly
DROP TABLE IF EXISTS BulkDiscountTier;
DROP TABLE IF EXISTS StockTransfer;
DROP TABLE IF EXISTS CreditNoteItem;
DROP TABLE IF EXISTS CreditNote;
DROP TABLE IF EXISTS QuoteItem;
DROP TABLE IF EXISTS Quote;
DROP TABLE IF EXISTS PurchaseItem;
DROP TABLE IF EXISTS Purchase;
DROP TABLE IF EXISTS SaleItem;
DROP TABLE IF EXISTS Sale;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Warehouse;
DROP TABLE IF EXISTS Supplier;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS Expense;
DROP TABLE IF EXISTS Settings;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS _prisma_migrations;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
--  User
-- ================================================================
CREATE TABLE `User` (
  `id`         VARCHAR(191) NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `email`      VARCHAR(191) NOT NULL,
  `password`   VARCHAR(191) NOT NULL,
  `role`       ENUM('ADMIN','MANAGER','CASHIER') NOT NULL DEFAULT 'CASHIER',
  `active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `approved`   TINYINT(1)   NOT NULL DEFAULT 0,
  `privileges` JSON,
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`  DATETIME(3)  NOT NULL,
  `appState`   LONGTEXT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Customer
-- ================================================================
CREATE TABLE `Customer` (
  `id`            VARCHAR(191) NOT NULL,
  `name`          VARCHAR(191) NOT NULL,
  `email`         VARCHAR(191),
  `phone`         VARCHAR(191),
  `address`       VARCHAR(191),
  `loyaltyPoints` INT          NOT NULL DEFAULT 0,
  `balance`       DOUBLE       NOT NULL DEFAULT 0,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Supplier  — added: contactPerson, notes
-- ================================================================
CREATE TABLE `Supplier` (
  `id`            VARCHAR(191) NOT NULL,
  `name`          VARCHAR(191) NOT NULL,
  `email`         VARCHAR(191),
  `phone`         VARCHAR(191),
  `address`       VARCHAR(191),
  `contactPerson` VARCHAR(191),
  `notes`         TEXT,
  `balance`       DOUBLE       NOT NULL DEFAULT 0,
  `createdAt`     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Supplier_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Warehouse
-- ================================================================
CREATE TABLE `Warehouse` (
  `id`          VARCHAR(191) NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `location`    VARCHAR(191),
  `description` VARCHAR(191),
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Category
-- ================================================================
CREATE TABLE `Category` (
  `id`        VARCHAR(191) NOT NULL,
  `name`      VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Product
-- ================================================================
CREATE TABLE `Product` (
  `id`                VARCHAR(191) NOT NULL,
  `name`              VARCHAR(191) NOT NULL,
  `sku`               VARCHAR(191),
  `barcode`           VARCHAR(191),
  `description`       VARCHAR(191),
  `price`             DOUBLE       NOT NULL,
  `costPrice`         DOUBLE,
  `taxRate`           DOUBLE,
  `stock`             INT          NOT NULL DEFAULT 0,
  `lowStockThreshold` INT,
  `unit`              VARCHAR(191),
  `imageUrl`          VARCHAR(191),
  `active`            TINYINT(1)   NOT NULL DEFAULT 1,
  `createdAt`         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3)  NOT NULL,
  `categoryId`        VARCHAR(191),
  `supplierId`        VARCHAR(191),
  `warehouseId`       VARCHAR(191),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_sku_key`     (`sku`),
  UNIQUE KEY `Product_barcode_key` (`barcode`),
  KEY `Product_categoryId_fkey`    (`categoryId`),
  KEY `Product_supplierId_fkey`    (`supplierId`),
  KEY `Product_warehouseId_fkey`   (`warehouseId`),
  CONSTRAINT `Product_categoryId_fkey`  FOREIGN KEY (`categoryId`)  REFERENCES `Category`  (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_supplierId_fkey`  FOREIGN KEY (`supplierId`)  REFERENCES `Supplier`  (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Sale  — added: salesRepId, salesRepName, origin
-- ================================================================
CREATE TABLE `Sale` (
  `id`             VARCHAR(191) NOT NULL,
  `receiptNo`      VARCHAR(191) NOT NULL,
  `customerId`     VARCHAR(191),
  `subtotal`       DOUBLE       NOT NULL,
  `discount`       DOUBLE       NOT NULL DEFAULT 0,
  `tax`            DOUBLE       NOT NULL DEFAULT 0,
  `total`          DOUBLE       NOT NULL,
  `paymentMethod`  VARCHAR(191),
  `pointsEarned`   INT          NOT NULL DEFAULT 0,
  `pointsRedeemed` INT          NOT NULL DEFAULT 0,
  `note`           VARCHAR(191),
  `salesRepId`     VARCHAR(191),
  `salesRepName`   VARCHAR(191),
  `origin`         VARCHAR(191),
  `createdAt`      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Sale_receiptNo_key` (`receiptNo`),
  KEY `Sale_customerId_fkey` (`customerId`),
  CONSTRAINT `Sale_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  SaleItem
-- ================================================================
CREATE TABLE `SaleItem` (
  `id`        VARCHAR(191) NOT NULL,
  `saleId`    VARCHAR(191) NOT NULL,
  `productId` VARCHAR(191) NOT NULL,
  `qty`       INT          NOT NULL,
  `price`     DOUBLE       NOT NULL,
  `discount`  DOUBLE       NOT NULL DEFAULT 0,
  `total`     DOUBLE       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SaleItem_saleId_fkey`    (`saleId`),
  KEY `SaleItem_productId_fkey` (`productId`),
  CONSTRAINT `SaleItem_saleId_fkey`    FOREIGN KEY (`saleId`)    REFERENCES `Sale`    (`id`) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Purchase  — added: warehouseId, repId, notes; supplierId now nullable
-- ================================================================
CREATE TABLE `Purchase` (
  `id`          VARCHAR(191) NOT NULL,
  `purchaseNo`  VARCHAR(191) NOT NULL,
  `supplierId`  VARCHAR(191),
  `warehouseId` VARCHAR(191),
  `repId`       VARCHAR(191),
  `total`       DOUBLE       NOT NULL,
  `paidAmount`  DOUBLE       NOT NULL DEFAULT 0,
  `note`        VARCHAR(191),
  `notes`       TEXT,
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Purchase_purchaseNo_key` (`purchaseNo`),
  KEY `Purchase_supplierId_fkey`  (`supplierId`),
  KEY `Purchase_warehouseId_fkey` (`warehouseId`),
  KEY `Purchase_repId_fkey`       (`repId`),
  CONSTRAINT `Purchase_supplierId_fkey`  FOREIGN KEY (`supplierId`)  REFERENCES `Supplier`  (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Purchase_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Purchase_repId_fkey`       FOREIGN KEY (`repId`)       REFERENCES `User`      (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  PurchaseItem
-- ================================================================
CREATE TABLE `PurchaseItem` (
  `id`         VARCHAR(191) NOT NULL,
  `purchaseId` VARCHAR(191) NOT NULL,
  `productId`  VARCHAR(191) NOT NULL,
  `qty`        INT          NOT NULL,
  `costPrice`  DOUBLE       NOT NULL,
  `total`      DOUBLE       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PurchaseItem_purchaseId_fkey` (`purchaseId`),
  KEY `PurchaseItem_productId_fkey`  (`productId`),
  CONSTRAINT `PurchaseItem_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `Purchase` (`id`) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `PurchaseItem_productId_fkey`  FOREIGN KEY (`productId`)  REFERENCES `Product`  (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Quote  — added: repId, notes
-- ================================================================
CREATE TABLE `Quote` (
  `id`         VARCHAR(191) NOT NULL,
  `quoteNo`    VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191),
  `repId`      VARCHAR(191),
  `subtotal`   DOUBLE       NOT NULL,
  `discount`   DOUBLE       NOT NULL DEFAULT 0,
  `tax`        DOUBLE       NOT NULL DEFAULT 0,
  `total`      DOUBLE       NOT NULL,
  `validUntil` DATETIME(3),
  `note`       VARCHAR(191),
  `notes`      TEXT,
  `status`     ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Quote_quoteNo_key` (`quoteNo`),
  KEY `Quote_customerId_fkey` (`customerId`),
  KEY `Quote_repId_fkey`      (`repId`),
  CONSTRAINT `Quote_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Quote_repId_fkey`      FOREIGN KEY (`repId`)      REFERENCES `User`     (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  QuoteItem  — added: unitPrice, discountPct
-- ================================================================
CREATE TABLE `QuoteItem` (
  `id`          VARCHAR(191) NOT NULL,
  `quoteId`     VARCHAR(191) NOT NULL,
  `productId`   VARCHAR(191) NOT NULL,
  `qty`         INT          NOT NULL,
  `price`       DOUBLE       NOT NULL,
  `unitPrice`   DOUBLE,
  `discount`    DOUBLE       NOT NULL DEFAULT 0,
  `discountPct` DOUBLE       NOT NULL DEFAULT 0,
  `total`       DOUBLE       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `QuoteItem_quoteId_fkey`   (`quoteId`),
  KEY `QuoteItem_productId_fkey` (`productId`),
  CONSTRAINT `QuoteItem_quoteId_fkey`   FOREIGN KEY (`quoteId`)   REFERENCES `Quote`   (`id`) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `QuoteItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  CreditNote
-- ================================================================
CREATE TABLE `CreditNote` (
  `id`         VARCHAR(191) NOT NULL,
  `creditNo`   VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191),
  `saleId`     VARCHAR(191),
  `amount`     DOUBLE       NOT NULL,
  `reason`     VARCHAR(191),
  `createdAt`  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CreditNote_creditNo_key` (`creditNo`),
  KEY `CreditNote_customerId_fkey` (`customerId`),
  KEY `CreditNote_saleId_fkey`     (`saleId`),
  CONSTRAINT `CreditNote_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `CreditNote_saleId_fkey`     FOREIGN KEY (`saleId`)     REFERENCES `Sale`     (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  CreditNoteItem
-- ================================================================
CREATE TABLE `CreditNoteItem` (
  `id`           VARCHAR(191) NOT NULL,
  `creditNoteId` VARCHAR(191) NOT NULL,
  `productId`    VARCHAR(191) NOT NULL,
  `qty`          INT          NOT NULL,
  `price`        DOUBLE       NOT NULL,
  `total`        DOUBLE       NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CreditNoteItem_creditNoteId_fkey` (`creditNoteId`),
  KEY `CreditNoteItem_productId_fkey`    (`productId`),
  CONSTRAINT `CreditNoteItem_creditNoteId_fkey` FOREIGN KEY (`creditNoteId`) REFERENCES `CreditNote` (`id`) ON DELETE CASCADE  ON UPDATE CASCADE,
  CONSTRAINT `CreditNoteItem_productId_fkey`    FOREIGN KEY (`productId`)    REFERENCES `Product`    (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Expense  — added: expenseNo, description, notes, repId; title now nullable
-- ================================================================
CREATE TABLE `Expense` (
  `id`          VARCHAR(191) NOT NULL,
  `expenseNo`   VARCHAR(191),
  `title`       VARCHAR(191),
  `description` TEXT,
  `amount`      DOUBLE       NOT NULL,
  `category`    VARCHAR(191),
  `note`        VARCHAR(191),
  `notes`       TEXT,
  `date`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `repId`       VARCHAR(191),
  `createdAt`   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Expense_expenseNo_key` (`expenseNo`),
  KEY `Expense_repId_fkey` (`repId`),
  CONSTRAINT `Expense_repId_fkey` FOREIGN KEY (`repId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  StockTransfer
-- ================================================================
CREATE TABLE `StockTransfer` (
  `id`              VARCHAR(191) NOT NULL,
  `productId`       VARCHAR(191) NOT NULL,
  `fromWarehouseId` VARCHAR(191) NOT NULL,
  `toWarehouseId`   VARCHAR(191) NOT NULL,
  `qty`             INT          NOT NULL,
  `note`            VARCHAR(191),
  `createdAt`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `StockTransfer_productId_fkey`       (`productId`),
  KEY `StockTransfer_fromWarehouseId_fkey` (`fromWarehouseId`),
  KEY `StockTransfer_toWarehouseId_fkey`   (`toWarehouseId`),
  CONSTRAINT `StockTransfer_productId_fkey`       FOREIGN KEY (`productId`)       REFERENCES `Product`   (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `StockTransfer_fromWarehouseId_fkey` FOREIGN KEY (`fromWarehouseId`) REFERENCES `Warehouse` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `StockTransfer_toWarehouseId_fkey`   FOREIGN KEY (`toWarehouseId`)   REFERENCES `Warehouse` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  Settings
-- ================================================================
CREATE TABLE `Settings` (
  `id`                    VARCHAR(191) NOT NULL DEFAULT 'global',
  `companyName`           VARCHAR(191),
  `address`               VARCHAR(191),
  `phone`                 VARCHAR(191),
  `email`                 VARCHAR(191),
  `currency`              VARCHAR(191) NOT NULL DEFAULT 'USD',
  `taxRate`               DOUBLE       NOT NULL DEFAULT 0,
  `lowStockThreshold`     INT          NOT NULL DEFAULT 10,
  `invoicePrefix`         VARCHAR(191) NOT NULL DEFAULT 'INV',
  `receiptPrefix`         VARCHAR(191) NOT NULL DEFAULT 'REC',
  `quotePrefix`           VARCHAR(191) NOT NULL DEFAULT 'QUO',
  `creditNotePrefix`      VARCHAR(191) NOT NULL DEFAULT 'CN',
  `enableBulkDiscount`    TINYINT(1)   NOT NULL DEFAULT 0,
  `loyaltyPointsRate`     DOUBLE       NOT NULL DEFAULT 1,
  `loyaltyRedemptionRate` DOUBLE       NOT NULL DEFAULT 0.01,
  `nextInvoiceNo`         INT          NOT NULL DEFAULT 1001,
  `nextReceiptNo`         INT          NOT NULL DEFAULT 5001,
  `nextQuoteNo`           INT          NOT NULL DEFAULT 2001,
  `nextCreditNoteNo`      INT          NOT NULL DEFAULT 4001,
  `nextPurchaseNo`        INT          NOT NULL DEFAULT 3001,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  BulkDiscountTier
-- ================================================================
CREATE TABLE `BulkDiscountTier` (
  `id`          VARCHAR(191) NOT NULL,
  `settingsId`  VARCHAR(191) NOT NULL,
  `name`        VARCHAR(191) NOT NULL,
  `minQty`      INT          NOT NULL,
  `maxQty`      INT,
  `discountPct` DOUBLE       NOT NULL,
  `active`      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `BulkDiscountTier_settingsId_fkey` (`settingsId`),
  CONSTRAINT `BulkDiscountTier_settingsId_fkey` FOREIGN KEY (`settingsId`) REFERENCES `Settings` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
--  SEED — required default settings row
-- ================================================================
INSERT INTO `Settings` (`id`, `companyName`, `address`, `phone`, `email`,
  `currency`, `taxRate`, `lowStockThreshold`, `invoicePrefix`, `receiptPrefix`,
  `quotePrefix`, `creditNotePrefix`, `enableBulkDiscount`, `loyaltyPointsRate`,
  `loyaltyRedemptionRate`, `nextInvoiceNo`, `nextReceiptNo`, `nextQuoteNo`,
  `nextCreditNoteNo`, `nextPurchaseNo`)
VALUES ('global', 'C.N. Johnson Ventures Limited', 'Aba, Abia State, Nigeria',
  '+234 803 000 0000', 'info@cnjohnson.com',
  '₦', 7.5, 10, 'INV', 'RCP', 'QTE', 'CN', 1, 1, 100,
  1001, 5001, 2001, 4001, 3001);

SET FOREIGN_KEY_CHECKS = 1;