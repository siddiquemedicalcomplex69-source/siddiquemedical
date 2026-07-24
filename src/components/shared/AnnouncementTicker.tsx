export function AnnouncementTicker({ text }: { text: string }) {
  if (!text) return null;
  
  // Repeat the text so the marquee looks continuous even on wide screens
  const line = Array(5).fill(text).join("   •   ");
  
  return (
    <div className="relative overflow-hidden bg-[#0b1f3a] text-white">
      <div className="ticker-track flex whitespace-nowrap py-2 text-xs tracking-wide">
        <span className="px-8">{line}</span>
        <span className="px-8" aria-hidden>{line}</span>
        <span className="px-8" aria-hidden>{line}</span>
      </div>
    </div>
  );
}
