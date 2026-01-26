import { handlers } from '@/lib/auth';

// Prevent caching of auth responses
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;