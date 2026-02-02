import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Código de convite inválido" },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Get the invite code first
    const { data: inviteCode, error: fetchError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code.trim())
      .eq("is_active", true)
      .single();

    if (fetchError || !inviteCode) {
      return NextResponse.json(
        { success: false, error: "Código de convite não encontrado" },
        { status: 404 },
      );
    }

    // Check if max_uses has been reached
    if (inviteCode.max_uses !== null && inviteCode.usage_count >= inviteCode.max_uses) {
      return NextResponse.json(
        { success: false, error: "Código de convite já atingiu o limite de uso" },
        { status: 403 },
      );
    }

    // Increment usage count
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({ usage_count: inviteCode.usage_count + 1 })
      .eq("id", inviteCode.id);

    if (updateError) {
      console.error("Failed to increment invite code usage:", updateError);
      return NextResponse.json(
        { success: false, error: "Erro ao processar código de convite" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      inviteCodeId: inviteCode.id,
    });
  } catch (error) {
    console.error("Invite code consume error:", error);
    return NextResponse.json(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
