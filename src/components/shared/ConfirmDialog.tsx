import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  dialogState: { message: string } | null
  handleConfirm: () => void
  handleCancel: () => void
}

export function ConfirmDialog({ dialogState, handleConfirm, handleCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={dialogState !== null} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Подтверждение</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600">{dialogState?.message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Отмена
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
