import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Company Profile
  const company = await prisma.companyProfile.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      name: 'My Store',
      address: '123 Main Street, City',
      phone: '+62 812 3456 7890',
      email: 'store@example.com',
      invoicePrefix: 'INV',
      stockEntryPrefix: 'SE',
    },
  });
  console.log('✅ Company profile created');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const privilegeUser = await prisma.user.upsert({
    where: { email: 'privilege@example.com' },
    update: {},
    create: {
      email: 'privilege@example.com',
      password: hashedPassword,
      name: 'Super Admin',
      phone: '+62 811 1111 1111',
      role: UserRole.PRIVILEGE,
      status: UserStatus.ACTIVE,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '+62 812 2222 2222',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      createdBy: privilegeUser.id,
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@example.com' },
    update: {},
    create: {
      email: 'sales@example.com',
      password: hashedPassword,
      name: 'Sales Person',
      phone: '+62 813 3333 3333',
      role: UserRole.SALES,
      status: UserStatus.ACTIVE,
      createdBy: adminUser.id,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@example.com' },
    update: {},
    create: {
      email: 'warehouse@example.com',
      password: hashedPassword,
      name: 'Warehouse Staff',
      phone: '+62 814 4444 4444',
      role: UserRole.WAREHOUSE,
      status: UserStatus.ACTIVE,
      createdBy: adminUser.id,
    },
  });

  console.log('✅ Users created');

  // Create Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks', description: 'Various snack products' },
    }),
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages', description: 'Drinks and beverages' },
    }),
    prisma.category.upsert({
      where: { name: 'Frozen Food' },
      update: {},
      create: { name: 'Frozen Food', description: 'Frozen food products' },
    }),
  ]);
  console.log('✅ Categories created');

  // Create Products with Variants
  const keripik = await prisma.product.create({
    data: {
      name: 'Keripik Singkong',
      description: 'Crispy cassava chips with various flavors',
      categoryId: categories[0].id,
      variantTypes: {
        create: [
          {
            name: 'Flavor',
            options: {
              create: [
                { value: 'Original' },
                { value: 'Balado' },
                { value: 'BBQ' },
                { value: 'Cheese' },
              ],
            },
          },
          {
            name: 'Netto',
            options: {
              create: [
                { value: '100gr' },
                { value: '250gr' },
                { value: '500gr' },
              ],
            },
          },
        ],
      },
    },
    include: {
      variantTypes: {
        include: {
          options: true,
        },
      },
    },
  });

  // Create product variants for Keripik
  const flavors = keripik.variantTypes.find((vt) => vt.name === 'Flavor')?.options || [];
  const nettos = keripik.variantTypes.find((vt) => vt.name === 'Netto')?.options || [];

  const basePrices: Record<string, { cost: number; sell: number }> = {
    '100gr': { cost: 8000, sell: 12000 },
    '250gr': { cost: 18000, sell: 25000 },
    '500gr': { cost: 32000, sell: 45000 },
  };

  let skuCounter = 1;
  for (const flavor of flavors) {
    for (const netto of nettos) {
      const prices = basePrices[netto.value] || { cost: 10000, sell: 15000 };
      await prisma.productVariant.create({
        data: {
          sku: `KRP-${String(skuCounter++).padStart(3, '0')}`,
          productId: keripik.id,
          costPrice: prices.cost,
          sellingPrice: prices.sell,
          minStockLevel: 20,
          currentStock: Math.floor(Math.random() * 100) + 50,
          variantValues: {
            create: [
              { variantOptionId: flavor.id },
              { variantOptionId: netto.id },
            ],
          },
        },
      });
    }
  }

  // Create another product - Minuman
  const minuman = await prisma.product.create({
    data: {
      name: 'Jus Buah',
      description: 'Fresh fruit juice',
      categoryId: categories[1].id,
      variantTypes: {
        create: [
          {
            name: 'Flavor',
            options: {
              create: [
                { value: 'Orange' },
                { value: 'Apple' },
                { value: 'Mango' },
                { value: 'Mixed Fruit' },
              ],
            },
          },
          {
            name: 'Size',
            options: {
              create: [
                { value: '250ml' },
                { value: '500ml' },
                { value: '1L' },
              ],
            },
          },
        ],
      },
    },
    include: {
      variantTypes: {
        include: {
          options: true,
        },
      },
    },
  });

  const juiceFlavors = minuman.variantTypes.find((vt) => vt.name === 'Flavor')?.options || [];
  const juiceSizes = minuman.variantTypes.find((vt) => vt.name === 'Size')?.options || [];

  const juicePrices: Record<string, { cost: number; sell: number }> = {
    '250ml': { cost: 5000, sell: 8000 },
    '500ml': { cost: 9000, sell: 14000 },
    '1L': { cost: 16000, sell: 25000 },
  };

  skuCounter = 1;
  for (const flavor of juiceFlavors) {
    for (const size of juiceSizes) {
      const prices = juicePrices[size.value] || { cost: 5000, sell: 8000 };
      await prisma.productVariant.create({
        data: {
          sku: `JUS-${String(skuCounter++).padStart(3, '0')}`,
          productId: minuman.id,
          costPrice: prices.cost,
          sellingPrice: prices.sell,
          minStockLevel: 30,
          currentStock: Math.floor(Math.random() * 150) + 50,
          variantValues: {
            create: [
              { variantOptionId: flavor.id },
              { variantOptionId: size.id },
            ],
          },
        },
      });
    }
  }

  console.log('✅ Products and variants created');

  // Create sample customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'John Doe',
        phone: '+62 821 1234 5678',
        address: '456 Customer Street, City',
        email: 'john@example.com',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Jane Smith',
        phone: '+62 822 8765 4321',
        address: '789 Buyer Avenue, Town',
        email: 'jane@example.com',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Bob Wilson',
        phone: '+62 823 5555 1234',
        address: '321 Client Road, Village',
      },
    }),
  ]);
  console.log('✅ Customers created');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('----------------------------');
  console.log('Privilege: privilege@example.com / password123');
  console.log('Admin: admin@example.com / password123');
  console.log('Sales: sales@example.com / password123');
  console.log('Warehouse: warehouse@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
