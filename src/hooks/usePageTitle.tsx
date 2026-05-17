import { createContext, useContext, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export interface BreadcrumbItem {
  label: string
  to?: string
}

interface PageTitleContextType {
  titles: Record<string, string>
  setTitle: (pathname: string, title: string) => void
  breadcrumbChain: BreadcrumbItem[] | null
  setBreadcrumbChain: (chain: BreadcrumbItem[] | null) => void
}

const PageTitleContext = createContext<PageTitleContextType>({
  titles: {},
  setTitle: () => {},
  breadcrumbChain: null,
  setBreadcrumbChain: () => {},
})

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [titles, setTitles] = useState<Record<string, string>>({})
  const [breadcrumbChain, setBreadcrumbChain] = useState<BreadcrumbItem[] | null>(null)

  function setTitle(pathname: string, title: string) {
    setTitles((prev) => {
      if (prev[pathname] === title) return prev
      return { ...prev, [pathname]: title }
    })
  }

  return (
    <PageTitleContext.Provider value={{ titles, setTitle, breadcrumbChain, setBreadcrumbChain }}>
      {children}
    </PageTitleContext.Provider>
  )
}

export function usePageTitleContext() {
  return useContext(PageTitleContext)
}

/** Устанавливает динамическое имя для текущего роута в хлебных крошках */
export function usePageTitle(title: string | undefined) {
  const { setTitle } = usePageTitleContext()
  const { pathname } = useLocation()

  useEffect(() => {
    if (title) setTitle(pathname, title)
  }, [title, pathname, setTitle])
}

/** Полностью переопределяет цепочку хлебных крошек — для страниц вне иерархии роутов */
export function useBreadcrumbChain(chain: BreadcrumbItem[] | null) {
  const { setBreadcrumbChain } = usePageTitleContext()

  useEffect(() => {
    if (chain) setBreadcrumbChain(chain)
    return () => setBreadcrumbChain(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain?.map((c) => c.label).join('|')])
}
