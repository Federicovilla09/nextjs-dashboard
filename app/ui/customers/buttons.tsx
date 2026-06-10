import { PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export function CreateCustomer() {
  return (
    <Link
      href="/dashboard/customers/create"
      className="flex h-10 items-center rounded-full uppercase bg-purple-600 px-4 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
    >
      <span className="hidden md:block">Crear cliente</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}
