import { createServiceClient } from "@/lib/supabase/service"
import { deleteAccount } from "@/lib/queries"
import { NextResponse } from "next/server"
import { deleteAccountSuccessSchema, deleteAccountErrorSchema } from "./schemas"

export async function POST() {
  try {
    const supabase = await createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const errorResponse = deleteAccountErrorSchema.parse({ error: "Unauthorized" })
      return NextResponse.json(errorResponse, { status: 401 })
    }
    
    // Delete all user data using service role client (bypasses RLS)
    await deleteAccount(user.id, supabase)
    
    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      throw deleteError
    }
    
    const successResponse = deleteAccountSuccessSchema.parse({ success: true })
    return NextResponse.json(successResponse)
  } catch (error) {
    console.error("Account deletion error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to delete account"
    const errorResponse = deleteAccountErrorSchema.parse({ error: errorMessage })
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
