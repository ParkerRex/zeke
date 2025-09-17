import { getAdminFlag, getSession } from '@zeke/supabase/queries';
import { redirect } from 'next/navigation';
import AdminConsole from '../../../components/admin-console';

export const metadata = { title: 'Admin Console' };

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  const { isAdmin } = await getAdminFlag();
  if (!isAdmin) {
    redirect('/home');
  }
  return <AdminConsole />;
}
