import ky from 'ky'

export const api = ky.create({
  prefixUrl: (import.meta.env.VITE_API_URL as string) || '/',
  credentials: 'include',
  hooks: {
    afterResponse: [
      async (_req, _opts, response) => {
        if (response.status === 401 && window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      },
    ],
  },
})
