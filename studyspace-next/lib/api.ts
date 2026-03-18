/**
 * API Client for StudyShare Backend
 * 
 * All privileged operations should go through these functions
 * instead of direct Supabase calls.
 */

import { auth } from '../firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { getApiBaseUrl } from './runtimeConfig';
import { isUuid } from './collegeIds';

// Backend URL
const API_BASE = getApiBaseUrl();

export class ApiError extends Error {
    status: number;
    payload: any;

    constructor(message: string, status: number, payload: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.payload = payload;
    }
}

export interface AiTokenQuotaErrorPayload {
    error: 'AiTokenQuotaExceeded';
    message?: string;
    required_tokens?: number;
    balance?: {
        budget_tokens?: number;
        used_tokens?: number;
        remaining_tokens?: number;
        budget_inr?: number;
    };
}

export function isAiTokenQuotaExceededPayload(payload: any): payload is AiTokenQuotaErrorPayload {
    return payload?.error === 'AiTokenQuotaExceeded';
}

export function formatAiTokenQuotaMessage(payload: AiTokenQuotaErrorPayload): string {
    const balance = payload.balance || {};
    const remaining = Number(balance.remaining_tokens ?? 0);
    const budget = Number(balance.budget_tokens ?? 0);
    const required = Number(payload.required_tokens ?? 0);
    const parts = [
        payload.message || 'AI token limit reached.',
        budget > 0 ? `Remaining: ${remaining} / ${budget} tokens.` : '',
        required > 0 ? `Estimated required for this request: ${required} tokens.` : '',
    ].filter(Boolean);
    return parts.join(' ');
}

function getHeaderString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === 'string' && item.trim().length > 0);
        return typeof first === 'string' ? first.trim() : '';
    }
    return '';
}

function getSelectedCollegeHint(): string {
    try {
        const raw = localStorage.getItem('selectedCollege');
        if (!raw) return '';
        const parsed = JSON.parse(raw);
        const candidates = [
            getHeaderString(parsed?.collegeId),
            getHeaderString(parsed?.college_id),
            getHeaderString(parsed?.id),
        ];
        return candidates.find((value) => value.length > 0 && isUuid(value)) || '';
    } catch {
        return '';
    }
}

/**
 * Get current user's Firebase ID token
 */
async function waitForAuthUser(timeoutMs = 2000): Promise<FirebaseUser | null> {
    if (auth.currentUser) return auth.currentUser;

    return new Promise((resolve) => {
        let settled = false;
        let unsubscribe = () => {};
        let timer: ReturnType<typeof setTimeout> | undefined;
        const settle = (user: FirebaseUser | null) => {
            if (settled) return;
            settled = true;
            if (timer) clearTimeout(timer);
            unsubscribe();
            resolve(user);
        };

        unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                settle(user);
            }
        });

        timer = setTimeout(() => {
            settle(auth.currentUser ?? null);
        }, timeoutMs);
    });
}

async function getAuthToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser ?? await waitForAuthUser();
    if (!user) return null;

    try {
        return await user.getIdToken(forceRefresh);
    } catch (error) {
        console.error('[API] Failed to get token:', error);
        return null;
    }
}

async function parseResponsePayload(response: Response): Promise<any> {
    const raw = await response.text();
    if (!raw) return {};

    try {
        return JSON.parse(raw);
    } catch {
        return {
            message: raw.trim() || response.statusText || 'API request failed',
            raw,
        };
    }
}

function getErrorMessage(payload: any, fallback = 'API request failed'): string {
    if (payload && typeof payload === 'object') {
        const directMessage = typeof payload.message === 'string' ? payload.message.trim() : '';
        if (directMessage) return directMessage;
        const errorMessage = typeof payload.error === 'string' ? payload.error.trim() : '';
        if (errorMessage) return errorMessage;
    }
    return fallback;
}

