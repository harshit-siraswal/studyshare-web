import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

/**
 * Create a chat room
 */
export async function createRoom(
    name: string,
    description: string | null,
    isPrivate: boolean,
    createdBy: string,
    collegeId: string
): Promise<{ id: string; joinCode?: string }> {
    const supabase = getSupabaseAdmin();

    const joinCode = isPrivate ? generateJoinCode() : null;

    const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
            name,
            description,
            is_private: isPrivate,
            join_code: joinCode,
            created_by: createdBy,
            college_id: collegeId,
            member_count: 1,
        })
        .select()
        .single();

    if (error) {
        console.error('[ChatService] Create room error:', error);
        throw Errors.internal('Failed to create room');
    }

    // Add creator as first member
    await addMember(data.id, createdBy, collegeId);

    return { id: data.id, joinCode: joinCode || undefined };
}

/**
 * Join a room by code
 */
export async function joinRoomByCode(
    joinCode: string,
    userEmail: string,
    collegeId: string
): Promise<{ roomId: string; roomName: string }> {
    const supabase = getSupabaseAdmin();

    // Find room by code
    const { data: room, error: findError } = await supabase
        .from('chat_rooms')
        .select('id, name, member_count')
        .eq('join_code', joinCode)
        .eq('college_id', collegeId)
        .single();

    if (findError || !room) {
        throw Errors.notFound('Room with this code');
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_email', userEmail)
        .single();

    if (existing) {
        throw Errors.conflict('Already a member of this room');
    }

    // Add as member
    await addMember(room.id, userEmail, collegeId);

    // Increment member count
    await supabase
        .from('chat_rooms')
        .update({ member_count: room.member_count + 1 })
        .eq('id', room.id);

    return { roomId: room.id, roomName: room.name };
}

/**
 * Join a room by ID (for public rooms or after password verification)
 */
export async function joinRoomById(
    roomId: string,
    userEmail: string,
    userName: string,
    collegeId: string
): Promise<{ roomName: string }> {
    const supabase = getSupabaseAdmin();

    // Get room info
    const { data: room, error: findError } = await supabase
        .from('chat_rooms')
        .select('id, name, member_count')
        .eq('id', roomId)
        .single();

    if (findError || !room) {
        throw Errors.notFound('Room');
    }

    // Check if already a member
    const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_email', userEmail)
        .single();

    if (existing) {
        // Already a member, just return room name
        return { roomName: room.name };
    }

    // Add as member
    const { error: memberError } = await supabase
        .from('room_members')
        .insert({
            room_id: roomId,
            user_email: userEmail,
            user_name: userName,
            college_id: collegeId,
        });

    if (memberError && memberError.code !== '23505') {
        console.error('[ChatService] Add member error:', memberError);
        throw Errors.internal('Failed to join room');
    }

    // Increment member count
    await supabase
        .from('chat_rooms')
        .update({ member_count: room.member_count + 1 })
        .eq('id', roomId);

    return { roomName: room.name };
}

/**
 * Add a member to a room
 */
export async function addMember(roomId: string, userEmail: string, collegeId: string): Promise<void> {
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
        .from('room_members')
        .insert({
            room_id: roomId,
            user_email: userEmail,
            college_id: collegeId,
        });

    if (error && error.code !== '23505') { // Ignore duplicate key
        console.error('[ChatService] Add member error:', error);
        throw Errors.internal('Failed to add member');
    }
}

/**
 * Post a message to a room
 */
export async function postMessage(
    roomId: string,
    authorName: string,
    authorEmail: string,
    content: string,
    imageUrl?: string
): Promise<{ id: string }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('room_messages')
        .insert({
            room_id: roomId,
            author_name: authorName,
            author_email: authorEmail,
            content,
            image_url: imageUrl || null,
            upvotes: 0,
            downvotes: 0,
        })
        .select('id')
        .single();

    if (error) {
        console.error('[ChatService] Post message error:', error);
        throw Errors.internal('Failed to post message');
    }

    return { id: data.id };
}

/**
 * Vote on a message with proper toggle logic
 * 1. If no previous vote → insert vote
 * 2. If same vote → remove vote (toggle off)
 * 3. If opposite vote → update vote
 */
