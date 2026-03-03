-- CreateIndex
CREATE INDEX "product_variants_isActive_currentStock_idx" ON "product_variants"("isActive", "currentStock");
