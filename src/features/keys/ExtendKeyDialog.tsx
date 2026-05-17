import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TARIFF_DURATION_OPTIONS } from '@/lib/constants'
import type { TariffDuration } from '@/types'

interface ExtendKeyDialogProps {
  open: boolean
  isPending: boolean
  onClose: () => void
  onConfirm: (duration: TariffDuration) => void
}

export function ExtendKeyDialog({ open, isPending, onClose, onConfirm }: ExtendKeyDialogProps) {
  const [duration, setDuration] = useState<TariffDuration>('OneMonth')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Продлить бесплатно</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Деньги с баланса не списываются, новый заказ не создаётся.
          </p>
          <Select value={duration} onValueChange={(v) => setDuration(v as TariffDuration)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TARIFF_DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Отмена
          </Button>
          <Button onClick={() => onConfirm(duration)} disabled={isPending}>
            {isPending ? 'Продление...' : 'Подтвердить'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
