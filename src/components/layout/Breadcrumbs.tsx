import { Link, useMatches } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { usePageTitleContext } from '@/hooks/usePageTitle'
import type { BreadcrumbItem } from '@/hooks/usePageTitle'

export interface BreadcrumbHandle {
  breadcrumb: string
}

function BreadcrumbTrail({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i < items.length - 1 ? (
            <>
              {item.to ? (
                <Link to={item.to} className="hover:text-gray-900">
                  {item.label}
                </Link>
              ) : (
                <span>{item.label}</span>
              )}
              <ChevronRight className="h-3 w-3" />
            </>
          ) : (
            <span className="font-medium text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Breadcrumbs() {
  const matches = useMatches()
  const { titles, breadcrumbChain } = usePageTitleContext()

  // Полное переопределение цепочки (для страниц вне иерархии роутов)
  if (breadcrumbChain) {
    return <BreadcrumbTrail items={breadcrumbChain} />
  }

  // Стандартный режим — из роутов с handle.breadcrumb
  const crumbs: BreadcrumbItem[] = matches
    .filter((m) => Boolean((m.handle as BreadcrumbHandle | undefined)?.breadcrumb))
    .map((m) => {
      const handle = m.handle as BreadcrumbHandle
      return {
        label: titles[m.pathname] ?? handle.breadcrumb,
        to: m.pathname,
      }
    })

  if (crumbs.length === 0) return null

  return <BreadcrumbTrail items={crumbs} />
}
