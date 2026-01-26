'use client';

import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface PeriodSelectProps {
  currentPeriod: string;
}

export default function PeriodSelect({ currentPeriod }: PeriodSelectProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dashboard/reports?period=${e.target.value}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-400" />
      <select
        value={currentPeriod}
        onChange={handleChange}
        className="w-40"
      >
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
      </select>
    </div>
  );
}