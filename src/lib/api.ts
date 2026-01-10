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

/**
 * Check follow status for a user
 */
export async function checkFollowStatus(targetEmail: string): Promise<{
    status: 'following' | 'pending' | 'not-following';
    requestId?: string;
}> {
    return apiRequest(`/api/follow/status/${encodeURIComponent(targetEmail)}`);
}

/**
 * Get my followers
 */
export async function getFollowers(): Promise<{ followers: UserProfile[] }> {
    // Note: UserProfile is defined later, using any[] for now to avoid circular ref issues if moved
    // or we can rely on hoisting if interface is exported similarly
    return apiRequest('/api/follow/followers');
}

/**
 * Get people I follow
 */
export async function getFollowing(): Promise<{ following: UserProfile[] }> {
    return apiRequest('/api/follow/following');
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
        body: JSON.stringify({ id: departmentId }),  // Backend expects { id }
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
// VOTE ENDPOINTS
// ============================================

/**
 * Cast or toggle a vote on a resource
 */
export async function castVote(
    resourceId: string,
    voteType: 'upvote' | 'downvote'
): Promise<{ message: string; action: string; upvotes: number; downvotes: number }> {
    return apiRequest('/api/votes', {
        method: 'POST',
        body: JSON.stringify({ resourceId, voteType }),
    });
}

/**
 * Get vote status for a resource
 */
export async function getVoteStatus(resourceId: string): Promise<{
    userVote: 'upvote' | 'downvote' | null;
    upvotes: number;
    downvotes: number;
}> {
    return apiRequest(`/api/votes/${resourceId}`);
}

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

/**
 * Create a notification
 */
export async function createNotification(
    targetUserId: string,
    title: string,
    message: string,
    type: string,
    link?: string
): Promise<{ notification: any }> {
    return apiRequest('/api/notifications', {
        method: 'POST',
        body: JSON.stringify({ targetUserId, title, message, type, link }),
    });
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<{ message: string }> {
    return apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ message: string }> {
    return apiRequest('/api/notifications/read-all', { method: 'PUT' });
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<{ message: string }> {
    return apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' });
}

/**
 * Delete all notifications
 */
export async function deleteAllNotifications(): Promise<{ message: string }> {
    return apiRequest('/api/notifications', { method: 'DELETE' });
}

// ============================================
// CHAT ENDPOINTS
// ============================================

/**
 * Create a chat room
 */
export async function createChatRoom(
    name: string,
    description: string | null,
    isPrivate: boolean,
    collegeId?: string
): Promise<{ message: string; id: string; joinCode?: string }> {
    return apiRequest('/api/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({ name, description, isPrivate, collegeId }),
    });
}

/**
 * Join a chat room by code
 */
export async function joinChatRoom(
    joinCode: string,
    collegeId?: string
): Promise<{ message: string; roomId: string; roomName: string }> {
    return apiRequest('/api/chat/join', {
        method: 'POST',
        body: JSON.stringify({ joinCode, collegeId }),
    });
}

/**
 * Join a chat room by ID (for public rooms or after password verification)
 */
export async function joinChatRoomById(
    roomId: string,
    userName?: string,
    collegeId?: string
): Promise<{ message: string; roomName: string }> {
    return apiRequest('/api/chat/join-room', {
        method: 'POST',
        body: JSON.stringify({ roomId, userName, collegeId }),
    });
}

/**
 * Post a message to a chat room
 */
export async function postChatMessage(
    roomId: string,
    content: string,
    imageUrl?: string,
    authorName?: string
): Promise<{ message: string; id: string }> {
    return apiRequest('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({ roomId, content, imageUrl, authorName }),
    });
}

/**
 * Vote on a chat message
 */
export async function voteChatMessage(
    messageId: string,
    direction: 'up' | 'down'
): Promise<{ message: string; action: string; newUpvotes: number; newDownvotes: number }> {
    return apiRequest(`/api/chat/messages/${messageId}/vote`, {
        method: 'PUT',
        body: JSON.stringify({ direction }),
    });
}

/**
 * Get user's votes for a room's messages
 */
export async function getUserChatVotes(roomId: string): Promise<{ votes: Record<string, 'up' | 'down'> }> {
    return apiRequest(`/api/chat/rooms/${roomId}/votes`);
}

/**
 * Get room info including membership status
 */
export interface ChatRoomInfo {
    room: {
        id: string;
        name: string;
        description: string | null;
        is_private: boolean;
        member_count: number;
        created_by: string;
        created_at: string;
        room_code?: string;
    };
    isMember: boolean;
    isAdmin: boolean;
}

export async function getChatRoomInfo(roomId: string): Promise<ChatRoomInfo> {
    return apiRequest(`/api/chat/rooms/${roomId}/info`);
}

/**
 * Toggle save a chat post
 */
export async function toggleSaveChatPost(
    messageId: string,
    roomId: string
): Promise<{ message: string; saved: boolean }> {
    return apiRequest('/api/chat/saved', {
        method: 'POST',
        body: JSON.stringify({ messageId, roomId }),
    });
}

export interface ChatComment {
    id: string;
    message_id: string;
    author_name: string;
    author_email: string;
    content: string;
    created_at: string;
    parent_id?: string;
}

/**
 * Get comments for a chat post
 */
export async function getChatComments(messageId: string): Promise<{ comments: ChatComment[] }> {
    return apiRequest(`/api/chat/comments/${messageId}`);
}

/**
 * Add a comment to a chat post
 */
export async function addChatComment(
    messageId: string,
    content: string,
    authorName?: string,
    parentId?: string
): Promise<{ message: string; id: string }> {
    return apiRequest('/api/chat/comments', {
        method: 'POST',
        body: JSON.stringify({ messageId, content, authorName, parentId }),
    });
}

/**
 * Delete a chat comment
 */
export async function deleteChatComment(
    messageId: string,
    commentId: string
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/comments/${commentId}`, {
        method: 'DELETE',
        body: JSON.stringify({ messageId }),
    });
}

// ============================================
// ROOM SETTINGS ENDPOINTS
// ============================================

export interface RoomMember {
    user_email: string;
    user_name: string;
    is_banned: boolean;
    notifications_muted: boolean;
    joined_at: string;
}

/**
 * Toggle mute notifications for a room
 */
export async function toggleRoomMute(
    roomId: string,
    muted: boolean
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}/mute`, {
        method: 'POST',
        body: JSON.stringify({ muted }),
    });
}

