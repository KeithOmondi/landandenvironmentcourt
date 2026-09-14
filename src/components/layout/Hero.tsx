// src/components/home/Hero.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  FaSearch,
  FaGavel,
  FaVideo,
  FaFileAlt,
  FaChevronRight,
  FaBalanceScale,
  FaUniversity,
  FaChevronLeft,
  FaBalanceScale as FaFallbackIcon,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchLiveHero, type HeroSlide, type HeroBadge } from '../../store/slices/heroSlice';

// ─── Icon registry ───────────────────────────────────────────────────────────
//
// Badges carry an icon *name* (e.g. "FaGavel") so the backend stays
// decoupled from react-icons. The registry maps names to components.
// Unknown names fall back to FaBalanceScale, so a typo on the backend
// doesn't crash the page.

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FaGavel,
  FaVideo,
  FaUniversity,
  FaBalanceScale,
};

const resolveIcon = (name: string) => ICONS[name] ?? FaFallbackIcon;

// ─── Slide rendering ─────────────────────────────────────────────────────────

const SlideLayer = ({
  slide,
  isActive,
}: {
  slide: HeroSlide;
  isActive: boolean;
}) => (
  <div
    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
      isActive ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
    } transition-transform duration-[6000ms]`}
  >
    <img
      src={slide.imageUrl}
      alt={slide.altText ?? ''}
      className="w-full h-full object-cover"
    />
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

const Hero: React.FC = () => {
  const dispatch = useAppDispatch();
  const { hero, isLoadingHero, heroError } = useAppSelector((s) => s.hero);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Load the live Hero on mount. The public site never writes to the
  // Hero — the admin flow is what produces new versions. This is the
  // one legitimate effect here: it synchronizes React with an external
  // system (the API) by kicking off a request.
  useEffect(() => {
    dispatch(fetchLiveHero());
  }, [dispatch]);

  // Slides, filtered to active only, sorted by display order.
  const slides = useMemo(
    () =>
      (hero?.slides ?? [])
        .filter((s) => s.isActive)
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [hero?.slides],
  );

  // Badges, same treatment.
  const badges = useMemo(
    () =>
      (hero?.badges ?? [])
        .filter((b) => b.isActive)
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [hero?.badges],
  );

  // ── Render-time state adjustments ──────────────────────────────────────
  //
  // These two used to live in `useEffect([...])` blocks, but they're not
  // synchronizing with anything external — they're deriving local state
  // from `hero`/`slides`, which are already React state. Calling setState
  // from inside an effect for that meant an extra render → commit →
  // effect → setState → re-render round-trip on every load. Doing the
  // adjustment during render instead lets React bail out and re-render
  // immediately, before anything is painted.
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)

  // Default the active tab to the first configured tab, once we know it.
  if (!activeTab && hero?.searchCard.tabs.length) {
    setActiveTab(hero.searchCard.tabs[0].key);
  }

  // Clamp the index if the slide list shrinks (e.g. an admin deactivates
  // a slide and the public page picks up the change on next load).
  if (currentSlide >= slides.length && slides.length > 0) {
    setCurrentSlide(0);
  }

  // Auto-advance slides. Only runs when there is more than one. This one
  // stays a real effect — it subscribes to an external timer (setInterval)
  // and cleans it up on unmount, which is exactly what effects are for.
  useEffect(() => {
    if (slides.length <= 1) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [slides.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));

  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    console.log(`Searching [${activeTab}]: ${searchQuery}`);
  };

  // The active tab's config, for placeholder + CTA label.
  const activeTabConfig = hero?.searchCard.tabs.find((t) => t.key === activeTab);

  // ─── Loading / error states ────────────────────────────────────────────────

  if (isLoadingHero && !hero) {
    return (
      <div className="relative bg-[#061e14] text-white min-h-[600px] flex items-center justify-center">
        <div className="text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (heroError && !hero) {
    // The public site should still render *something* if the API is
    // down. A quiet fallback beats a broken page.
    return (
      <div className="relative bg-[#061e14] text-white min-h-[600px] flex items-center justify-center">
        <div className="text-sm text-red-300">{heroError}</div>
      </div>
    );
  }

  if (!hero) return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative bg-[#061e14] text-white overflow-hidden">
      <div className="relative flex items-center pt-12 pb-12 sm:pt-16 sm:pb-16">
        {/* Background slider */}
        <div className="absolute inset-0 z-0">
          {slides.map((slide) => (
            <SlideLayer
              key={slide.id}
              slide={slide}
              isActive={slide.displayOrder === slides[currentSlide]?.displayOrder}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#061e14] via-[#061e14]/95 to-[#061e14]/70" />
        </div>

        {/* Watermark */}
        <FaBalanceScale className="absolute right-[-5%] bottom-[-10%] text-[480px] text-white/[0.02] pointer-events-none select-none z-10" />

        {/* Main container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-[#C69A33]/30 text-xs sm:text-sm text-[#C69A33] backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium tracking-wide">{hero.badge}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]">
                {hero.headline}
              </h1>

              <p className="text-gray-300 font-serif text-base sm:text-lg max-w-2xl font-light leading-relaxed">
                {hero.subheadline}
              </p>

              {/* Quick badges */}
              {badges.length > 0 && (
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-white/10">
                  {badges.map((badge: HeroBadge) => {
                    const Icon = resolveIcon(badge.icon);
                    return (
                      <div key={badge.id} className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[#C69A33] backdrop-blur-md">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-gray-400">
                            {badge.label}
                          </p>
                          <p className="text-sm font-semibold text-white">
                            {badge.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right column: search card */}
            <div className="lg:col-span-5">
              <div className="bg-[#0b281c]/80 backdrop-blur-xl border border-[#C69A33]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    {hero.searchCard.title}
                  </h2>
                  <span className="text-[10px] bg-[#C69A33]/20 border border-[#C69A33]/40 text-[#D4AF37] px-2.5 py-1 rounded-full font-mono uppercase tracking-widest">
                    {hero.searchCard.selfServiceBadge}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-6">
                  {hero.searchCard.subtitle}
                </p>

                {/* Tabs */}
                {hero.searchCard.tabs.length > 0 && (
                  <div
                    className={`grid gap-1 bg-[#04140d] p-1 rounded-xl mb-6 text-xs font-medium border border-white/5`}
                    style={{
                      gridTemplateColumns: `repeat(${hero.searchCard.tabs.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {hero.searchCard.tabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`py-2.5 px-3 rounded-lg transition-all ${
                          activeTab === tab.key
                            ? 'bg-[#C69A33] text-[#061e14] font-bold shadow-md'
                            : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Search form */}
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={activeTabConfig?.placeholder ?? 'Search…'}
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white/95 text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#C69A33]"
                    />
                    <FaSearch className="absolute left-3.5 top-4 text-gray-400" />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-[#C69A33] to-[#D4AF37] hover:brightness-110 text-[#061e14] font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                  >
                    <span>{activeTabConfig?.ctaLabel ?? 'Search'}</span>
                    <FaChevronRight className="text-xs group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-300">
                  <span>{hero.searchCard.documentsLabel}</span>
                  <Link
                    to={hero.searchCard.documentsHref}
                    className="text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <FaFileAlt className="text-xs" />
                    {hero.searchCard.documentsLinkLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Slider controls */}
          {slides.length > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {slides.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentSlide
                        ? 'w-8 bg-[#C69A33]'
                        : 'w-2 bg-white/30 hover:bg-white/60'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={prevSlide}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs backdrop-blur-md"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition text-xs backdrop-blur-md"
                >
                  <FaChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;