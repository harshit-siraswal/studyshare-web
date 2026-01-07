import { getSupabaseAdmin } from '../config/supabase.js';
import { Errors } from '../middleware/errorHandler.js';

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
 * Vote on a message
 */
export async function voteMessage(
    messageId: string,
    direction: 'up' | 'down',
    delta: number
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get current counts
    const { data: msg, error: fetchError } = await supabase
        .from('room_messages')
        .select('upvotes, downvotes')
        .eq('id', messageId)
        .single();

    if (fetchError || !msg) {
        throw Errors.notFound('Message');
    }

    const updates = direction === 'up'
        ? { upvotes: Math.max(0, msg.upvotes + delta) }
        : { downvotes: Math.max(0, msg.downvotes + delta) };

    const { error } = await supabase
        .from('room_messages')
        .update(updates)
        .eq('id', messageId);

    if (error) {
        console.error('[ChatService] Vote error:', error);
        throw Errors.internal('Failed to vote');
    }
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
    content: string
): Promise<{ id: string }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('room_post_comments')
        .insert({
            message_id: messageId,
            author_name: authorName,
            author_email: authorEmail,
            content,
        })
        .select('id')
        .single();

    if (error) {
        console.error('[ChatService] Add comment error:', error);
        throw Errors.internal('Failed to add comment');
    }

    return { id: data.id };
}

function generateJoinCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