export async function voteMessage(
    messageId: string,
    userEmail: string,
    direction: 'up' | 'down'
): Promise<{ action: 'added' | 'removed' | 'changed'; newUpvotes: number; newDownvotes: number }> {
    const supabase = getSupabaseAdmin();

    // Get current message counts
    const { data: msg, error: fetchError } = await supabase
        .from('room_messages')
        .select('upvotes, downvotes')
        .eq('id', messageId)
        .single();

    if (fetchError || !msg) {
        throw Errors.notFound('Message');
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
        .from('room_message_votes')
        .select('id, vote_type')
        .eq('message_id', messageId)
        .eq('user_email', userEmail)
        .single();

    let action: 'added' | 'removed' | 'changed';
    let upDelta = 0;
    let downDelta = 0;

    if (!existingVote) {
        // No previous vote → insert new vote
        await supabase.from('room_message_votes').insert({
            message_id: messageId,
            user_email: userEmail,
            vote_type: direction,
        });
        action = 'added';
        if (direction === 'up') upDelta = 1;
        else downDelta = 1;
    } else if (existingVote.vote_type === direction) {
        // Same vote → remove (toggle off)
        await supabase.from('room_message_votes').delete().eq('id', existingVote.id);
        action = 'removed';
        if (direction === 'up') upDelta = -1;
        else downDelta = -1;
    } else {
        // Opposite vote → change
        await supabase.from('room_message_votes')
            .update({ vote_type: direction })
            .eq('id', existingVote.id);
        action = 'changed';
        if (direction === 'up') {
            upDelta = 1;
            downDelta = -1;
        } else {
            upDelta = -1;
            downDelta = 1;
        }
    }

    // Update message counts
    const newUpvotes = Math.max(0, msg.upvotes + upDelta);
    const newDownvotes = Math.max(0, msg.downvotes + downDelta);

    await supabase
        .from('room_messages')
        .update({ upvotes: newUpvotes, downvotes: newDownvotes })
        .eq('id', messageId);

    return { action, newUpvotes, newDownvotes };
}

/**
 * Get user's votes for a room's messages
 */
export async function getUserVotes(
    roomId: string,
    userEmail: string
): Promise<Record<string, 'up' | 'down'>> {
    const supabase = getSupabaseAdmin();

    // Get all message IDs in the room
    const { data: messages } = await supabase
        .from('room_messages')
        .select('id')
        .eq('room_id', roomId);

    if (!messages || messages.length === 0) return {};

    const messageIds = messages.map(m => m.id);

    // Get user's votes for these messages
    const { data: votes } = await supabase
        .from('room_message_votes')
        .select('message_id, vote_type')
        .eq('user_email', userEmail)
        .in('message_id', messageIds);

    const voteMap: Record<string, 'up' | 'down'> = {};
    (votes || []).forEach(v => {
        voteMap[v.message_id] = v.vote_type as 'up' | 'down';
    });

    return voteMap;
}

/**
 * Save/unsave a post
 */
export async function toggleSavePost(
    userEmail: string,
    messageId: string,
    roomId: string
): Promise<{ saved: boolean }> {
    const supabase = getSupabaseAdmin();

    // Check if already saved
    const { data: existing } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_email', userEmail)
        .eq('message_id', messageId)
        .single();

    if (existing) {
        // Unsave
        await supabase
            .from('saved_posts')
            .delete()
            .eq('id', existing.id);
        return { saved: false };
    } else {
        // Save
        await supabase
            .from('saved_posts')
            .insert({
                user_email: userEmail,
                message_id: messageId,
                room_id: roomId,
            });
        return { saved: true };
    }
}

/**
 * Add a comment to a post
 */
export async function addComment(
    messageId: string,
    authorName: string,
    authorEmail: string,
    content: string,
    parentId?: string
): Promise<{ id: string }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('room_post_comments')
        .insert({
            message_id: messageId,
            author_name: authorName,
            author_email: authorEmail,
            content,
            parent_id: parentId || null
        })
        .select('id')
        .single();

    if (error) {
        console.error('[ChatService] Add comment error:', error);
        throw Errors.internal('Failed to add comment');
    }

    // Handle Notification if reply
    if (parentId) {
        try {
            // Fetch parent comment author
            const { data: parentComment } = await supabase
                .from('room_post_comments')
                .select('author_email')
                .eq('id', parentId)
                .single();

            if (parentComment && parentComment.author_email !== authorEmail) {
                // Fetch parent author user ID
                const { data: parentAuthor } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', parentComment.author_email)
                    .single();

                if (parentAuthor) {
                    const { createNotification } = await import('./notification.service');
                    // Get room id for link
                    const { data: message } = await supabase
                        .from('room_messages')
                        .select('room_id')
                        .eq('id', messageId)
                        .single();

                    await createNotification(
                        parentAuthor.id,
                        'New Reply',
                        `${authorName} replied to your comment in chatroom`,
                        'chat',
                        message ? `/chatroom/${message.room_id}` : '/chatroom'
                    );
                }
            }
        } catch (notifyError) {
            console.error('[ChatService] Notification error:', notifyError);
        }
    }

    return { id: data.id };
}

/**
 * Get comments for a post
 */
export async function getComments(
    messageId: string
): Promise<{ comments: any[] }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('room_post_comments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[ChatService] Get comments error:', error);
        throw Errors.internal('Failed to fetch comments');
    }

    return { comments: data || [] };
}

function generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
