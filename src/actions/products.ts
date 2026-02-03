'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { serializeData } from '@/lib/utils';

// Schemas
const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  imageUrl: z.string().optional(),
});

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  productId: z.string().min(1, 'Product is required'),
  costPrice: z.number().min(0, 'Cost price must be positive'),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  minStockLevel: z.number().min(0, 'Minimum stock must be positive').default(10),
  variantOptions: z.array(z.string()).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

// Pagination config
const PAGE_SIZE = 10;

// Get all products with pagination
export async function getProducts(filters?: { search?: string; page?: number }) {
  const page = filters?.page || 1;
  const skip = (page - 1) * PAGE_SIZE;
  const searchQuery = filters?.search;

  const where = searchQuery
    ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' as const } },
          { description: { contains: searchQuery, mode: 'insensitive' as const } },
        ],
      }
    : undefined;

  // Run count and data queries in parallel
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: {
          include: {
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
        variantTypes: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: serializeData(products),
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  };
}

// Get single product
export async function getProduct(id: string) {
  const product = serializeData(await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: {
        include: {
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
      variantTypes: {
        include: {
          options: true,
        },
      },
    },
  }));

  return product;
}

// Create product
export async function createProduct(formData: FormData) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    categoryId: formData.get('categoryId') as string,
    imageUrl: formData.get('imageUrl') as string,
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const product = serializeData(await prisma.product.create({
      data: validated.data,
    }));

    revalidatePath('/dashboard/products');
    return { success: true, product };
  } catch (error) {
    console.error('Create product error:', error);
    return { error: 'Failed to create product' };
  }
}

// Update product
export async function updateProduct(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    categoryId: formData.get('categoryId') as string,
    imageUrl: formData.get('imageUrl') as string,
  };

  const validated = productSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const product = serializeData(await prisma.product.update({
      where: { id },
      data: validated.data,
    }));

    revalidatePath('/dashboard/products');
    return { success: true, product };
  } catch (error) {
    console.error('Update product error:', error);
    return { error: 'Failed to update product' };
  }
}

// Toggle product status
export async function toggleProductStatus(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    const product = serializeData(await prisma.product.findUnique({ where: { id } }));
    if (!product) {
      return { error: 'Product not found' };
    }

    await prisma.product.update({
      where: { id },
      data: { isActive: !product.isActive },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Toggle product status error:', error);
    return { error: 'Failed to update product status' };
  }
}

// Create product variant
export async function createVariant(data: z.infer<typeof variantSchema>) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const validated = variantSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    // Check if SKU already exists
    const existingSku = await prisma.productVariant.findUnique({
      where: { sku: validated.data.sku },
    });

    if (existingSku) {
      return { error: 'SKU already exists' };
    }

    // Check for duplicate variant combination (same options for same product)
    if (validated.data.variantOptions && validated.data.variantOptions.length > 0) {
      const sortedOptions = [...validated.data.variantOptions].sort();
      
      // Get all variants for this product
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: validated.data.productId },
        include: {
          variantValues: {
            select: { variantOptionId: true },
          },
        },
      });

      // Check if any existing variant has the same combination of options
      for (const variant of existingVariants) {
        const existingOptions = variant.variantValues
          .map(vv => vv.variantOptionId)
          .sort();
        
        if (
          existingOptions.length === sortedOptions.length &&
          existingOptions.every((opt, idx) => opt === sortedOptions[idx])
        ) {
          return { error: `A variant with this combination already exists (SKU: ${variant.sku})` };
        }
      }
    }

    const variant = serializeData(await prisma.productVariant.create({
      data: {
        sku: validated.data.sku,
        productId: validated.data.productId,
        costPrice: validated.data.costPrice,
        sellingPrice: validated.data.sellingPrice,
        minStockLevel: validated.data.minStockLevel,
        variantValues: {
          create: validated.data.variantOptions?.map((optionId) => ({
            variantOptionId: optionId,
          })) || [],
        },
      },
    }));

    revalidatePath('/dashboard/products');
    return { success: true, variant };
  } catch (error) {
    console.error('Create variant error:', error);
    return { error: 'Failed to create variant' };
  }
}

// Get categories (update existing function)
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

// Create category
export async function createCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  const data = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
  };

  const validated = categorySchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  try {
    const category = await prisma.category.create({
      data: validated.data,
    });

    revalidatePath('/dashboard/products');
    return { success: true, category };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { error: 'Category name already exists' };
    }
    console.error('Create category error:', error);
    return { error: 'Failed to create category' };
  }
}

// Add variant type to product
export async function addVariantType(productId: string, name: string, options: string[]) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    const variantType = await prisma.variantType.create({
      data: {
        name,
        productId,
        options: {
          create: options.map((value) => ({ value })),
        },
      },
      include: {
        options: true,
      },
    });

    revalidatePath('/dashboard/products');
    return { success: true, variantType };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { error: 'Variant type already exists for this product' };
    }
    console.error('Add variant type error:', error);
    return { error: 'Failed to add variant type' };
  }
}

// Delete category
export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return { error: `Cannot delete category. It has ${productsCount} product(s). Move or delete them first.` };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Delete category error:', error);
    return { error: 'Failed to delete category' };
  }
}

// Delete product
export async function deleteProduct(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check if product has any sales
    const salesCount = await prisma.saleItem.count({
      where: {
        variant: {
          productId: id,
        },
      },
    });

    if (salesCount > 0) {
      return { error: 'Cannot delete product. It has sales history. Deactivate it instead.' };
    }

    // Check if product has any stock entries
    const stockCount = await prisma.stockEntryItem.count({
      where: {
        variant: {
          productId: id,
        },
      },
    });

    if (stockCount > 0) {
      return { error: 'Cannot delete product. It has stock entry history. Deactivate it instead.' };
    }

    // Delete product (cascade will delete variants, variant types, etc.)
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Delete product error:', error);
    return { error: 'Failed to delete product' };
  }
}