/**
 * Regenerate room code (admin only)
 */
export async function regenerateRoomCode(
    roomId: string
): Promise<{ message: string; newCode: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}/regenerate-code`, {
        method: 'POST',
    });
}

/**
 * Ban a member from room (admin only)
 */
export async function banRoomMember(
    roomId: string,
    targetEmail: string
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}/ban`, {
        method: 'POST',
        body: JSON.stringify({ targetEmail }),
    });
}

/**
 * Unban a member (admin only)
 */
export async function unbanRoomMember(
    roomId: string,
    targetEmail: string
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}/unban`, {
        method: 'POST',
        body: JSON.stringify({ targetEmail }),
    });
}

/**
 * Delete a room (admin only)
 */
export async function deleteRoom(
    roomId: string
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
    });
}

/**
 * Get room members list
 */
export async function getRoomMembers(
    roomId: string
): Promise<{ members: RoomMember[] }> {
    return apiRequest(`/api/chat/rooms/${roomId}/members`);
}

// ============================================
// USER PROFILE ENDPOINTS
// ============================================

export interface UserProfile {
    id: string;
    email: string;
    display_name: string;
    username?: string;
    bio?: string;
    profile_photo_url?: string;
    college?: string;
    branch?: string;
    semester?: string;
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<{ profile: UserProfile }> {
    return apiRequest('/api/users/profile');
}

/**
 * Update current user's profile
 */
export async function updateProfile(updates: Partial<UserProfile>): Promise<{ message: string; profile: UserProfile }> {
    return apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
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

// ============================================
// SYLLABUS ENDPOINTS
// ============================================

/**
 * Get a signed URL for uploading syllabus PDF
 */
export async function getSyllabusUploadUrl(
    filename: string
): Promise<{ signedUrl: string; path: string }> {
    return apiRequest('/api/syllabus/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename }),
    });
}

/**
 * Create a syllabus entry after file upload
 */
export async function createSyllabus(
    data: {
        title: string;
        semester: string;
        branch: string;
        subject: string;
        description?: string;
        pdfUrl: string;
        fileSize: number;
        collegeId?: string;
    }
): Promise<{ message: string; id: string }> {
    return apiRequest('/api/syllabus', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Delete a syllabus entry
 */
export async function deleteSyllabus(id: string): Promise<{ message: string }> {
    return apiRequest(`/api/syllabus/${id}`, { method: 'DELETE' });
}

// ============================================
// NOTICE COMMENTS
// ============================================

export interface NoticeComment {
    id: string;
    notice_id: string;
    user_email: string;
    user_name: string;
    content: string;
    created_at: string;
    parent_id?: string;
}

/**
 * Get comments for a notice
 */
export async function getNoticeComments(noticeId: string): Promise<{ comments: NoticeComment[] }> {
    return apiRequest(`/api/notices/${noticeId}/comments`);
}

/**
 * Post a comment on a notice
 */
export async function postNoticeComment(
    noticeId: string,
    content: string,
    recaptchaToken?: string,
    parentId?: string
): Promise<{ comment: NoticeComment }> {
    return apiRequest(`/api/notices/${noticeId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, recaptchaToken, parentId }),
    });
}

/**
 * Delete a comment
 */
export async function deleteNoticeComment(
    noticeId: string,
    commentId: string
): Promise<{ message: string }> {
    return apiRequest(`/api/notices/${noticeId}/comments/${commentId}`, {
        method: 'DELETE',
    });
}

// ============================================
// NOTICE & COMMENT LIKES
// ============================================

/**
 * Toggle like on a notice
 */
export async function toggleNoticeLike(noticeId: string): Promise<{ liked: boolean; message: string }> {
    return apiRequest(`/api/notices/${noticeId}/like`, {
        method: 'POST',
    });
}

/**
 * Get like count and user's like status for a notice
 */
export async function getNoticeLikes(noticeId: string): Promise<{ count: number; userLiked: boolean }> {
    return apiRequest(`/api/notices/${noticeId}/likes`);
}

/**
 * Toggle like on a comment
 */
export async function toggleCommentLike(
    noticeId: string,
    commentId: string
): Promise<{ liked: boolean; message: string }> {
    return apiRequest(`/api/notices/${noticeId}/comments/${commentId}/like`, {
        method: 'POST',
    });
}
