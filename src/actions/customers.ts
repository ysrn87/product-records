'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// Schemas
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

// Pagination config
const PAGE_SIZE = 10;

// Get customers - filtered by role with pagination
export async function getCustomers(filters?: { search?: string; page?: number }) {
  const session = await auth();
  if (!session?.user) return { customers: [], pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 } };

  const page = filters?.page || 1;
  const skip = (page - 1) * PAGE_SIZE;
  const search = filters?.search;

  // Build where clause
  let whereClause: any = {};

  // For SALES role, only show customers they have sold to
  if (session.user.role === 'SALES') {
    whereClause = {
      sales: {
        some: {
          salespersonId: session.user.id,
        },
      },
    };
  }

  // Add search filter
  if (search) {
    whereClause = {
      ...whereClause,
      AND: [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        },
      ],
    };
  }

  const finalWhere = Object.keys(whereClause).length > 0 ? whereClause : undefined;

  // Run count and data queries in parallel
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: finalWhere,
      include: {
        sales: {
          where: session.user.role === 'SALES' 
            ? { status: 'COMPLETED', salespersonId: session.user.id }
            : { status: 'COMPLETED' },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            date: true,
          },
          orderBy: { date: 'desc' },
          take: 5, // Only get last 5 sales for preview
        },
        _count: {
          select: { 
            sales: session.user.role === 'SALES'
              ? { where: { salespersonId: session.user.id } }
              : true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.customer.count({ where: finalWhere }),
  ]);

  return {
    customers,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

// Get single customer
export async function getCustomer(id: string) {
  const session = await auth();
  if (!session?.user) return null;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sales: {
        where: session.user.role === 'SALES' 
          ? { salespersonId: session.user.id }
          : undefined,
        include: {
          salesperson: {
            select: { name: true },
          },
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
        take: 10,
      },
      _count: {
        select: { 
          sales: session.user.role === 'SALES'
            ? { where: { salespersonId: session.user.id } }
            : true,
        },
      },
    },
  });

  // For SALES role, check if they have any sales with this customer
  if (session.user.role === 'SALES' && customer) {
    const hasSales = await prisma.sale.count({
      where: {
        customerId: id,
        salespersonId: session.user.id,
      },
    });
    
    // If no sales with this customer, still allow viewing but show limited info
    // This allows SALES to search and find customers, but see only their own transactions
  }

  return customer;
}

// Create customer
export async function createCustomer(formData: FormData) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    email: formData.get('email') as string,
  };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const customer = await prisma.customer.create({
      data: {
        name: validated.data.name,
        phone: validated.data.phone || null,
        address: validated.data.address || null,
        email: validated.data.email || null,
      },
    });

    revalidatePath('/dashboard/customers');
    return { success: true, customer };
  } catch (error) {
    console.error('Create customer error:', error);
    return { error: 'Failed to create customer' };
  }
}

// Update customer
export async function updateCustomer(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    email: formData.get('email') as string,
  };

  const validated = customerSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: validated.data.name,
        phone: validated.data.phone || null,
        address: validated.data.address || null,
        email: validated.data.email || null,
      },
    });

    revalidatePath('/dashboard/customers');
    return { success: true, customer };
  } catch (error) {
    console.error('Update customer error:', error);
    return { error: 'Failed to update customer' };
  }
}

// Search customers (for autocomplete) - filtered by role
export async function searchCustomers(query: string) {
  const session = await auth();
  if (!session?.user) return [];
  
  if (!query || query.length < 2) return [];

  let whereClause: any = {
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
    ],
  };

  // For SALES role, only show customers they have sold to
  // But also allow them to search all customers for new sales
  // We'll mark which customers are "their" customers
  const customers = await prisma.customer.findMany({
    where: whereClause,
    take: 10,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          sales: session.user.role === 'SALES'
            ? { where: { salespersonId: session.user.id } }
            : true,
        },
      },
    },
  });

  return customers;
}

// Get customer stats
export async function getCustomerStats(id: string) {
  const session = await auth();
  if (!session?.user) return { totalPurchases: 0, totalSpent: 0 };

  const whereClause = session.user.role === 'SALES'
    ? { customerId: id, status: 'COMPLETED' as const, salespersonId: session.user.id }
    : { customerId: id, status: 'COMPLETED' as const };

  const stats = await prisma.sale.aggregate({
    where: whereClause,
    _sum: {
      totalAmount: true,
    },
    _count: true,
  });

  return {
    totalPurchases: stats._count,
    totalSpent: Number(stats._sum.totalAmount) || 0,
  };
}