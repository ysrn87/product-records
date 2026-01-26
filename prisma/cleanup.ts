import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning database (keeping PRIVILEGE user)...\n');

  // Delete in order (respect foreign key constraints)
  
  // 1. Delete Activity Logs
  const deletedLogs = await prisma.activityLog.deleteMany();
  console.log(`✅ Deleted ${deletedLogs.count} activity logs`);

  // 2. Delete Sale Items (cascade from Sales)
  const deletedSaleItems = await prisma.saleItem.deleteMany();
  console.log(`✅ Deleted ${deletedSaleItems.count} sale items`);

  // 3. Delete Sales
  const deletedSales = await prisma.sale.deleteMany();
  console.log(`✅ Deleted ${deletedSales.count} sales`);

  // 4. Delete Customers
  const deletedCustomers = await prisma.customer.deleteMany();
  console.log(`✅ Deleted ${deletedCustomers.count} customers`);

  // 5. Delete Stock Entry Items (cascade from Stock Entries)
  const deletedStockItems = await prisma.stockEntryItem.deleteMany();
  console.log(`✅ Deleted ${deletedStockItems.count} stock entry items`);

  // 6. Delete Stock Entries
  const deletedStockEntries = await prisma.stockEntry.deleteMany();
  console.log(`✅ Deleted ${deletedStockEntries.count} stock entries`);

  // 7. Delete Product Variant Values
  const deletedVariantValues = await prisma.productVariantValue.deleteMany();
  console.log(`✅ Deleted ${deletedVariantValues.count} variant values`);

  // 8. Delete Product Variants
  const deletedVariants = await prisma.productVariant.deleteMany();
  console.log(`✅ Deleted ${deletedVariants.count} product variants`);

  // 9. Delete Variant Options
  const deletedOptions = await prisma.variantOption.deleteMany();
  console.log(`✅ Deleted ${deletedOptions.count} variant options`);

  // 10. Delete Variant Types
  const deletedTypes = await prisma.variantType.deleteMany();
  console.log(`✅ Deleted ${deletedTypes.count} variant types`);

  // 11. Delete Products
  const deletedProducts = await prisma.product.deleteMany();
  console.log(`✅ Deleted ${deletedProducts.count} products`);

  // 12. Delete Categories
  const deletedCategories = await prisma.category.deleteMany();
  console.log(`✅ Deleted ${deletedCategories.count} categories`);

  // 13. Delete non-PRIVILEGE users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: { not: 'PRIVILEGE' },
    },
  });
  console.log(`✅ Deleted ${deletedUsers.count} users (kept PRIVILEGE)`);

  // Keep company profile (optional - uncomment to delete)
  // await prisma.companyProfile.deleteMany();

  console.log('\n🎉 Database cleaned successfully!');
  console.log('\n📋 Remaining PRIVILEGE user:');
  
  const privilegeUser = await prisma.user.findFirst({
    where: { role: 'PRIVILEGE' },
    select: { email: true, name: true },
  });
  
  if (privilegeUser) {
    console.log(`   Email: ${privilegeUser.email}`);
    console.log(`   Name: ${privilegeUser.name}`);
    console.log('   Password: password123');
  }
}

cleanup()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });