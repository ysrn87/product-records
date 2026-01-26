import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const updated = await prisma.companyProfile.update({
      where: { id: data.id },
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        invoicePrefix: data.invoicePrefix,
        stockEntryPrefix: data.stockEntryPrefix,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_SETTINGS',
        entityType: 'CompanyProfile',
        entityId: updated.id,
        details: 'Updated company profile settings',
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update company profile:', error);
    return NextResponse.json(
      { error: 'Failed to update company profile' },
      { status: 500 }
    );
  }
}
