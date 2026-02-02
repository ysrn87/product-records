-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_entityType_entityId_idx" ON "activity_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_isActive_idx" ON "product_variants"("isActive");

-- CreateIndex
CREATE INDEX "product_variants_currentStock_idx" ON "product_variants"("currentStock");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "sale_items_saleId_idx" ON "sale_items"("saleId");

-- CreateIndex
CREATE INDEX "sale_items_variantId_idx" ON "sale_items"("variantId");

-- CreateIndex
CREATE INDEX "sales_date_idx" ON "sales"("date");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_customerId_idx" ON "sales"("customerId");

-- CreateIndex
CREATE INDEX "sales_salespersonId_idx" ON "sales"("salespersonId");

-- CreateIndex
CREATE INDEX "sales_status_date_idx" ON "sales"("status", "date");

-- CreateIndex
CREATE INDEX "stock_entries_date_idx" ON "stock_entries"("date");

-- CreateIndex
CREATE INDEX "stock_entries_status_idx" ON "stock_entries"("status");

-- CreateIndex
CREATE INDEX "stock_entries_recordedById_idx" ON "stock_entries"("recordedById");

-- CreateIndex
CREATE INDEX "stock_entry_items_stockEntryId_idx" ON "stock_entry_items"("stockEntryId");

-- CreateIndex
CREATE INDEX "stock_entry_items_variantId_idx" ON "stock_entry_items"("variantId");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
