// src/hooks/usePermissions.ts
// Permissions hook based on policy document
// Policy: College email = FULL access, others = READ-ONLY

import { useCollege } from '@/context/CollegeContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface Permissions {
    // Access level
    isFullAccess: boolean;
    isReadOnly: boolean;

    // Feature-specific permissions
    canUploadResource: boolean;
    canFollow: boolean;
    canChat: boolean;
    canCreateRoom: boolean;
    canViewSyllabus: boolean;
    canViewResources: boolean;
    canViewFollowing: boolean;
    canDiscoverUsers: boolean;
    canBookmark: boolean;

    // Helper function
    checkPermission: (feature: string, showToast?: boolean) => boolean;
}

export function usePermissions(): Permissions {
    const { isFullAccess, isReadOnly } = useCollege();
    const { user } = useAuth();

    // Check if user has permission for a feature
    const checkPermission = (feature: string, showToast = true): boolean => {
        if (isFullAccess) return true;

        if (showToast) {
            toast.error(`${feature} requires a verified college email account.`);
        }
        return false;
    };

    // All users can view resources and syllabus
    const canViewResources = true;
    const canViewSyllabus = true;

    // Only full access users can use social features
    const canUploadResource = isFullAccess;
    const canFollow = isFullAccess;
    const canChat = isFullAccess;
    const canCreateRoom = isFullAccess;
    const canViewFollowing = isFullAccess;
    const canDiscoverUsers = isFullAccess;
    const canBookmark = isFullAccess;

    return {
        isFullAccess,
        isReadOnly,
        canUploadResource,
        canFollow,
        canChat,
        canCreateRoom,
        canViewSyllabus,
        canViewResources,
        canViewFollowing,
        canDiscoverUsers,
        canBookmark,
        checkPermission,
    };
}

export default usePermissions;
