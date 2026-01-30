import { createClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { incrementInviteUsage } from "@/app/actions/auth";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/protected";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      const cookieStore = await cookies();
      const pendingInvite = cookieStore.get("pending_invite_code")?.value;
      
      // Check if user is "new" (created within the last 2 minutes)
      const createdAt = new Date(user.created_at).getTime();
      const now = Date.now();
      const isNewUser = (now - createdAt) < 2 * 60 * 1000; // 2 minutes tolerance

      if (isNewUser) {
        if (pendingInvite) {
          // Valid invite present -> Increment usage and allow
          try {
            await incrementInviteUsage(pendingInvite);
            // Clear the cookie
            cookieStore.delete("pending_invite_code");
          } catch (e) {
            console.error("Failed to increment invite usage", e);
            // We still allow the user since they had a valid code in cookie
          }
        } else {
          // New user WITHOUT invite cookie -> BLOCK
          console.log(`Blocking new user ${user.id} - no invite code`);
          
          // 1. Delete the just-created user
          const adminClient = createAdminSupabaseClient();
          await adminClient.auth.admin.deleteUser(user.id);
          
          // 2. Sign out from this session
          await supabase.auth.signOut();
          
          // 3. Redirect to invite page with error
          return NextResponse.redirect(`${origin}/auth/invite?error=Convite obrigatório para novos registos via Google`);
        }
      }

      // Existing users or valid new users proceed here
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Redirect to error page if something went wrong
  return NextResponse.redirect(`${origin}/auth/error?error=Could not authenticate with Google`);
}

