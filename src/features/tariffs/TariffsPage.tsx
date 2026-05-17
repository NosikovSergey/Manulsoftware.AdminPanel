import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTariffs, updateTariff } from '@/api/tariffs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TARIFF_DURATION_LABEL } from '@/lib/formatters'
import type { Tariff } from '@/types'

type PatchPayload = Parameters<typeof updateTariff>[1]

interface TariffRowProps {
  tariff: Tariff
  onPatch: (id: number, patch: PatchPayload) => void
  isPending: boolean
}

function TariffRow({ tariff, onPatch, isPending }: TariffRowProps) {
  const [editingPrice, setEditingPrice] = useState(false)
  const [priceValue, setPriceValue] = useState(String(tariff.price))

  useEffect(() => {
    if (!editingPrice) setPriceValue(String(tariff.price))
  }, [tariff.price, editingPrice])

  function handlePriceSave() {
    const parsed = Number(priceValue)
    if (!Number.isNaN(parsed) && parsed > 0) {
      onPatch(tariff.id, { price: parsed })
    }
    setEditingPrice(false)
  }

  function handlePriceCancel() {
    setPriceValue(String(tariff.price))
    setEditingPrice(false)
  }

  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handlePriceSave()
    if (e.key === 'Escape') handlePriceCancel()
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {TARIFF_DURATION_LABEL[tariff.duration] ?? tariff.duration}
      </TableCell>
      <TableCell>
        {editingPrice ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              className="h-8 w-28 tabular-nums"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onKeyDown={handlePriceKeyDown}
              disabled={isPending}
            />
            <span className="text-sm text-gray-500">₽</span>
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handlePriceSave} disabled={isPending}>
              Сохранить
            </Button>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handlePriceCancel}>
              Отмена
            </Button>
          </div>
        ) : (
          <button
            className="rounded px-1 py-0.5 text-sm tabular-nums hover:bg-gray-100"
            onClick={() => setEditingPrice(true)}
          >
            {tariff.price} ₽
          </button>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={tariff.isBestChoice}
          disabled={isPending}
          onCheckedChange={(checked) => onPatch(tariff.id, { isBestChoice: checked })}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={tariff.isEnabled}
          disabled={isPending}
          onCheckedChange={(checked) => onPatch(tariff.id, { isEnabled: checked })}
        />
      </TableCell>
    </TableRow>
  )
}

export function TariffsPage() {
  const queryClient = useQueryClient()

  const { data: tariffs, isLoading, isError } = useQuery({
    queryKey: ['tariffs'],
    queryFn: getTariffs,
  })

  const mutation = useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: PatchPayload }) => updateTariff(id, patch),
    onSuccess: (updated, { patch }) => {
      queryClient.setQueryData(['tariffs'], (old: Tariff[] | undefined) => {
        if (!old) return old
        return old.map((t) => {
          if (t.id === updated.id) return updated
          if (patch.isBestChoice === true) return { ...t, isBestChoice: false }
          return t
        })
      })
    },
  })

  function handlePatch(id: number, patch: PatchPayload) {
    mutation.mutate({ id, patch })
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !tariffs) {
    return <div className="text-sm text-red-600">Не удалось загрузить тарифы</div>
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Тарифы</h1>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тариф</TableHead>
              <TableHead>Цена</TableHead>
              <TableHead>Лучший выбор</TableHead>
              <TableHead>Активен</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tariffs.map((tariff) => (
              <TariffRow
                key={tariff.id}
                tariff={tariff}
                onPatch={handlePatch}
                isPending={mutation.isPending}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
