'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
 
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// --- Clientes ---

const CustomerFormSchema = z.object({
  name: z.string().min(1, { message: 'El nombre es obligatorio.' }),
  lastname: z.string().min(1, { message: 'El apellido es obligatorio.' }),
  age: z.coerce
    .number()
    .gte(18, { message: 'La edad debe ser 18 o más.' })
    .lte(90, { message: 'La edad debe ser 90 o menos.' }),
  category: z.string().min(1, { message: 'El rubro es obligatorio.' }),
  email: z.string().email({ message: 'Ingresá un email con formato válido.' }),
});

export type CustomerState = {
  errors?: {
    name?: string[];
    lastname?: string[];
    age?: string[];
    category?: string[];
    email?: string[];
  };
  message?: string | null;
  success?: boolean;
};

export async function createCustomer(
  prevState: CustomerState,
  formData: FormData,
) {
  // 1. Validar los datos del formulario con Zod
  const validatedFields = CustomerFormSchema.safeParse({
    name: formData.get('name'),
    lastname: formData.get('lastname'),
    age: formData.get('age'),
    category: formData.get('category'),
    email: formData.get('email'),
  });

  // 2. Si la validación falla, devolver los errores y cortar acá
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Faltan campos o hay errores. No se pudo crear el cliente.',
    };
  }

  // 3. Datos listos para guardar
  const { name, lastname, age, category, email } = validatedFields.data;

  // 4. Guardar en la base de datos
  try {
    await sql`
      INSERT INTO customers (name, lastname, age, category, email, image_url)
      VALUES (${name}, ${lastname}, ${age}, ${category}, ${email}, '/customers/avatar-placeholder.jpg')
    `;
  } catch {
    return {
      message: 'Error de base de datos: no se pudo crear el cliente.',
    };
  }

  // 5. Refrescar la lista y avisar que salió bien (el redirect lo hace el cliente,
  //    así primero puede mostrar el toast)
  revalidatePath('/dashboard/customers');
  return { success: true, message: 'Cliente creado correctamente.' };
}

 
export async function createInvoice(prevState: State, formData: FormData) {
  // Validar el formulario con Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  // Si la validación falla, devolver los errores y cortar acá. Si no, continuar.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
 
  // Preparar los datos para insertarlos en la base de datos
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
 
  // Insertar los datos en la base de datos
  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch {
    // Si ocurre un error de base de datos, devolver un error más específico.
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }
 
  // Revalidar la caché de la página de invoices y redirigir al usuario.
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  // throw new Error('No se pudo eliminar la invoice');

  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}
