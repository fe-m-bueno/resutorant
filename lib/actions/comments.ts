'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addComment(
  logId: string,
  content: string,
  parentId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: newComment, error } = await supabase
    .from('comments')
    .insert({
      log_id: logId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    })
    .select('*, user:profiles(*), likes:comment_likes(user_id)')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath(`/log/${logId}`);

  return newComment;
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // RLS will handle the permission check (owner or author)
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    // If error is permission denied, it will throw here
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
}

export async function toggleCommentLike(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  // Check if like exists
  const { data: existingLike } = await supabase
    .from('comment_likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('comment_id', commentId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('comment_likes')
      .delete()
      .eq('id', existingLike.id);
    if (error) throw new Error(error.message);
  } else {
    // Like
    const { error } = await supabase.from('comment_likes').insert({
      user_id: user.id,
      comment_id: commentId,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath('/dashboard');
}
