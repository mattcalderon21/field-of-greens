export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-fairway-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-cream/70 font-sans text-sm tracking-widest uppercase">
          Loading Leaderboard…
        </p>
      </div>
    </div>
  )
}
