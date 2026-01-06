import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

export interface FollowRequest {
    id: string;
    requesterEmail: string;
    targetEmail: string;
    status: 'pending' | 'approved' | 'rejected';
    collegeId: string;
    createdAt: string;
    respondedAt?: string;
    respondedBy?: string;
}

/**
 * Create a new follow request
 */
export async function createFollowRequest(
    requesterEmail: string,
    targetEmail: string,
    collegeId: string
): Promise<FollowRequest> {
    const supabase = getSupabaseAdmin();

    // Validate: can't follow yourself
    if (requesterEmail === targetEmail) {
        throw Errors.badRequest('You cannot follow yourself');
    }

    // Check if already following
    const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_email', requesterEmail)
        .eq('following_email', targetEmail)
        .single();

    if (existingFollow) {
        throw Errors.conflict('You are already following this user');
    }

    // Check if request already pending
    const { data: existingRequest } = await supabase
        .from('follow_requests')
        .select('id, status')
        .eq('requester_email', requesterEmail)
        .eq('target_email', targetEmail)
        .eq('status', 'pending')
        .single();

    if (existingRequest) {
        throw Errors.conflict('Follow request already pending');
    }

    // Create the request
    const { data, error } = await supabase
        .from('follow_requests')
        .insert({
            requester_email: requesterEmail,
            target_email: targetEmail,
            status: 'pending',
            college_id: collegeId,
        })
        .select()
        .single();

    if (error) {
        console.error('[FollowService] Create request error:', error);
        throw Errors.internal('Failed to create follow request');
    }

    // Create notification for target user
    await supabase.from('notifications').insert({
        user_email: targetEmail,
        type: 'follow_request',
        title: 'Follow Request',
        message: `${requesterEmail.split('@')[0]} wants to follow you`,
        read: false,
        college_id: collegeId,
    });

    return {
        id: data.id,
        requesterEmail: data.requester_email,
        targetEmail: data.target_email,
        status: data.status,
        collegeId: data.college_id,
        createdAt: data.created_at,
    };
}

/**
 * Approve a follow request
 */
export async function approveFollowRequest(
    requestId: string,
    approverEmail: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get the request
    const { data: request, error: fetchError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        throw Errors.notFound('Follow request');
    }

    // Verify approver is the target
    if (request.target_email !== approverEmail) {
        throw Errors.forbidden('You can only approve requests sent to you');
    }

    if (request.status !== 'pending') {
        throw Errors.badRequest('Request is no longer pending');
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('follow_requests')
        .update({
            status: 'approved',
            responded_at: new Date().toISOString(),
            responded_by: approverEmail,
        })
        .eq('id', requestId);

    if (updateError) {
        throw Errors.internal('Failed to update request');
    }

    // Create the actual follow relationship
    const { error: followError } = await supabase
        .from('follows')
        .insert({
            follower_email: request.requester_email,
            following_email: request.target_email,
            college_id: request.college_id,
        });

    if (followError && followError.code !== '23505') { // Ignore duplicate
        console.error('[FollowService] Create follow error:', followError);
    }

    // Notify the requester
    await supabase.from('notifications').insert({
        user_email: request.requester_email,
        type: 'follow_approved',
        title: 'Follow Request Approved',
        message: `${approverEmail.split('@')[0]} accepted your follow request`,
        read: false,
        college_id: request.college_id,
    });
}

/**
 * Reject a follow request
 */
export async function rejectFollowRequest(
    requestId: string,
    rejecterEmail: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get the request
    const { data: request, error: fetchError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        throw Errors.notFound('Follow request');
    }

    // Verify rejecter is the target
    if (request.target_email !== rejecterEmail) {
        throw Errors.forbidden('You can only reject requests sent to you');
    }

    if (request.status !== 'pending') {
        throw Errors.badRequest('Request is no longer pending');
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('follow_requests')
        .update({
            status: 'rejected',
            responded_at: new Date().toISOString(),
            responded_by: rejecterEmail,
        })
        .eq('id', requestId);

    if (updateError) {
        throw Errors.internal('Failed to update request');
    }
}

/**
 * Cancel a pending follow request (by requester)
 */
export async function cancelFollowRequest(
    requestId: string,
    requesterEmail: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { data: request, error: fetchError } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        throw Errors.notFound('Follow request');
    }

    if (request.requester_email !== requesterEmail) {
        throw Errors.forbidden('You can only cancel your own requests');
    }

    if (request.status !== 'pending') {
        throw Errors.badRequest('Request is no longer pending');
    }

    const { error: deleteError } = await supabase
        .from('follow_requests')
        .delete()
        .eq('id', requestId);

    if (deleteError) {
        throw Errors.internal('Failed to cancel request');
    }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
    followerEmail: string,
    targetEmail: string
): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_email', followerEmail)
        .eq('following_email', targetEmail);

    if (error) {
        throw Errors.internal('Failed to unfollow user');
    }
}

/**
 * Get pending follow requests for a user
 */
export async function getPendingRequests(userEmail: string): Promise<FollowRequest[]> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('target_email', userEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        throw Errors.internal('Failed to fetch requests');
    }

    return (data || []).map(r => ({
        id: r.id,
        requesterEmail: r.requester_email,
        targetEmail: r.target_email,
        status: r.status,
        collegeId: r.college_id,
        createdAt: r.created_at,
    }));
}
