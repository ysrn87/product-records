'use server';

import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getCompanyProfile() {
  try {
    let profile = await prisma.companyProfile.findFirst();
    
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          name: 'My Company',
          invoicePrefix: 'INV',
          stockEntryPrefix: 'SE',
        },
      });
    }
    
    return profile;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
}

export async function updateCompanyProfile(data: {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  invoicePrefix?: string;
  stockEntryPrefix?: string;
}) {
  const session = await auth();
  
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }
  
  try {
    let profile = await prisma.companyProfile.findFirst();
    
    if (profile) {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          //taxNumber: data.taxNumber || null,
          invoicePrefix: data.invoicePrefix || 'INV',
          stockEntryPrefix: data.stockEntryPrefix || 'SE',
        },
      });
    } else {
      profile = await prisma.companyProfile.create({
        data: {
          name: data.name,
          address: data.address || null,
          phone: data.phone || null,
          email: data.email || null,
          //taxNumber: data.taxNumber || null,
          invoicePrefix: data.invoicePrefix || 'INV',
          stockEntryPrefix: data.stockEntryPrefix || 'SE',
        },
      });
    }
    
    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE',
        entityType: 'COMPANY_PROFILE',
        entityId: profile.id,
        details: `Updated company profile: ${data.name}`,
      },
    });
    
    revalidatePath('/dashboard/settings');
    
    return { success: true, profile };
  } catch (error) {
    console.error('Error updating company profile:', error);
    return { error: 'Failed to update company profile' };
  }
}

export async function getActivityLogs(limit = 10) {
  const session = await auth();
  
  if (!session?.user || session.user.role !== 'PRIVILEGE') {
    return [];
  }
  
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    
    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
}
