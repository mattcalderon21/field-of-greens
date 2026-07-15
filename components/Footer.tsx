import { getCurrentSeason } from '@/lib/seasons'
import { formatDate } from '@/lib/utils'

export default async function Footer() {
  const season = await getCurrentSeason()

  return (
    <footer className="bg-fairway-dark text-cream/50 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="font-display text-cream/70 text-lg mb-1">The Field of Greens</p>
        <p className="text-sm italic mb-3">&ldquo;If you pick him, points will come.&rdquo;</p>
        {season && (
          <p className="text-xs">
            {season.year} Season · {formatDate(season.start_date)} – {formatDate(season.end_date)}
          </p>
        )}
      </div>
    </footer>
  )
}
