import EditCustomerForm from '@/app/ui/customers/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomerById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';

export const metadata: Metadata = {
  title: 'Editar Cliente',
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const customer = await fetchCustomerById(id);

  // Si no existe ese cliente, mostramos la pantalla de "no encontrado".
  if (!customer) {
    notFound();
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Editar Cliente',
            href: `/dashboard/customers/${id}/edit`,
            active: true,
          },
        ]}
      />

      {/* Encabezado tipo ficha: avatar + nombre del cliente */}
      <div className="mb-6 mt-4 flex items-center gap-4">
        <Image
          src={customer.image_url}
          alt={`Foto de ${customer.name} ${customer.lastname}`}
          width={64}
          height={64}
          className="rounded-full"
        />
        <div>
          <h1 className={`${lusitana.className} text-2xl`}>
            {customer.name} {customer.lastname}
          </h1>
          <p className="text-sm text-gray-500">{customer.category}</p>
        </div>
      </div>

      <EditCustomerForm customer={customer} />
    </main>
  );
}
