import { useEffect, useRef } from 'react';
import { useAuth } from '@/entities/user';
import { ADMIN_PATHS, useNavigation } from '@/shared/lib/navigation';

/** The owner always lands in /admin; signing out of it returns to the storefront. */
export function useAdminRedirects(): void {
  const { isAdmin } = useAuth();
  const { isAdminPath, navigate } = useNavigation();
  const wasAdmin = useRef(isAdmin);

  useEffect(() => {
    if (isAdmin && !isAdminPath) navigate(ADMIN_PATHS.dashboard, { replace: true });
    else if (!isAdmin && wasAdmin.current && isAdminPath) navigate('/', { replace: true });
    wasAdmin.current = isAdmin;
  }, [isAdmin, isAdminPath, navigate]);
}
