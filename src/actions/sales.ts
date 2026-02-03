'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { generateInvoiceNumber } from '@/lib/utils';
import { PaymentMethod } from '@prisma/client';
import { serializeData } from '@/lib/utils';

// Schemas
const saleItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
});

const createSaleSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  discountAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
});

// Pagination config
const PAGE_SIZE = 10;

// Get sales with filters and pagination
export async function getSales(filters?: {
  startDate?: Date;
  endDate?: Date;
  salespersonId?: string;
  status?: string;
  search?: string;
  page?: number;
}) {
  const page = filters?.page || 1;
  const skip = (page - 1) * PAGE_SIZE;

  const where: Record<string, unknown> = {};

  if (filters?.startDate && filters?.endDate) {
    where.date = {
      gte: filters.startDate,
      lte: filters.endDate,
    };
  }

  if (filters?.salespersonId) {
    where.salespersonId = filters.salespersonId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.OR = [
      { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
      { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  // Run count and data queries in parallel
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        salesperson: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales: serializeData(sales),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

// Get single sale
export async function getSale(id: string) {
  const sale = serializeData(await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      salesperson: true,
      items: {
        include: {
          variant: {
            include: {
              product: true,
              variantValues: {
                include: {
                  variantOption: {
                    include: {
                      variantType: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }));

  return sale;
}

// Create sale
export async function createSale(data: z.infer<typeof createSaleSchema>) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const validated = createSaleSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { items, customerId, customerName, customerPhone, customerAddress, paymentMethod, discountAmount, notes } = validated.data;

  try {
    // Check stock availability
    for (const item of items) {
      const variant = serializeData(await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      }));

      if (!variant) {
        return { error: `Product variant not found` };
      }

      if (variant.currentStock < item.quantity) {
        return { error: `Insufficient stock for ${variant.sku}. Available: ${variant.currentStock}` };
      }
    }

    // Get or create customer
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      const customer = serializeData(await prisma.customer.create({
        data: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
        },
      }));
      finalCustomerId = customer.id;
    }

    // Get company profile for invoice prefix
    const company = await prisma.companyProfile.findFirst();
    const invoicePrefix = company?.invoicePrefix || 'INV';

    // Get latest invoice number
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const latestSale = await prisma.sale.findFirst({
      where: { date: { gte: today } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let counter = 1;
    if (latestSale?.invoiceNumber) {
      const parts = latestSale.invoiceNumber.split('-');
      counter = parseInt(parts[parts.length - 1]) + 1;
    }

    const invoiceNumber = generateInvoiceNumber(invoicePrefix, counter);

    // Calculate totals
    let subtotal = 0;
    const saleItems = items.map((item) => {
      const discountAmt = (item.unitPrice * item.quantity * item.discountPercent) / 100;
      const totalPrice = item.unitPrice * item.quantity - discountAmt;
      subtotal += totalPrice;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: discountAmt,
        totalPrice,
      };
    });

    const totalAmount = subtotal - discountAmount;

    // Create sale and update stock in transaction
    const sale = serializeData(await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: finalCustomerId!,
          salespersonId: session.user.id,
          subtotal,
          discountAmount,
          totalAmount,
          paymentMethod,
          notes,
          items: {
            create: saleItems,
          },
        },
        include: {
          customer: true,
          salesperson: true,
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // Update stock
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'CREATE_SALE',
          entityType: 'Sale',
          entityId: newSale.id,
          details: JSON.stringify({
            invoiceNumber,
            totalAmount,
            itemCount: items.length,
          }),
        },
      });

      return newSale;
    }));

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/stock-levels');
    revalidatePath('/dashboard');
    return { success: true, sale };
  } catch (error) {
    console.error('Create sale error:', error);
    return { error: 'Failed to create sale' };
  }
}

// Cancel sale
export async function cancelSale(id: string, reason: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  if (!reason.trim()) {
    return { error: 'Cancel reason is required' };
  }

  try {
    const sale = serializeData(await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    }));

    if (!sale) {
      return { error: 'Sale not found' };
    }

    if (sale.status !== 'COMPLETED') {
      return { error: 'Only completed sales can be cancelled' };
    }

    // Cancel sale and restore stock
    await prisma.$transaction(async (tx) => {
      // Update sale status
      await tx.sale.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelReason: reason,
          cancelledAt: new Date(),
          approvedBy: session.user.id,
        },
      });

      // Restore stock
      for (const item of sale.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: 'CANCEL_SALE',
          entityType: 'Sale',
          entityId: id,
          details: JSON.stringify({ reason }),
        },
      });
    });

    revalidatePath('/dashboard/sales');
    revalidatePath('/dashboard/stock-levels');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Cancel sale error:', error);
    return { error: 'Failed to cancel sale' };
  }
}

// Get available variants for sale
export async function getAvailableVariants(search?: string) {
  const variants = serializeData(await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
      },
      currentStock: { gt: 0 },
      ...(search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              { product: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    include: {
      product: true,
      variantValues: {
        include: {
          variantOption: {
            include: {
              variantType: true,
            },
          },
        },
      },
    },
    orderBy: { product: { name: 'asc' } },
  }));

  return variants;
}