import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getProduct, getCategories } from '@/actions/products';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ProductEditForm from './ProductEditForm';
import { serializeData } from '@/lib/utils';

export default async function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/products/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 mt-1">{product.name}</p>
        </div>
      </div>

      {/* Form */}
      <ProductEditForm 
        product={serializeData(product)} 
        categories={serializeData(categories)} 
      />
    </div>
  );
}