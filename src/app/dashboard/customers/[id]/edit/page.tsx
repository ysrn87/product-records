import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getCustomer } from '@/actions/customers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CustomerEditForm from './CustomerEditForm';
import { serializeData } from '@/lib/utils';

export default async function CustomerEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !['PRIVILEGE', 'ADMIN', 'SALES'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const { id } = await params;
  const customer = serializeData(await getCustomer(id));

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/customers/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="text-gray-500 mt-1">{customer.name}</p>
        </div>
      </div>

      {/* Form */}
      <CustomerEditForm customer={customer} />
    </div>
  );
}