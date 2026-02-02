import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "Código de convite inválido" },
        { status: 400 },
      );
    }

    const supabase = await createServiceClient();

    // Check if invite code exists and is active
    const { data: inviteCodes, error } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code.trim());

    const inviteCode = inviteCodes?.find((code) => code.is_active);

    if (error || !inviteCode) {
      return NextResponse.json(
        { valid: false, error: "Código de convite não encontrado" },
        { status: 404 },
      );
    }

    // Check if max_uses has been reached
    if (
      inviteCode.max_uses !== null &&
      inviteCode.usage_count >= inviteCode.max_uses
    ) {
      return NextResponse.json(
        { valid: false, error: "Código de convite já atingiu o limite de uso" },
        { status: 403 },
      );
    }

    // Return success with invite code ID for tracking
    return NextResponse.json({
      valid: true,
      inviteCodeId: inviteCode.id,
    });
  } catch (error) {
    console.error("Invite code validation error:", error);
    return NextResponse.json(
      { valid: false, error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