const API_REQUEST_TIMEOUT_MS = 20000;

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const selectedCollegeHint = getSelectedCollegeHint();
    const createHeaders = (token: string | null) => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        if (selectedCollegeHint) {
            headers['X-College-Id'] = selectedCollegeHint;
        }
        return headers;
    };

    const send = async (token: string | null) => {
        const controller = options.signal ? null : new AbortController();
        const timeoutId = controller
            ? window.setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS)
            : null;

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: createHeaders(token),
                signal: options.signal ?? controller?.signal,
            });
            const payload = await parseResponsePayload(response);
            return { response, payload };
        } catch (error) {
            if (isAbortError(error)) {
                throw new ApiError('Request timed out. Please retry.', 0, {
                    error: 'network_timeout',
                    endpoint,
                });
            }

            throw new ApiError('Failed to reach server. Please check your connection and retry.', 0, {
                error: 'network_error',
                endpoint,
                detail: error instanceof Error ? error.message : String(error),
            });
        } finally {
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        }
    };

    let token = await getAuthToken();
    let { response, payload } = await send(token);

    if ([401, 403].includes(response.status)) {
        const refreshedToken = await getAuthToken(true);
        const shouldRetry = refreshedToken && refreshedToken !== token;
        if (shouldRetry) {
            token = refreshedToken;
            const retryResult = await send(token);
            response = retryResult.response;
            payload = retryResult.payload;
        }
    }

    if (!response.ok) {
        throw new ApiError(getErrorMessage(payload), response.status, payload);
    }

    return payload as T;
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
    isBanned?: boolean;
    banReason?: string;
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
// PAYMENTS
// ============================================

export async function createPaymentOrder(
    amount: number,
    planId: string
): Promise<{
    id: string;
    amount: number;
    currency: string;
    key?: string;
    key_id?: string;
    keyId?: string;
    razorpay_key_id?: string;
    razorpayKeyId?: string;
}> {
    return apiRequest('/api/payments/order', {
        method: 'POST',
        body: JSON.stringify({ amount, planId, purchaseType: 'premium' }),
    });
}

export async function createAiTokenRechargeOrder(
    rechargeRupees: number
): Promise<{
    id: string;
    amount: number;
    currency: string;
    key?: string;
    key_id?: string;
    keyId?: string;
    razorpay_key_id?: string;
    razorpayKeyId?: string;
    purchase_type?: string;
    recharge_rupees?: number;
    recharge_tokens?: number;
    tokens_per_rupee?: number;
}> {
    return apiRequest('/api/payments/order', {
        method: 'POST',
        body: JSON.stringify({
            purchaseType: 'ai_token_recharge',
            rechargeRupees,
        }),
    });
}

export async function verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
): Promise<{
    message: string;
    purchase_type?: string;
    subscription_tier?: string;
    valid_until?: string;
    days_added?: number;
    recharge?: {
        rupees?: number;
        tokens_credited?: number;
        tokens_per_rupee?: number;
    };
}> {
    return apiRequest('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
        }),
    });
}

// ============================================
// FOLLOW ENDPOINTS
// ============================================

