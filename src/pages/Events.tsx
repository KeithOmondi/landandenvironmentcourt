// src/features/events/Events.tsx
//
// Public events calendar.
//
//   - Lists published events (fetchPublishedEvents), paginated.
//   - Category filter chips drive the server-side `category` param.
//   - Phase (Upcoming / Ongoing / Completed) is derived from
//     startsAt / endsAt at render time — see `eventPhase` in
//     events.types.ts and its mirror in the slice.
//   - Displays event images with fallback covers.
//   - "Share" copies a link; "Register / Details" opens full detail modal.

import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaGavel,
  FaArrowRight,
  FaFilter,
  FaCheckCircle,
  FaShareAlt,
  FaTimes,
} from 'react-icons/fa';
import {
  fetchPublishedEvents,
  EVENT_CATEGORIES,
  type EventCategory,
  type PublicEventSummary,
} from '../store/slices/eventsSlice';
import type { AppDispatch, RootState } from '../store/store';

// ─── Phase ───────────────────────────────────────────────────────────────────

type Phase = 'Upcoming' | 'Ongoing' | 'Completed';

const eventPhase = (
  startsAt: string,
  endsAt: string,
  now: Date = new Date(),
): Phase => {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (now < start) return 'Upcoming';
  if (now > end) return 'Completed';
  return 'Ongoing';
};

// ─── Formatting ──────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso)
    .toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
    .toUpperCase();

const formatTimeRange = (startsAt: string, endsAt: string) => {
  const opts: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };
  const start = new Date(startsAt).toLocaleTimeString(undefined, opts);
  const end = new Date(endsAt).toLocaleTimeString(undefined, opts);
  return `${start} - ${end}`;
};

type CardEvent = PublicEventSummary & { phase: Phase };

// ─── Page Component ──────────────────────────────────────────────────────────

