'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { generateDocumentNumber } from '@/lib/utils';
import { serializeData, checkAuth } from '@/lib/utils';

// Pagination config
const PAGE_SIZE = 10;

// Schemas
const stockEntryItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
});

const createStockEntrySchema = z.object({
  notes: z.string().optional(),
  items: z.array(stockEntryItemSchema).min(1, 'At least one item is required'),
});

// Get stock entries with filters and pagination
export async function getStockEntries(filters?: {
  startDate?: Date;
  endDate?: Date;
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

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.search) {
    where.entryNumber = { contains: filters.search, mode: 'insensitive' };
  }

  // Run count and data queries in parallel
  const [entries, total] = await Promise.all([
    prisma.stockEntry.findMany({
      where,
      include: {
        recordedBy: true,
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
    prisma.stockEntry.count({ where }),
  ]);

  return {
    entries: serializeData(entries),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

// Get single stock entry
export async function getStockEntry(id: string) {
  const entry = serializeData(await prisma.stockEntry.findUnique({
    where: { id },
    include: {
      recordedBy: true,
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

  return entry;
}

// Create stock entry
export async function createStockEntry(data: z.infer<typeof createStockEntrySchema>) {
  const session = await auth();
  const authError = checkAuth(session, 'PRIVILEGE', 'ADMIN', 'WAREHOUSE');
  if (authError) return authError;
  const currentUser = session!.user!;

  const validated = createStockEntrySchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors.map((e) => e.message).join(', ') };
  }

  const { items, notes } = validated.data;

  try {
    // Run everything inside a single serializable transaction so that:
    //  - Entry number generation and insert are atomic (fixes race condition)
    const entry = serializeData(await prisma.$transaction(async (tx) => {
      // --- Fix: Entry number generation inside the transaction ---
      const company = await tx.companyProfile.findFirst();
      const entryPrefix = company?.stockEntryPrefix || 'SE';

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const latestEntry = await tx.stockEntry.findFirst({
        where: { date: { gte: today } },
        orderBy: { entryNumber: 'desc' },
      });

      let counter = 1;
      if (latestEntry?.entryNumber) {
        const parts = latestEntry.entryNumber.split('-');
        counter = parseInt(parts[parts.length - 1]) + 1;
      }

      const entryNumber = generateDocumentNumber(entryPrefix, counter);

      // Create stock entry
      const newEntry = await tx.stockEntry.create({
        data: {
          entryNumber,
          notes,
          recordedById: currentUser.id,
          items: {
            create: items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              costPrice: item.costPrice,
            })),
          },
        },
        include: {
          recordedBy: true,
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

      // Update stock and cost price
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            currentStock: {
              increment: item.quantity,
            },
            costPrice: item.costPrice, // Update to latest cost price
          },
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: currentUser.id,
          action: 'CREATE_STOCK_ENTRY',
          entityType: 'StockEntry',
          entityId: newEntry.id,
          details: JSON.stringify({
            entryNumber,
            itemCount: items.length,
            totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
          }),
        },
      });

      return newEntry;
    }, {
      isolationLevel: 'Serializable',
    }));

    revalidatePath('/dashboard/stock-in');
    revalidatePath('/dashboard/stock-levels');
    revalidatePath('/dashboard');
    return { success: true, entry };
  } catch (error) {
    console.error('Create stock entry error:', error);
    return { error: 'Failed to create stock entry' };
  }
}

// Cancel stock entry
export async function cancelStockEntry(id: string, reason: string) {
  const session = await auth();
  const authError = checkAuth(session, 'PRIVILEGE', 'ADMIN', 'WAREHOUSE');
  if (authError) return authError;
  const currentUser = session!.user!;

  if (!reason.trim()) {
    return { error: 'Cancel reason is required' };
  }

  try {
    const entry = serializeData(await prisma.stockEntry.findUnique({
      where: { id },
      include: { items: true },
    }));

    if (!entry) {
      return { error: 'Stock entry not found' };
    }

    if (entry.status !== 'COMPLETED') {
      return { error: 'Only completed entries can be cancelled' };
    }

    // Check if stock can be reversed
    for (const item of entry.items) {
      const variant = serializeData(await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      }));

      if (!variant || variant.currentStock < item.quantity) {
        return { error: `Cannot cancel: insufficient stock to reverse for some items` };
      }
    }

    // Cancel entry and reverse stock
    await prisma.$transaction(async (tx) => {
      // Update entry status
      await tx.stockEntry.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelReason: reason,
          cancelledAt: new Date(),
        },
      });

      // Reverse stock
      for (const item of entry.items) {
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
          userId: currentUser.id,
          action: 'CANCEL_STOCK_ENTRY',
          entityType: 'StockEntry',
          entityId: id,
          details: JSON.stringify({ reason }),
        },
      });
    });

    revalidatePath('/dashboard/stock-in');
    revalidatePath('/dashboard/stock-levels');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Cancel stock entry error:', error);
    return { error: 'Failed to cancel stock entry' };
  }
}

// Get all variants for stock entry
export async function getVariantsForStockEntry(search?: string) {
  const variants = serializeData(await prisma.productVariant.findMany({
    where: {
      isActive: true,
      product: {
        isActive: true,
      },
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