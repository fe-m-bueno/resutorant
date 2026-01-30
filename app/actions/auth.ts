"use server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ValidateInviteResult = {
  valid: boolean;
  error?: string;
};

export type SignUpResult = {
  success: boolean;
  error?: string;
};

/**
 * Validates an invite code server-side.
 * Uses admin client since invite_codes has no public RLS policies.
 */
export async function validateInviteKey(code: string): Promise<ValidateInviteResult> {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Código de convite é obrigatório" };
  }

  const adminClient = createAdminSupabaseClient();

  const { data, error } = await adminClient
    .from("invite_codes")
    .select("id, code, is_active, usage_count, max_uses")
    .eq("code", code.trim().toUpperCase())
    .single();

  if (error || !data) {
    return { valid: false, error: "Código de convite inválido" };
  }

  if (!data.is_active) {
    return { valid: false, error: "Este código de convite foi desativado" };
  }

  if (data.max_uses && data.usage_count >= data.max_uses) {
    return { valid: false, error: "Este código de convite atingiu o limite de usos" };
  }

  return { valid: true };
}

/**
 * Sign up a new user with invite code validation.
 * Increments usage_count on successful signup.
 */
export async function signUpWithInviteKey(
  email: string,
  password: string,
  inviteCode: string
): Promise<SignUpResult> {
  // First validate the invite code
  const validation = await validateInviteKey(inviteCode);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const adminClient = createAdminSupabaseClient();
  const supabase = await createClient();

  // Create user via standard auth (respects email verification settings)
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (signUpError) {
    return { success: false, error: signUpError.message };
  }

  // Increment usage count
  await adminClient
    .from("invite_codes")
    .update({ usage_count: adminClient.rpc("increment_usage", { code_value: inviteCode.trim().toUpperCase() }) })
    .eq("code", inviteCode.trim().toUpperCase());

  // Simpler increment approach
  const { data: codeData } = await adminClient
    .from("invite_codes")
    .select("usage_count")
    .eq("code", inviteCode.trim().toUpperCase())
    .single();

  if (codeData) {
    await adminClient
      .from("invite_codes")
      .update({ usage_count: codeData.usage_count + 1 })
      .eq("code", inviteCode.trim().toUpperCase());
  }

  return { success: true };
}

/**
 * Validate invite code for Google OAuth flow.
 * Called before redirecting to Google.
 */
export async function validateForOAuth(inviteCode: string): Promise<ValidateInviteResult> {
  return validateInviteKey(inviteCode);
}

/**
 * Increment invite code usage after OAuth signup completes.
 */
export async function incrementInviteUsage(inviteCode: string): Promise<void> {
  const adminClient = createAdminSupabaseClient();
  
  const { data: codeData } = await adminClient
    .from("invite_codes")
    .select("usage_count")
    .eq("code", inviteCode.trim().toUpperCase())
    .single();

  if (codeData) {
    await adminClient
      .from("invite_codes")
      .update({ usage_count: codeData.usage_count + 1 })
      .eq("code", inviteCode.trim().toUpperCase());
  }
}