export interface FollowRequest {
    id: string;
    requesterEmail: string;
    requesterName?: string;
    targetEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

type RawFollowRequest = Partial<FollowRequest> & {
    request_id?: string;
    requester_email?: string;
    requester_name?: string;
    target_email?: string;
    created_at?: string;
};

function normalizeFollowRequest(raw: RawFollowRequest): FollowRequest {
    const rawStatus = (raw.status || 'pending').toString().toLowerCase();
    const normalizedStatus = rawStatus === 'approved'
        ? 'accepted'
        : (rawStatus === 'accepted' || rawStatus === 'rejected' ? rawStatus : 'pending');

    return {
        id: raw.id || raw.request_id || '',
        requesterEmail: raw.requesterEmail || raw.requester_email || '',
        requesterName: raw.requesterName || raw.requester_name,
        targetEmail: raw.targetEmail || raw.target_email || '',
        status: normalizedStatus as FollowRequest['status'],
        createdAt: raw.createdAt || raw.created_at || '',
    };
}

/**
 * Send a follow request
 */
export async function sendFollowRequest(
    targetEmail: string,
    recaptchaToken?: string
): Promise<{ message: string; request: FollowRequest }> {
    const payload: Record<string, string> = {
        targetEmail,
        target_email: targetEmail,
    };
    if (recaptchaToken) {
        payload.recaptchaToken = recaptchaToken;
        payload.recaptcha_token = recaptchaToken;
    }

    const data = await apiRequest<any>('/api/follow/request', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const rawRequest = (data?.request || data?.followRequest || data?.follow_request || data) as RawFollowRequest;
    return {
        message: data?.message || 'Follow request sent',
        request: normalizeFollowRequest(rawRequest),
    };
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
    const data = await apiRequest<any>('/api/follow/pending');
    const rawRequests = Array.isArray(data) ? data : (data?.requests || []);
    const requests = rawRequests
        .map((request: RawFollowRequest) => normalizeFollowRequest(request))
        .filter((request: FollowRequest) => Boolean(request.id));
    return { requests };
}

/**
 * Check follow status for a user
 */
export async function checkFollowStatus(targetEmail: string): Promise<{
    status: 'following' | 'pending' | 'not-following';
    requestId?: string;
}> {
    const data = await apiRequest<any>(`/api/follow/status/${encodeURIComponent(targetEmail)}`);
    return {
        status: data?.status,
        requestId: data?.requestId || data?.request_id,
    };
}

/**
 * Get my followers or the followers of a target user.
 */
export async function getFollowers(targetEmail?: string): Promise<{ followers: UserProfile[] }> {
    const suffix = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : '';
    return apiRequest(`/api/follow/followers${suffix}`);
}

/**
 * Get people I follow or the people followed by a target user.
 */
export async function getFollowing(targetEmail?: string): Promise<{ following: UserProfile[] }> {
    const suffix = targetEmail ? `?email=${encodeURIComponent(targetEmail)}` : '';
    return apiRequest(`/api/follow/following${suffix}`);
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
 * Follow a department (with college isolation)
 */
export async function followDepartment(departmentId: string, collegeId: string): Promise<{ message: string }> {
    return apiRequest('/api/departments/follow', {
        method: 'POST',
        body: JSON.stringify({ id: departmentId, collegeId }),
    });
}

/**
 * Unfollow a department (with college isolation)
 */
export async function unfollowDepartment(departmentId: string, collegeId: string): Promise<{ message: string }> {
    return apiRequest(`/api/departments/follow/${departmentId}?collegeId=${encodeURIComponent(collegeId)}`, { method: 'DELETE' });
}

/**
 * Get followed departments (with college isolation)
 */
export async function getFollowedDepartments(collegeId: string): Promise<{ departments: string[] }> {
    return apiRequest(`/api/departments/following?collegeId=${encodeURIComponent(collegeId)}`);
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
    primaryScope?: {
        branch: string;
        semester: string;
        subject: string;
    };
    scopes?: Array<{
        branch: string;
        semester: string;
        subject: string;
        subjectKey?: string;
        isPrimary?: boolean;
        source?: string;
    }>;
    chapter?: string | null;
    topic?: string | null;
    uploadedByEmail: string;
    uploaded_by_email?: string;
    uploadedByName?: string | null;
    uploaded_by_name?: string | null;
    collegeId: string;
    college_id?: string;
    upvotes: number;
    downvotes: number;
    status?: string;
    isApproved: boolean;
    is_approved?: boolean;
    contributorsCount?: number;
    isContributor?: boolean;
    autoLinkedScopeCount?: number;
    createdAt: string;
    updatedAt: string;
    created_at?: string;
    updated_at?: string;
    file_url?: string | null;
    video_url?: string | null;
}

export interface VideoTopic {
    label: string;
    timestamp: string;
    startSeconds: number;
    endSeconds?: number;
    preview?: string;
}

export interface VideoTopicResponse {
    topics: VideoTopic[];
    status: string;
    source?: string;
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
    selectedScope?: {
        branch: string;
        semester: string;
        subject: string;
    };
    fileSha256?: string;
    recaptchaToken?: string;
}

export interface PresignedUpload {
    uploadUrl: string;
    publicUrl: string;
    key: string;
    contentType: string;
    expiresIn: number;
}

export interface AcademicCatalog {
    catalogVersion: string;
    branchModes: Array<{
        branch: string;
        semester: string;
        mode: 'catalog_select' | 'manual_text';
    }>;
    offerings: Array<{
        branch: string;
        semester: string;
        subject: string;
    }>;
}

export interface ResourceScopeResolution {
    selectedScope: {
        branch: string;
        semester: string;
        subject: string;
        subjectKey?: string;
    };
    resolvedScopes: Array<{
        branch: string;
        semester: string;
        subject: string;
        subjectKey?: string;
    }>;
    resolutionMode: 'catalog_auto' | 'selected_only';
    catalogSource?: string | null;
    catalogVersion?: string | null;
}

export interface ResourceUploadPlan extends ResourceScopeResolution {
    mode: 'reuse' | 'upload';
    resourceId?: string;
    resourcePreview?: Resource;
    uploadUrl?: string;
    publicUrl?: string;
    key?: string;
    contentType?: string;
    expiresIn?: number;
}

/**
 * Create a new resource
 */
export async function createResource(input: CreateResourceInput): Promise<{
    resource: Resource;
    created: boolean;
    reusedExisting: boolean;
    contributorRecorded: boolean;
    resolvedScopes: ResourceScopeResolution['resolvedScopes'];
}> {
    return apiRequest('/api/resources', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function getAcademicCatalog(collegeId?: string): Promise<AcademicCatalog> {
    const query = new URLSearchParams();
    if (collegeId && isUuid(collegeId)) {
        query.set('college_id', collegeId);
    }

    const queryString = query.toString();
    return apiRequest(`/api/academics/catalog${queryString ? `?${queryString}` : ''}`);
}

export async function resolveResourceScopes(
    selectedScope: { branch: string; semester: string; subject: string }
): Promise<ResourceScopeResolution> {
    return apiRequest('/api/resources/resolve-scopes', {
        method: 'POST',
        body: JSON.stringify({ selectedScope }),
    });
}

export async function planResourceUpload(input: {
    filename: string;
    contentType?: string;
    sizeBytes: number;
    fileSha256: string;
    type: string;
    selectedScope: { branch: string; semester: string; subject: string };
}): Promise<ResourceUploadPlan> {
    return apiRequest('/api/resources/upload-plan', {
        method: 'POST',
        body: JSON.stringify(input),
    });
}

export async function listResources(params?: {
    collegeId?: string;
    branch?: string;
    semester?: string;
    subject?: string;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
}): Promise<{ resources: Resource[]; count: number }> {
    const query = new URLSearchParams();
    if (params?.collegeId && isUuid(params.collegeId)) query.set('college_id', params.collegeId);
    if (params?.branch && params.branch !== 'all') query.set('branch', params.branch);
    if (params?.semester && params.semester !== 'all') query.set('semester', params.semester);
    if (params?.subject && params.subject !== 'all') query.set('subject', params.subject);
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.search?.trim()) query.set('search', params.search.trim());
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const queryString = query.toString();
    return apiRequest(`/api/v2/resources${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get a presigned URL for uploading a resource file
 */
export async function getResourceUploadUrl(filename: string): Promise<PresignedUpload> {
    return apiRequest('/api/resources/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename }),
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

export async function getResourceVideoTopics(resourceId: string): Promise<VideoTopicResponse> {
    return apiRequest(`/api/resources/${resourceId}/video-topics`);
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
    collegeId?: string,
    durationInDays?: number,
    tags?: string[]
): Promise<{ message: string; id: string; joinCode?: string; expiresAt?: string }> {
    return apiRequest('/api/chat/rooms', {
        method: 'POST',
        body: JSON.stringify({ name, description, isPrivate, collegeId, durationInDays, tags }),
    });
}

/**
 * Get notifications for current user
 */
export async function getNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
}): Promise<{ notifications: any[]; unreadCount?: number; hasMore?: boolean }> {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set('limit', params.limit.toString());
    if (params?.offset !== undefined) query.set('offset', params.offset.toString());
    if (params?.unreadOnly !== undefined) query.set('unreadOnly', String(params.unreadOnly));
    const qs = query.toString();
    return apiRequest(`/api/notifications${qs ? `?${qs}` : ''}`);
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
        expires_at?: string;
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

export interface SavedChatPost {
    id: string;
    roomId: string | null;
    messageId: string | null;
    savedAt: string | null;
    roomName: string;
    content: string | null;
    imageUrl: string | null;
    authorName: string | null;
    authorEmail: string | null;
    postedAt: string | null;
    upvotes: number;
    downvotes: number;
}

export async function getSavedChatPosts(): Promise<{ savedPosts: SavedChatPost[] }> {
    return apiRequest('/api/chat/saved');
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
 * Leave a chat room
 */
export async function leaveChatRoom(
    roomId: string
): Promise<{ message: string }> {
    return apiRequest(`/api/chat/rooms/${roomId}/leave`, {
        method: 'POST',
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
    subject?: string;
    ai_token_budget?: number;
    ai_token_used?: number;
    ai_token_remaining?: number;
    ai_token_base_budget?: number;
    ai_token_budget_multiplier?: number;
    ai_token_premium_multiplier?: number;
    ai_token_cycle_days?: number;
    ai_token_cycle_started_at?: string;
    ai_token_cycle_ends_at?: string;
    subscription_tier?: string;
    subscription_end_date?: string;
    ai_budget_inr?: number;
    role?: string;
    admin_capabilities?: Record<string, boolean>;
    scope_all_colleges?: boolean;
    admin_college_id?: string | null;
}

export interface AiTokenBalance {
    budget?: number;
    used?: number;
    remaining?: number;
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return undefined;

        const direct = Number(trimmed);
        if (Number.isFinite(direct)) return direct;

        const commaNormalized = trimmed.replace(/,/g, '');
        const commaParsed = Number(commaNormalized);
        if (Number.isFinite(commaParsed)) return commaParsed;

        const match = commaNormalized.match(/-?\d+(?:\.\d+)?/);
        if (!match) return undefined;
        const fromSubstring = Number(match[0]);
        return Number.isFinite(fromSubstring) ? fromSubstring : undefined;
    }
    return undefined;
}

function isRecord(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeKey(key: string): string {
    return key.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function pickFirstTextFromSources(
    sources: Record<string, any>[],
    keys: string[]
): string | undefined {
    for (const source of sources) {
        for (const key of keys) {
            const rawValue = source?.[key];
            if (rawValue === undefined || rawValue === null) continue;
            const text = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue).trim();
            if (text.length > 0) return text;
        }
    }
    return undefined;
}

function pickFirstNumberFromSources(
    sources: Record<string, any>[],
    keys: string[]
): number | undefined {
    for (const source of sources) {
        for (const key of keys) {
            const parsed = toOptionalNumber(source?.[key]);
            if (parsed !== undefined) return parsed;
        }
    }
    return undefined;
}

function collectProfileSources(raw: unknown): Record<string, any>[] {
    const sources: Record<string, any>[] = [];
    const queue: unknown[] = [raw];
    const seen = new Set<object>();
    const wrapperKeys = [
        'profile',
        'user',
        'me',
        'account',
        'data',
        'result',
        'payload',
        'balance',
        'ai_balance',
        'aiBalance',
        'token_balance',
        'tokenBalance',
        'usage',
        'quota',
        'limits',
    ];

    while (queue.length > 0 && sources.length < 80) {
        const current = queue.shift();
        if (!isRecord(current)) continue;
        if (seen.has(current)) continue;
        seen.add(current);
        sources.push(current);

        for (const key of wrapperKeys) {
            if (key in current) {
                queue.push(current[key]);
            }
        }
    }

    return sources;
}

function findNestedNumberByKeys(raw: unknown, keys: string[]): number | undefined {
    const normalizedKeys = new Set(keys.map(normalizeKey));
    const queue: unknown[] = [raw];
    const seen = new Set<object>();

    while (queue.length > 0) {
        const current = queue.shift();
        if (!isRecord(current)) continue;
        if (seen.has(current)) continue;
        seen.add(current);

        for (const [key, value] of Object.entries(current)) {
            if (normalizedKeys.has(normalizeKey(key))) {
                const parsed = toOptionalNumber(value);
                if (parsed !== undefined) return parsed;
            }
            if (isRecord(value)) {
                queue.push(value);
                continue;
            }
            if (Array.isArray(value)) {
                for (const item of value) queue.push(item);
            }
        }
    }

    return undefined;
}

function normalizeUserProfile(raw: any): UserProfile {
    const sources = collectProfileSources(raw);
    const balanceSources = sources.filter((source) =>
        ['balance', 'ai_balance', 'aiBalance', 'token_balance', 'tokenBalance'].some((key) => isRecord(source?.[key]))
    ).flatMap((source) => [
        source.balance,
        source.ai_balance,
        source.aiBalance,
        source.token_balance,
        source.tokenBalance,
    ]).filter(isRecord);

    const tokenSources = [...sources, ...balanceSources];

    const budgetKeys = [
        'ai_token_budget',
        'aiTokenBudget',
        'budget_tokens',
        'budgetTokens',
        'token_budget',
        'tokenBudget',
        'total_tokens',
        'totalTokens',
        'tokens_total',
        'tokensTotal',
        'token_limit',
        'tokenLimit',
        'quota_tokens',
        'quotaTokens',
        'daily_token_budget',
        'dailyTokenBudget',
        'max_tokens',
        'maxTokens',
    ];
    const usedKeys = [
        'ai_token_used',
        'aiTokenUsed',
        'used_tokens',
        'usedTokens',
        'token_used',
        'tokenUsed',
        'consumed_tokens',
        'consumedTokens',
        'tokens_used',
        'tokensUsed',
        'spent_tokens',
        'spentTokens',
    ];
    const remainingKeys = [
        'ai_token_remaining',
        'aiTokenRemaining',
        'remaining_tokens',
        'remainingTokens',
        'token_remaining',
        'tokenRemaining',
        'available_tokens',
        'availableTokens',
        'tokens_remaining',
        'tokensRemaining',
        'left_tokens',
        'leftTokens',
    ];
    const budgetInrKeys = [
        'ai_budget_inr',
        'aiBudgetInr',
        'budget_inr',
        'budgetInr',
        'daily_budget_inr',
        'dailyBudgetInr',
        'inr_budget',
        'inrBudget',
        'max_budget_inr',
        'maxBudgetInr',
    ];
    const baseBudgetKeys = [
        'ai_token_base_budget',
        'aiTokenBaseBudget',
        'token_base_budget',
        'tokenBaseBudget',
        'base_budget_tokens',
        'baseBudgetTokens',
    ];
    const budgetMultiplierKeys = [
        'ai_token_budget_multiplier',
        'aiTokenBudgetMultiplier',
        'token_budget_multiplier',
        'tokenBudgetMultiplier',
        'budget_multiplier',
        'budgetMultiplier',
    ];
    const premiumMultiplierKeys = [
        'ai_token_premium_multiplier',
        'aiTokenPremiumMultiplier',
        'token_premium_multiplier',
        'tokenPremiumMultiplier',
        'premium_multiplier',
        'premiumMultiplier',
    ];
    const cycleDaysKeys = [
        'ai_token_cycle_days',
        'aiTokenCycleDays',
        'token_cycle_days',
        'tokenCycleDays',
        'cycle_days',
        'cycleDays',
    ];
    const cycleStartedAtKeys = [
        'ai_token_cycle_started_at',
        'aiTokenCycleStartedAt',
        'token_cycle_started_at',
        'tokenCycleStartedAt',
        'cycle_started_at',
        'cycleStartedAt',
    ];
    const cycleEndsAtKeys = [
        'ai_token_cycle_ends_at',
        'aiTokenCycleEndsAt',
        'token_cycle_ends_at',
        'tokenCycleEndsAt',
        'cycle_ends_at',
        'cycleEndsAt',
    ];
    const subscriptionTierKeys = [
        'subscription_tier',
        'subscriptionTier',
    ];
    const subscriptionEndDateKeys = [
        'subscription_end_date',
        'subscriptionEndDate',
        'subscription_expires_at',
        'subscriptionExpiresAt',
    ];

    const email = pickFirstTextFromSources(sources, ['email', 'user_email', 'userEmail']) || '';
    const displayName = pickFirstTextFromSources(sources, ['display_name', 'displayName', 'name'])
        || (email ? email.split('@')[0] : 'User');

    return {
        id: pickFirstTextFromSources(sources, ['id', 'user_id', 'uid']) || email,
        email,
        display_name: displayName,
        username: pickFirstTextFromSources(sources, ['username']),
        bio: pickFirstTextFromSources(sources, ['bio']),
        profile_photo_url: pickFirstTextFromSources(sources, ['profile_photo_url', 'avatar_url', 'photo_url', 'avatarUrl', 'photoURL']),
        college: pickFirstTextFromSources(sources, ['college']),
        branch: pickFirstTextFromSources(sources, ['branch']),
        semester: pickFirstTextFromSources(sources, ['semester']),
        subject: pickFirstTextFromSources(sources, ['subject']),
        ai_token_budget: pickFirstNumberFromSources(tokenSources, budgetKeys)
            ?? findNestedNumberByKeys(raw, budgetKeys),
        ai_token_used: pickFirstNumberFromSources(tokenSources, usedKeys)
            ?? findNestedNumberByKeys(raw, usedKeys),
        ai_token_remaining: pickFirstNumberFromSources(tokenSources, remainingKeys)
            ?? findNestedNumberByKeys(raw, remainingKeys),
        ai_token_base_budget: pickFirstNumberFromSources(tokenSources, baseBudgetKeys)
            ?? findNestedNumberByKeys(raw, baseBudgetKeys),
        ai_token_budget_multiplier: pickFirstNumberFromSources(tokenSources, budgetMultiplierKeys)
            ?? findNestedNumberByKeys(raw, budgetMultiplierKeys),
        ai_token_premium_multiplier: pickFirstNumberFromSources(tokenSources, premiumMultiplierKeys)
            ?? findNestedNumberByKeys(raw, premiumMultiplierKeys),
        ai_token_cycle_days: pickFirstNumberFromSources(tokenSources, cycleDaysKeys)
            ?? findNestedNumberByKeys(raw, cycleDaysKeys),
        ai_token_cycle_started_at: pickFirstTextFromSources(tokenSources, cycleStartedAtKeys),
        ai_token_cycle_ends_at: pickFirstTextFromSources(tokenSources, cycleEndsAtKeys),
        subscription_tier: pickFirstTextFromSources(sources, subscriptionTierKeys),
        subscription_end_date: pickFirstTextFromSources(sources, subscriptionEndDateKeys),
        ai_budget_inr: pickFirstNumberFromSources(tokenSources, budgetInrKeys)
            ?? findNestedNumberByKeys(raw, budgetInrKeys),
    };
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<{ profile: UserProfile }> {
    const endpoints: Array<() => Promise<any>> = [
        () => apiRequest<any>('/api/users/profile'),
        () => apiRequest<any>('/api/auth/me'),
        () => apiRequest<any>('/api/auth/verify', { method: 'POST' }),
    ];

    let data: any = null;
    let lastError: unknown = null;

    for (const fetchProfile of endpoints) {
        try {
            data = await fetchProfile();
            break;
        } catch (error) {
            lastError = error;
            if (error instanceof ApiError && [404, 405].includes(error.status)) {
                continue;
            }
            throw error;
        }
    }

    if (!data) {
        throw lastError instanceof ApiError
            ? lastError
            : new ApiError('Failed to load profile', 0, { error: 'profile_unavailable' });
    }

    const profilePayload = (data && typeof data.profile === 'object')
        ? { ...data, ...data.profile }
        : data;
    const profile = normalizeUserProfile(profilePayload);
    return { ...data, profile };
}

function normalizeAiTokenBalance(raw: any): AiTokenBalance {
    const profile = normalizeUserProfile(raw);
    return {
        budget: toOptionalNumber(profile.ai_token_budget),
        used: toOptionalNumber(profile.ai_token_used),
        remaining: toOptionalNumber(profile.ai_token_remaining),
    };
}

/**
 * Get current user's AI token balance.
 * Tries dedicated AI endpoints first, then falls back to profile.
 */
export async function getAiTokenBalance(): Promise<AiTokenBalance> {
    // Primary source of truth: user profile (backed by the current backend).
    const profileResult = await getMyProfile();
    const balanceFromProfile = normalizeAiTokenBalance(profileResult);
    if (
        balanceFromProfile.budget !== undefined ||
        balanceFromProfile.used !== undefined ||
        balanceFromProfile.remaining !== undefined
    ) {
        return balanceFromProfile;
    }

    // Optional legacy endpoints (disabled by default to avoid 404 noise).
    const legacyEndpoints = String(process.env.NEXT_PUBLIC_LEGACY_AI_BALANCE_ENDPOINTS ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    for (const endpoint of legacyEndpoints) {
        try {
            const data = await apiRequest<any>(endpoint);
            const balance = normalizeAiTokenBalance(data);
            if (balance.budget !== undefined || balance.used !== undefined || balance.remaining !== undefined) {
                return balance;
            }
        } catch (error) {
            if (error instanceof ApiError && [404, 405].includes(error.status)) {
                continue;
            }
            // Ignore unsupported endpoints or transient failures and continue.
        }
    }

    return balanceFromProfile;
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
  // AI PHASE-1 ENDPOINTS
  // ============================================

  interface AiResponse<T> {
      status: 'ok';
      cached?: boolean;
      data: T;
      source?: {
          type?: 'primary' | 'ocr' | 'transcript';
          text?: string;
          ocrProvider?: 'google' | 'google_vision' | 'sarvam' | null;
      };
  }

export async function getAiSummary(
    fileId: string,
    options?: { useOcr?: boolean; ocrProvider?: 'google' | 'google_vision' | 'sarvam'; forceOcr?: boolean; collegeId?: string; force?: boolean; includeSource?: boolean; videoUrl?: string }
): Promise<AiResponse<string>> {
    return apiRequest('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({
            file_id: fileId,
            college_id: options?.collegeId,
            use_ocr: options?.useOcr,
            ocr_provider: options?.ocrProvider,
            force_ocr: options?.forceOcr,
            force: options?.force,
            include_source: options?.includeSource,
            video_url: options?.videoUrl,
        }),
    });
}

export async function getAiQuiz(
    fileId: string,
    options?: { useOcr?: boolean; ocrProvider?: 'google' | 'google_vision' | 'sarvam'; forceOcr?: boolean; collegeId?: string; force?: boolean; includeSource?: boolean; videoUrl?: string }
): Promise<AiResponse<any[]>> {
    return apiRequest('/api/ai/quiz', {
        method: 'POST',
        body: JSON.stringify({
            file_id: fileId,
            college_id: options?.collegeId,
            use_ocr: options?.useOcr,
            ocr_provider: options?.ocrProvider,
            force_ocr: options?.forceOcr,
            force: options?.force,
            include_source: options?.includeSource,
            video_url: options?.videoUrl,
        }),
    });
}

export async function getAiFlashcards(
    fileId: string,
    options?: { useOcr?: boolean; ocrProvider?: 'google' | 'google_vision' | 'sarvam'; forceOcr?: boolean; collegeId?: string; force?: boolean; includeSource?: boolean; videoUrl?: string }
): Promise<AiResponse<any[]>> {
    return apiRequest('/api/ai/flashcards', {
        method: 'POST',
        body: JSON.stringify({
            file_id: fileId,
            college_id: options?.collegeId,
            use_ocr: options?.useOcr,
            ocr_provider: options?.ocrProvider,
            force_ocr: options?.forceOcr,
            force: options?.force,
            include_source: options?.includeSource,
            video_url: options?.videoUrl,
        }),
    });
}

// ============================================
// RAG CHAT ENDPOINTS
// ============================================

export interface RagSource {
    file_id: string;
    title: string;
    source_type?: 'pdf' | 'youtube';
    pages?: { start: number; end: number };
    timestamp?: string;
    score?: number;
    file_url?: string | null;
    video_url?: string | null;
    semester?: string | null;
    branch?: string | null;
    subject?: string | null;
    upload_date?: string | null;
    uploader_id?: string | null;
}

export interface RagFollowUpAction {
    type:
    | 'search_web'
    | 'show_full_pdfs'
    | 'find_related_topics'
    | 'filter_results'
    | 'watch_video_segments'
    | 'get_more_details'
    | 'upload_materials'
    | 'rephrase_question';
    label: string;
    payload?: Record<string, unknown>;
}

export interface RagFilters {
    semester?: string;
    branch?: string;
    subject?: string;
    source_type?: 'pdf' | 'youtube' | 'both';
    date_from?: string;
    date_to?: string;
}

export interface RagConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}

export interface RagResponse {
    answer: string;
    sources: RagSource[];
    follow_ups?: RagFollowUpAction[];
    cached: boolean;
    no_local: boolean;
    top_score: number;
    retrieval_count: number;
    query_hash: string;
    model: string;
    intent?: 'qa' | 'summary' | 'comparison' | 'definition';
    applied_filters?: RagFilters;
}

export async function queryRag(
    question: string,
    options?: {
        collegeId?: string;
        topK?: number;
        minScore?: number;
        allowWeb?: boolean;
        filters?: RagFilters;
        history?: RagConversationTurn[];
        videoUrl?: string;
    }
): Promise<RagResponse> {
    return apiRequest('/api/rag/query', {
        method: 'POST',
        body: JSON.stringify({
            question,
            college_id: options?.collegeId,
            top_k: options?.topK,
            min_score: options?.minScore,
            allow_web: options?.allowWeb,
            filters: options?.filters,
            history: options?.history,
            video_url: options?.videoUrl,
        }),
    });
}

// ============================================
// SYLLABUS ENDPOINTS
// ============================================

/**
 * Get a presigned URL for uploading syllabus PDF
 */
export async function getSyllabusUploadUrl(
    filename: string
): Promise<PresignedUpload> {
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
// NOTICES
// ============================================

export interface Notice {
    id: string;
    title: string;
    content: string;
    department: string;
    priority: string;
    file_url: string | null;
    file_type: 'pdf' | 'video' | 'image' | null;
    created_by: string;
    created_at: string;
    expires_at: string | null;
    is_active: boolean;
    likes: number;
    comments: number;
    comments_count?: number;
    college_id?: string | null;
}

export async function getNotices(params?: {
    collegeId?: string | string[] | null;
    department?: string | null;
}): Promise<{ notices: Notice[] }> {
    const query = new URLSearchParams();
    const collegeIds = Array.isArray(params?.collegeId)
        ? params?.collegeId
        : params?.collegeId
            ? [params.collegeId]
            : [];

    for (const rawCollegeId of collegeIds) {
        const collegeId = rawCollegeId?.trim();
        if (collegeId) {
            query.append('college_id', collegeId);
        }
    }

    const department = params?.department?.trim();
    if (department) {
        query.set('department', department);
    }

    const queryString = query.toString();
    return apiRequest(`/api/notices${queryString ? `?${queryString}` : ''}`);
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

