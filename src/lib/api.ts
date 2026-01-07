/**
 * API Client for StudySpace Backend
 * 
 * All privileged operations should go through these functions
 * instead of direct Supabase calls.
 */

import { auth } from '../firebase';

// Backend URL - change for production
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get current user's Firebase ID token
 */
async function getAuthToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        return await user.getIdToken();
    } catch (error) {
        console.error('[API] Failed to get token:', error);
        return null;
    }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'API request failed');
    }

    return data;
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export interface UserInfo {
    uid: string;
    email: string;
    role: string;
    collegeDomain: string | null;
    isCollegeUser: boolean;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}

/**
 * Verify token and get current user info
 */
export async function verifyAndGetUser(): Promise<UserInfo> {
    return apiRequest('/api/auth/verify', { method: 'POST' });
}

/**
 * Get current user info
 */
export async function getMe(): Promise<UserInfo> {
    return apiRequest('/api/auth/me');
}

// ============================================
// FOLLOW ENDPOINTS
// ============================================

export interface FollowRequest {
    id: string;
    requesterEmail: string;
    targetEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
}

/**
 * Send a follow request
 */
export async function sendFollowRequest(
    targetEmail: string,
    recaptchaToken: string
): Promise<{ message: string; request: FollowRequest }> {
    return apiRequest('/api/follow/request', {
        method: 'POST',
        body: JSON.stringify({ targetEmail, recaptchaToken }),
    });
}

/**
 * Approve a follow request
 */
export async function approveFollowRequest(requestId: string): Promise<{ message: string }> {
    return apiRequest(`/api/follow/approve/${requestId}`, { method: 'POST' });
}

/**
 * Reject a follow request
 */
export async function rejectFollowRequest(requestId: string): Promise<{ message: string }> {
    return apiRequest(`/api/follow/reject/${requestId}`, { method: 'POST' });
}

/**
 * Cancel a pending follow request
 */
export async function cancelFollowRequest(requestId: string): Promise<{ message: string }> {
    return apiRequest(`/api/follow/request/${requestId}`, { method: 'DELETE' });
}

/**
 * Unfollow a user
 */
export async function unfollowUser(targetEmail: string): Promise<{ message: string }> {
    return apiRequest(`/api/follow/${encodeURIComponent(targetEmail)}`, { method: 'DELETE' });
}

/**
 * Get pending follow requests
 */
export async function getPendingFollowRequests(): Promise<{ requests: FollowRequest[] }> {
    return apiRequest('/api/follow/pending');
}

// ============================================
// BOOKMARK ENDPOINTS
// ============================================

export interface Bookmark {
    id: string;
    resourceId?: string;
    noticeId?: string;
    type: 'resource' | 'notice';
    createdAt: string;
    content?: any; // Enriched content from backend join
}

/**
 * Get all bookmarks (Resources + Notices)
 */
export async function getBookmarks(): Promise<{ bookmarks: Bookmark[] }> {
    return apiRequest('/api/bookmarks');
}

/**
 * Add a bookmark
 */
export async function addBookmark(
    itemId: string,
    type: 'resource' | 'notice' = 'resource'
): Promise<{ message: string; bookmark: Bookmark }> {
    return apiRequest('/api/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ itemId, type }),
    });
}

/**
 * Remove a bookmark by ID
 */
export async function removeBookmark(bookmarkId: string): Promise<{ message: string }> {
    return apiRequest(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' });
}

/**
 * Remove a bookmark by Item ID (Resource or Notice)
 */
export async function removeBookmarkByItem(itemId: string): Promise<{ message: string }> {
    return apiRequest(`/api/bookmarks/item/${itemId}`, { method: 'DELETE' });
}

/**
 * Check if an item is bookmarked
 */
export async function isBookmarked(itemId: string): Promise<{ isBookmarked: boolean }> {
    return apiRequest(`/api/bookmarks/check/${itemId}`);
}

// ============================================
// DEPARTMENT ENDPOINTS
// ============================================

/**
 * Follow a department
 */
export async function followDepartment(departmentId: string): Promise<{ message: string }> {
    return apiRequest('/api/departments/follow', {
        method: 'POST',
        body: JSON.stringify({ id: departmentId }),
    });
}

/**
 * Unfollow a department
 */
export async function unfollowDepartment(departmentId: string): Promise<{ message: string }> {
    return apiRequest(`/api/departments/follow/${departmentId}`, { method: 'DELETE' });
}

/**
 * Get followed departments
 */
export async function getFollowedDepartments(): Promise<{ departments: string[] }> {
    return apiRequest('/api/departments/following');
}

// ============================================
// RESOURCE ENDPOINTS
// ============================================

export interface Resource {
    id: string;
    title: string;
    type: string;
    description?: string;
    url?: string;
    filePath?: string;
    branch?: string;
    semester?: string;
    subject?: string;
    uploadedByEmail: string;
    collegeId: string;
    upvotes: number;
    downvotes: number;
    isApproved: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateResourceInput {
    title: string;
    type: string;
    description?: string;
    url?: string;
    filePath?: string;
    branch?: string;
    semester?: string;
    subject?: string;
    recaptchaToken: string;
}

/**
 * Create a new resource
 */
export async function createResource(input: CreateResourceInput): Promise<{ message: string; resource: Resource }> {
    return apiRequest('/api/resources', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

/**
 * Update a resource
 */
export async function updateResource(
    resourceId: string,
    updates: Partial<Omit<CreateResourceInput, 'recaptchaToken'>>
): Promise<{ message: string; resource: Resource }> {
    return apiRequest(`/api/resources/${resourceId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

/**
 * Delete a resource
 */
export async function deleteResource(resourceId: string): Promise<{ message: string }> {
    return apiRequest(`/api/resources/${resourceId}`, { method: 'DELETE' });
}

/**
 * Get current user's resources
 */
export async function getMyResources(): Promise<{ resources: Resource[] }> {
    return apiRequest('/api/resources/mine');
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthStatus {
    status: string;
    uptime: number;
    uptimeFormatted: string;
    timestamp: string;
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
}
