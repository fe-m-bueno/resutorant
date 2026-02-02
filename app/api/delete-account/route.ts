import { createServiceClient } from "@/lib/supabase/service"
import { deleteAccount } from "@/lib/queries"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createServiceClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Delete all user data
    await deleteAccount(user.id)
    
    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      throw deleteError
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" }, 
      { status: 500 }
    )
  }
}
