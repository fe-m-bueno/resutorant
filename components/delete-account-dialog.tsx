"use client"

import { useState } from "react"
import { Copy, Trash2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

const REQUIRED_TEXT = "Excluir minha conta"

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REQUIRED_TEXT)
      toast.success("Texto copiado para a área de transferência")
    } catch {
      toast.error("Erro ao copiar texto")
    }
  }

  const handleDelete = async () => {
    if (confirmationText !== REQUIRED_TEXT) {
      toast.error("Texto de confirmação incorreto")
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch("/api/delete-account", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      toast.success("Conta excluída com sucesso")
      window.location.href = "/"
    } catch (error) {
      console.error("Delete account error:", error)
      toast.error("Erro ao excluir conta. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="w-full gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir conta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir conta permanentemente?</DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos,
            incluindo perfil, avaliações, listas e restaurantes criados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Para confirmar, digite <strong>"{REQUIRED_TEXT}"</strong> abaixo:
          </p>
          
          <div className="flex gap-2">
            <Input
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={REQUIRED_TEXT}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copiar texto"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmationText !== REQUIRED_TEXT || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir conta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
