import { getSupabaseAdmin } from '../config/supabase';
import { Errors } from '../middleware/errorHandler';

export interface Vote {
    id: string;
    userId: string;
    resourceId: string;
    voteType: 'upvote' | 'downvote';
    createdAt: string;
}

/**
 * Get user's vote for a resource
 */
export async function getUserVote(userId: string, resourceId: string): Promise<'upvote' | 'downvote' | null> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('resource_id', resourceId)
        .maybeSingle();

    if (error) {
        console.error('[VoteService] Get vote error:', error);
        return null;
    }

    return data?.vote_type || null;
}

/**
 * Cast or update a vote
 */
export async function castVote(
    userId: string,
    resourceId: string,
    voteType: 'upvote' | 'downvote'
): Promise<{ action: 'created' | 'updated' | 'removed' }> {
    const supabase = getSupabaseAdmin();

    // Check existing vote
    const existingVote = await getUserVote(userId, resourceId);

    if (existingVote === voteType) {
        // Same vote = remove it
        const { error } = await supabase
            .from('votes')
            .delete()
            .eq('user_id', userId)
            .eq('resource_id', resourceId);

        if (error) {
            console.error('[VoteService] Delete vote error:', error);
            throw Errors.internal('Failed to remove vote');
        }

        // Update resource vote counts
        await updateResourceVoteCounts(resourceId, existingVote, 'remove');
        return { action: 'removed' };
    } else if (existingVote) {
        // Different vote = change it
        const { error } = await supabase
            .from('votes')
            .update({ vote_type: voteType })
            .eq('user_id', userId)
            .eq('resource_id', resourceId);

        if (error) {
            console.error('[VoteService] Update vote error:', error);
            throw Errors.internal('Failed to update vote');
        }

        // Update resource vote counts (remove old, add new)
        await updateResourceVoteCounts(resourceId, existingVote, 'remove');
        await updateResourceVoteCounts(resourceId, voteType, 'add');
        return { action: 'updated' };
    } else {
        // No existing vote = create new
        const { error } = await supabase
            .from('votes')
            .insert({
                user_id: userId,
                resource_id: resourceId,
                vote_type: voteType,
            });

        if (error) {
            console.error('[VoteService] Insert vote error:', error);
            throw Errors.internal('Failed to cast vote');
        }

        // Update resource vote counts
        await updateResourceVoteCounts(resourceId, voteType, 'add');
        return { action: 'created' };
    }
}

/**
 * Update the upvotes/downvotes count on the resources table
 */
async function updateResourceVoteCounts(
    resourceId: string,
    voteType: 'upvote' | 'downvote',
    operation: 'add' | 'remove'
): Promise<void> {
    const supabase = getSupabaseAdmin();

    // Get current counts
    const { data: resource, error: fetchError } = await supabase
        .from('resources')
        .select('upvotes, downvotes')
        .eq('id', resourceId)
        .single();

    if (fetchError || !resource) {
        console.error('[VoteService] Fetch resource error:', fetchError);
        return; // Don't fail the vote operation
    }

    const delta = operation === 'add' ? 1 : -1;
    const updates = voteType === 'upvote'
        ? { upvotes: Math.max(0, (resource.upvotes || 0) + delta) }
        : { downvotes: Math.max(0, (resource.downvotes || 0) + delta) };

    const { error: updateError } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', resourceId);

    if (updateError) {
        console.error('[VoteService] Update counts error:', updateError);
    }
}

/**
 * Get vote counts for a resource
 */
export async function getVoteCounts(resourceId: string): Promise<{ upvotes: number; downvotes: number }> {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
        .from('resources')
        .select('upvotes, downvotes')
        .eq('id', resourceId)
        .single();

    if (error) {
        console.error('[VoteService] Get counts error:', error);
        return { upvotes: 0, downvotes: 0 };
    }

    return {
        upvotes: data?.upvotes || 0,
        downvotes: data?.downvotes || 0,
    };
}
