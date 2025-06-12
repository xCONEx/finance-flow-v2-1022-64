
import { useMemo } from 'react';

export type UserRole = 'admin' | 'owner' | 'editor' | 'viewer';

export const usePermissions = (userRole: UserRole) => {
  const permissions = useMemo(() => {
    const canManageTeam = userRole === 'admin' || userRole === 'owner';
    const canEditContent = userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
    const canViewContent = true; // Todos podem visualizar
    const canCreateAgency = userRole === 'admin';
    const canDeleteAgency = userRole === 'admin' || userRole === 'owner';
    
    return {
      canManageTeam,
      canEditContent,
      canViewContent,
      canCreateAgency,
      canDeleteAgency,
      isAdmin: userRole === 'admin',
      isOwner: userRole === 'owner',
      isEditor: userRole === 'editor',
      isViewer: userRole === 'viewer'
    };
  }, [userRole]);

  return permissions;
};