const Events: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { publicItems, publicTotal, isLoadingPublic, publicError } =
    useSelector((s: RootState) => s.events);

  const [activeCategory, setActiveCategory] = useState<'All' | EventCategory>(
    'All',
  );
  const [page, setPage] = useState(1);
  const limit = 12;

  // Selected event for the Modal
  const [selectedEvent, setSelectedEvent] = useState<CardEvent | null>(null);

  useEffect(() => {
    dispatch(
      fetchPublishedEvents({
        page,
        limit,
        category: activeCategory === 'All' ? undefined : activeCategory,
      }),
    );
  }, [dispatch, page, activeCategory]);

  const enriched = useMemo(
    () =>
      publicItems.map((item) => ({
        ...item,
        phase: eventPhase(item.startsAt, item.endsAt),
      })),
    [publicItems],
  );

  const featuredEvent = useMemo(
    () => enriched.find((e) => e.isFeatured) ?? null,
    [enriched],
  );

  const orderedItems = useMemo(() => {
    if (!featuredEvent) return enriched;
    return [
      featuredEvent,
      ...enriched.filter((e) => e.id !== featuredEvent.id),
    ];
  }, [enriched, featuredEvent]);

  const totalPages = Math.max(1, Math.ceil(publicTotal / limit));

  const categories: Array<'All' | EventCategory> = [
    'All',
    ...EVENT_CATEGORIES,
  ];

  const handleCategoryChange = (cat: 'All' | EventCategory) => {
    if (cat === activeCategory) return;
    setActiveCategory(cat);
    setPage(1);
  };

  const handleRetry = () => {
    dispatch(
      fetchPublishedEvents({
        page,
        limit,
        category: activeCategory === 'All' ? undefined : activeCategory,
      }),
    );
  };

  return (
    <section className="relative bg-slate-50 py-20 text-slate-800 overflow-hidden border-t border-slate-200">
      <div className="absolute top-1/3 left-0 -translate-y-1/2 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#061e14]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 font-medium mb-3">
              <FaGavel className="text-[#C69A33]" />
              <span className="font-semibold uppercase tracking-wider">
                Judicial Calendar
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
              Court <span className="text-[#061e14]">Events & Forums</span>
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Stay updated with upcoming public forums, stakeholder engagements,
            judicial training sessions, and legal conferences hosted by the
            Environment and Land Court.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <FaFilter className="text-[#C69A33]" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                activeCategory === cat
                  ? 'bg-[#061e14] text-[#D4AF37] shadow-md border border-[#C69A33]/40'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-[#C69A33] hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading / Error / Empty States */}
        {isLoadingPublic && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm text-slate-500">Loading events…</p>
          </div>
        )}

        {!isLoadingPublic && publicError && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaGavel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">{publicError}</p>
            <button
              onClick={handleRetry}
              className="text-xs text-[#C69A33] font-bold font-mono underline"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoadingPublic && !publicError && orderedItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <FaGavel className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-slate-600 font-medium">
              No events found
              {activeCategory !== 'All' ? ' in this category' : ''}.
            </p>
            {activeCategory !== 'All' && (
              <button
                onClick={() => handleCategoryChange('All')}
                className="text-xs text-[#C69A33] font-bold font-mono underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}

        {/* Events Grid */}
        {!isLoadingPublic && !publicError && orderedItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {orderedItems.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={() => setSelectedEvent(event)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs font-mono text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </section>
  );
};

// ─── Card Component ──────────────────────────────────────────────────────────

interface EventCardProps {
  event: CardEvent;
  onSelect: () => void;
}

const EventCard = ({ event, onSelect }: EventCardProps) => {
  const isCompleted = event.phase === 'Completed';

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/events`;
    const text = `${event.title} — ${url}`;
    if (navigator.share) {
      void navigator.share({ title: event.title, url });
    } else if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white border transition-all duration-500 hover:shadow-2xl overflow-hidden ${
        event.isFeatured
          ? 'lg:col-span-2 border-[#C69A33] shadow-lg'
          : 'border-slate-200 shadow-sm'
      }`}
    >
      {/* Accent Bar */}
      <div
        className={`h-1.5 w-full ${
          isCompleted
            ? 'bg-slate-300'
            : 'bg-gradient-to-r from-[#061e14] via-[#C69A33] to-[#061e14]'
        }`}
      />

      <div className={`flex flex-col ${event.isFeatured ? 'lg:flex-row' : ''}`}>
        {/* Media Container */}
        <div
          className={`relative overflow-hidden bg-slate-900 cursor-pointer ${
            event.isFeatured
              ? 'lg:w-5/12 h-64 lg:h-auto shrink-0'
              : 'w-full h-48 sm:h-52'
          }`}
          onClick={onSelect}
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#061e14] to-slate-900 p-6 text-center">
              <FaGavel className="h-12 w-12 text-[#C69A33]/40" />
            </div>
          )}

          {/* Badges Overlaid on Media */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-xs font-mono uppercase tracking-wider font-semibold text-white shadow-md">
              {event.category}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-md ${
                isCompleted
                  ? 'bg-slate-900/80 text-slate-300 border border-slate-700'
                  : 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {isCompleted ? (
                <FaCheckCircle />
              ) : (
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
              {event.phase}
            </span>
          </div>
        </div>

        {/* Card Content Area */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <h3
              onClick={onSelect}
              className={`font-serif font-bold text-slate-900 leading-tight group-hover:text-[#061e14] transition-colors cursor-pointer ${
                event.isFeatured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}
            >
              {event.title}
            </h3>

            {/* Event Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <FaCalendarAlt className="text-[#C69A33] shrink-0" />
                <span className="font-semibold truncate">
                  {formatDate(event.startsAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <FaClock className="text-[#C69A33] shrink-0" />
                <span className="truncate">
                  {formatTimeRange(event.startsAt, event.endsAt)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <FaMapMarkerAlt className="text-[#C69A33] shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>

            {/* Summary */}
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
              {event.summary}
            </p>
          </div>

          {/* Action Footer */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100 mt-6">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#061e14] transition-colors"
            >
              <FaShareAlt /> Share Event
            </button>

            <button
              onClick={onSelect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#061e14] hover:bg-[#0a2e1f] text-[#D4AF37] text-xs font-bold transition-all shadow-md group/btn"
            >
              <span>{isCompleted ? 'View Minutes' : 'Register / Details'}</span>
              <FaArrowRight className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Modal Component ─────────────────────────────────────────────────────────

interface EventDetailsModalProps {
  event: CardEvent;
  onClose: () => void;
}

const EventDetailsModal = ({ event, onClose }: EventDetailsModalProps) => {
  const isCompleted = event.phase === 'Completed';

  // Prevent background scrolling when modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#061e14] text-white">
          <div className="flex items-center gap-2">
            <FaGavel className="text-[#D4AF37]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#D4AF37]">
              {event.category} Event Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Optional Image Header */}
          {event.imageUrl && (
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-slate-900">
              <img
                src={event.imageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title & Phase */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                  isCompleted
                    ? 'bg-slate-100 text-slate-600 border border-slate-200'
                    : 'bg-emerald-900/10 text-[#061e14] border border-emerald-900/20'
                }`}
              >
                {isCompleted ? (
                  <FaCheckCircle />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                )}
                {event.phase}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {event.title}
            </h2>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
            <div className="flex items-start gap-3">
              <FaCalendarAlt className="text-[#C69A33] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Date
                </p>
                <p className="font-semibold text-slate-800">
                  {formatDate(event.startsAt)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FaClock className="text-[#C69A33] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Time
                </p>
                <p className="font-semibold text-slate-800">
                  {formatTimeRange(event.startsAt, event.endsAt)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <FaMapMarkerAlt className="text-[#C69A33] mt-1 shrink-0" />
              <div>
                <p className="text-xs font-mono uppercase text-slate-400 font-bold">
                  Location & Venue
                </p>
                <p className="font-semibold text-slate-800">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Full Summary Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">
              About This Event
            </h4>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              {event.summary}
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>

          <button
            onClick={() => {
              // Placeholder for registration action or link navigation
              alert(
                isCompleted
                  ? 'Minutes for this event will be published shortly.'
                  : 'Registration feature coming soon!',
              );
            }}
            className="px-6 py-2.5 rounded-xl bg-[#061e14] hover:bg-[#0a2e1f] text-[#D4AF37] font-bold text-xs shadow-md transition-colors"
          >
            {isCompleted ? 'Download Minutes' : 'Confirm Registration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Events;