// Delete variant
export async function deleteVariant(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check if variant has any sales
    const salesCount = await prisma.saleItem.count({
      where: { variantId: id },
    });

    if (salesCount > 0) {
      return { error: 'Cannot delete variant. It has sales history. Deactivate it instead.' };
    }

    // Check if variant has any stock entries
    const stockCount = await prisma.stockEntryItem.count({
      where: { variantId: id },
    });

    if (stockCount > 0) {
      return { error: 'Cannot delete variant. It has stock entry history. Deactivate it instead.' };
    }

    // Get variant to know the product ID for revalidation
    const variant = serializeData(await prisma.productVariant.findUnique({
      where: { id },
      select: { productId: true },
    }));

    await prisma.productVariant.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    if (variant) {
      revalidatePath(`/dashboard/products/${variant.productId}`);
    }
    return { success: true };
  } catch (error) {
    console.error('Delete variant error:', error);
    return { error: 'Failed to delete variant' };
  }
}

// Delete variant type
export async function deleteVariantType(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Get variant type to check for associated variants
    const variantType = await prisma.variantType.findUnique({
      where: { id },
      include: {
        options: {
          include: {
            variantValues: true,
          },
        },
      },
    });

    if (!variantType) {
      return { error: 'Variant type not found' };
    }

    // Check if any options are used in variants
    const hasVariants = variantType.options.some(opt => opt.variantValues.length > 0);
    if (hasVariants) {
      return { error: 'Cannot delete variant type. It is used by existing variants. Delete the variants first.' };
    }

    await prisma.variantType.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Delete variant type error:', error);
    return { error: 'Failed to delete variant type' };
  }
}

// Update variant type
export async function updateVariantType(
  id: string,
  name: string
) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check for duplicate name in same product
    const variantType = await prisma.variantType.findUnique({
      where: { id },
      select: { productId: true },
    });

    if (!variantType) {
      return { error: 'Variant type not found' };
    }

    const duplicate = await prisma.variantType.findFirst({
      where: {
        productId: variantType.productId,
        name: name.trim(),
        id: { not: id },
      },
    });

    if (duplicate) {
      return { error: 'A variant type with this name already exists' };
    }

    await prisma.variantType.update({
      where: { id },
      data: { name: name.trim() },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Update variant type error:', error);
    return { error: 'Failed to update variant type' };
  }
}

// Add option to variant type
export async function addVariantOption(
  variantTypeId: string,
  value: string
) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check for duplicate option value
    const duplicate = await prisma.variantOption.findFirst({
      where: {
        variantTypeId,
        value: value.trim(),
      },
    });

    if (duplicate) {
      return { error: 'This option already exists' };
    }

    await prisma.variantOption.create({
      data: {
        variantTypeId,
        value: value.trim(),
      },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Add variant option error:', error);
    return { error: 'Failed to add option' };
  }
}

// Update variant option
export async function updateVariantOption(
  id: string,
  value: string
) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    const option = await prisma.variantOption.findUnique({
      where: { id },
      select: { variantTypeId: true },
    });

    if (!option) {
      return { error: 'Option not found' };
    }

    // Check for duplicate
    const duplicate = await prisma.variantOption.findFirst({
      where: {
        variantTypeId: option.variantTypeId,
        value: value.trim(),
        id: { not: id },
      },
    });

    if (duplicate) {
      return { error: 'This option already exists' };
    }

    await prisma.variantOption.update({
      where: { id },
      data: { value: value.trim() },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Update variant option error:', error);
    return { error: 'Failed to update option' };
  }
}

// Delete variant option
export async function deleteVariantOption(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check if option is used in any variant
    const usedInVariants = await prisma.productVariantValue.count({
      where: { variantOptionId: id },
    });

    if (usedInVariants > 0) {
      return { error: 'Cannot delete option. It is used by existing variants.' };
    }

    await prisma.variantOption.delete({
      where: { id },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Delete variant option error:', error);
    return { error: 'Failed to delete option' };
  }
}

// Update product variant
export async function updateVariant(
  id: string,
  data: {
    sku?: string;
    costPrice?: number;
    sellingPrice?: number;
    minStockLevel?: number;
  }
) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    // Check for duplicate SKU if changing
    if (data.sku) {
      const duplicate = await prisma.productVariant.findFirst({
        where: {
          sku: data.sku,
          id: { not: id },
        },
      });

      if (duplicate) {
        return { error: 'SKU already exists' };
      }
    }

    const variant = serializeData(await prisma.productVariant.update({
      where: { id },
      data: {
        ...(data.sku && { sku: data.sku }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.minStockLevel !== undefined && { minStockLevel: data.minStockLevel }),
      },
    }));

    revalidatePath('/dashboard/products');
    return { success: true, variant };
  } catch (error) {
    console.error('Update variant error:', error);
    return { error: 'Failed to update variant' };
  }
}

// Toggle variant status
export async function toggleVariantStatus(id: string) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    return { error: 'Unauthorized' };
  }

  try {
    const variant = serializeData(await prisma.productVariant.findUnique({
      where: { id },
      select: { isActive: true },
    }));

    if (!variant) {
      return { error: 'Variant not found' };
    }

    await prisma.productVariant.update({
      where: { id },
      data: { isActive: !variant.isActive },
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Toggle variant status error:', error);
    return { error: 'Failed to update variant status' };
  }
}