'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@prisma/client';

// Schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

// Get users based on role permissions
export async function getUsers() {
  const session = await auth();
  if (!session?.user) return [];

  let where = {};
  
  // PRIVILEGE can see all users
  // ADMIN can see SALES and WAREHOUSE users
  if (session.user.role === 'ADMIN') {
    where = {
      role: {
        in: ['SALES', 'WAREHOUSE'],
      },
    };
  } else if (session.user.role !== 'PRIVILEGE') {
    return [];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
}

// Get single user
export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// Create user
export async function createUser(data: z.infer<typeof createUserSchema>) {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized' };

  // Check permissions
  const canCreate = checkUserCreationPermission(session.user.role, data.role);
  if (!canCreate) {
    return { error: 'You do not have permission to create this type of user' };
  }

  const validated = createUserSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.data.email },
    });

    if (existingUser) {
      return { error: 'Email already exists' };
    }

    const hashedPassword = await bcrypt.hash(validated.data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: validated.data.email,
        password: hashedPassword,
        name: validated.data.name,
        phone: validated.data.phone,
        role: validated.data.role,
        createdBy: session.user.id,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({
          email: user.email,
          role: user.role,
        }),
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true, user };
  } catch (error) {
    console.error('Create user error:', error);
    return { error: 'Failed to create user' };
  }
}

// Update user
export async function updateUser(id: string, data: z.infer<typeof updateUserSchema>) {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized' };

  const validated = updateUserSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Get target user
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Check permissions
    const canEdit = checkUserEditPermission(session.user.role, targetUser.role, validated.data.role);
    if (!canEdit) {
      return { error: 'You do not have permission to edit this user' };
    }

    // Check if email already exists (for different user)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: validated.data.email,
        NOT: { id },
      },
    });

    if (existingUser) {
      return { error: 'Email already exists' };
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        email: validated.data.email,
        name: validated.data.name,
        phone: validated.data.phone,
        role: validated.data.role,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'UPDATE_USER',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({
          email: user.email,
          role: user.role,
        }),
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true, user };
  } catch (error) {
    console.error('Update user error:', error);
    return { error: 'Failed to update user' };
  }
}

// Toggle user status
export async function toggleUserStatus(id: string) {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized' };

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Check permissions
    const canEdit = checkUserEditPermission(session.user.role, targetUser.role, targetUser.role);
    if (!canEdit) {
      return { error: 'You do not have permission to modify this user' };
    }

    // Prevent deactivating yourself
    if (id === session.user.id) {
      return { error: 'You cannot deactivate your own account' };
    }

    const newStatus = targetUser.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;

    await prisma.user.update({
      where: { id },
      data: { status: newStatus },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: newStatus === UserStatus.ACTIVE ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
        entityType: 'User',
        entityId: id,
      },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Toggle user status error:', error);
    return { error: 'Failed to update user status' };
  }
}

// Reset password
export async function resetPassword(id: string, newPassword: string) {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized' };

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return { error: 'User not found' };
    }

    // Check permissions
    const canEdit = checkUserEditPermission(session.user.role, targetUser.role, targetUser.role);
    if (!canEdit) {
      return { error: 'You do not have permission to reset this user\'s password' };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: 'RESET_PASSWORD',
        entityType: 'User',
        entityId: id,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Reset password error:', error);
    return { error: 'Failed to reset password' };
  }
}

// Helper: Check user creation permission
function checkUserCreationPermission(creatorRole: UserRole, targetRole: UserRole): boolean {
  if (creatorRole === 'PRIVILEGE') {
    // PRIVILEGE can create any role
    return true;
  }
  if (creatorRole === 'ADMIN') {
    // ADMIN can only create SALES and WAREHOUSE
    return ['SALES', 'WAREHOUSE'].includes(targetRole);
  }
  return false;
}

// Helper: Check user edit permission
function checkUserEditPermission(editorRole: UserRole, currentTargetRole: UserRole, newTargetRole: UserRole): boolean {
  if (editorRole === 'PRIVILEGE') {
    // PRIVILEGE can edit any user
    return true;
  }
  if (editorRole === 'ADMIN') {
    // ADMIN can only edit SALES and WAREHOUSE users
    // And cannot change them to higher roles
    return (
      ['SALES', 'WAREHOUSE'].includes(currentTargetRole) &&
      ['SALES', 'WAREHOUSE'].includes(newTargetRole)
    );
  }
  return false;
}
