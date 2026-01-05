"use strict";
// ============================================
// FIREBASE CLOUD FUNCTIONS - PRODUCTION SECURITY
// Using Firebase Functions v2 API
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveRoom = exports.deleteRoomMessage = exports.unfollowUser = exports.followUser = exports.updateResource = exports.deleteResource = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const supabase_js_1 = require("@supabase/supabase-js");
const params_1 = require("firebase-functions/params");
(0, app_1.initializeApp)();
// Define config parameters
const supabaseUrl = (0, params_1.defineString)('SUPABASE_URL');
const supabaseKey = (0, params_1.defineString)('SUPABASE_SERVICE_KEY');
// Initialize Supabase with service role (bypasses RLS)
const getSupabase = () => {
    return (0, supabase_js_1.createClient)(supabaseUrl.value(), supabaseKey.value());
};
// ============================================
// RESOURCE OPERATIONS
// ============================================
exports.deleteResource = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { resourceId } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    const supabase = getSupabase();
    // Server-side ownership check
    const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('uploaded_by_email')
        .eq('id', resourceId)
        .single();
    if (fetchError || !resource) {
        throw new https_1.HttpsError('not-found', 'Resource not found');
    }
    if (resource.uploaded_by_email !== userEmail) {
        throw new https_1.HttpsError('permission-denied', 'You do not own this resource');
    }
    // Perform deletion with service role
    const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);
    if (error) {
        throw new https_1.HttpsError('internal', error.message);
    }
    return { success: true, message: 'Resource deleted successfully' };
});
exports.updateResource = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { resourceId, updates } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    const supabase = getSupabase();
    // Verify ownership
    const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('uploaded_by_email')
        .eq('id', resourceId)
        .single();
    if (fetchError || !resource) {
        throw new https_1.HttpsError('not-found', 'Resource not found');
    }
    if (resource.uploaded_by_email !== userEmail) {
        throw new https_1.HttpsError('permission-denied', 'You do not own this resource');
    }
    const { error } = await supabase
        .from('resources')
        .update(Object.assign(Object.assign({}, updates), { updated_at: new Date().toISOString() }))
        .eq('id', resourceId);
    if (error) {
        throw new https_1.HttpsError('internal', error.message);
    }
    return { success: true, message: 'Resource updated successfully' };
});
// ============================================
// FOLLOW OPERATIONS
// ============================================
exports.followUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { targetEmail } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    if (userEmail === targetEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Cannot follow yourself');
    }
    const supabase = getSupabase();
    const { error } = await supabase
        .from('follows')
        .insert({
        follower_email: userEmail,
        following_email: targetEmail
    });
    if (error) {
        if (error.code === '23505') {
            throw new https_1.HttpsError('already-exists', 'Already following');
        }
        throw new https_1.HttpsError('internal', error.message);
    }
    // Create notification
    await supabase.from('notifications').insert({
        user_email: targetEmail,
        type: 'follow',
        title: 'New Follower',
        message: `${userEmail.split('@')[0]} started following you`,
        read: false
    });
    return { success: true, message: 'Follow successful' };
});
exports.unfollowUser = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { targetEmail } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    const supabase = getSupabase();
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_email', userEmail)
        .eq('following_email', targetEmail);
    if (error) {
        throw new https_1.HttpsError('internal', error.message);
    }
    return { success: true, message: 'Unfollow successful' };
});
// ============================================
// ROOM OPERATIONS
// ============================================
exports.deleteRoomMessage = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { messageId } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    const supabase = getSupabase();
    // Verify ownership
    const { data: message, error: fetchError } = await supabase
        .from('room_messages')
        .select('author_email')
        .eq('id', messageId)
        .single();
    if (fetchError || !message) {
        throw new https_1.HttpsError('not-found', 'Message not found');
    }
    if (message.author_email !== userEmail) {
        throw new https_1.HttpsError('permission-denied', 'You did not post this message');
    }
    const { error } = await supabase
        .from('room_messages')
        .delete()
        .eq('id', messageId);
    if (error) {
        throw new https_1.HttpsError('internal', error.message);
    }
    return { success: true, message: 'Message deleted successfully' };
});
exports.leaveRoom = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be logged in');
    }
    const { roomId } = request.data;
    const userEmail = request.auth.token.email;
    if (!userEmail) {
        throw new https_1.HttpsError('invalid-argument', 'Email not found');
    }
    const supabase = getSupabase();
    const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_email', userEmail);
    if (error) {
        throw new https_1.HttpsError('internal', error.message);
    }
    // Update member count (if you have this function in Supabase)
    // await supabase.rpc('decrement_room_members', { room_id: roomId });
    return { success: true, message: 'Left room successfully' };
});
//# sourceMappingURL=index.js.map