'use client'

import Link from 'next/link'
import type { Season } from '@/lib/types'

type Props = {
  seasons: Pick<Season, 'year' | 'is_current'>[]
  activeYear: number
  basePath: '/leaderboard' | '/results' | '/schedule'
}

export default function SeasonNav({ seasons, activeYear, basePath }: Props) {
  if (seasons.length <= 1) return null

  return (
    <div className="flex items-center gap-1 text-sm">
      {seasons.map((s, i) => {
        const href = s.is_current ? basePath : `${basePath}/${s.year}`
        const isActive = s.year === activeYear
        return (
          <span key={s.year} className="flex items-center gap-1">
            {i > 0 && <span className="text-fairway/20">·</span>}
            {isActive ? (
              <span className="font-bold text-fairway border-b-2 border-gold pb-0.5">{s.year}</span>
            ) : (
              <Link href={href} className="text-fairway/45 hover:text-fairway/80 transition-colors">
                {s.year}
              </Link>
            )}
          </span>
        )
      })}
    </div>
  )
}
