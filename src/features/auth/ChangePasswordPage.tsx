import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { HTTPError } from 'ky'
import { changePassword } from '@/api/auth'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z
      .string()
      .min(8, 'Минимум 8 символов')
      .regex(/[A-Z]/, 'Минимум одна заглавная буква')
      .regex(/[0-9]/, 'Минимум одна цифра'),
    confirmPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function ChangePasswordPage() {
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setServerError(null)
    setSuccess(false)
    try {
      await changePassword(data.currentPassword, data.newPassword)
      setSuccess(true)
      reset()
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.json<{ error: string }>()
        setServerError(body.error)
      } else {
        setServerError('Произошла ошибка. Попробуйте ещё раз.')
      }
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Сменить пароль</h1>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Пароль успешно изменён.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Текущий пароль
          </label>
          <input
            {...register('currentPassword')}
            type="password"
            autoComplete="current-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
          />
          {errors.currentPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Новый пароль
          </label>
          <input
            {...register('newPassword')}
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
          />
          {errors.newPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Минимум 8 символов, одна заглавная буква, одна цифра
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Повторите новый пароль
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300"
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {serverError && (
          <p className="text-sm text-red-600">{serverError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
