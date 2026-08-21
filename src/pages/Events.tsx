import React, { useState } from 'react';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaClock, 
  FaGavel, 
  FaArrowRight, 
  FaFilter,
  FaCheckCircle,
  FaShareAlt
} from 'react-icons/fa';

// Data for ELC Events
const eventsData = [
  {
    id: 1,
    title: 'ELC Stakeholders Conference 2026',
    category: 'Conference',
    date: 'SEP 15, 2026',
    time: '09:00 AM - 04:00 PM',
    location: 'KICC, Nairobi',
    status: 'Upcoming',
    description: 'A national forum focusing on environmental justice, land dispute resolutions, and digitizing land registries under STAJ.',
    isFeatured: true,
  },
  {
    id: 2,
    title: 'Public Baraza on Land Rights & E-Filing',
    category: 'Public Outreach',
    date: 'SEP 28, 2026',
    time: '10:00 AM - 01:00 PM',
    location: 'Nakuru ELC Station',
    status: 'Upcoming',
    description: 'Community sensitization session on utilizing the Judiciary E-Filing portal for land ownership disputes.',
    isFeatured: false,
  },
  {
    id: 3,
    title: 'Environmental Law Refresher Course',
    category: 'Judicial Training',
    date: 'OCT 12, 2026',
    time: '08:30 AM - 03:30 PM',
    location: 'Judicial Training Institute (JTI)',
    status: 'Upcoming',
    description: 'Specialized capacity building for ELC Judges and Registrars on climate change litigation and environmental norms.',
    isFeatured: false,
  },
  {
    id: 4,
    title: 'Launch of the Revised ELC Bench Book',
    category: 'Publication',
    date: 'AUG 05, 2026',
    time: '10:00 AM - 12:30 PM',
    location: 'Milimani Law Courts',
    status: 'Completed',
    description: 'Official unveiling of the updated ELC Bench Book guiding standard procedures in land and environment cases.',
    isFeatured: false,
  },
];

const categories = ['All', 'Conference', 'Public Outreach', 'Judicial Training', 'Publication'];

const Events: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredEvents = activeCategory === 'All'
    ? eventsData
    : eventsData.filter(event => event.category === activeCategory);

  return (
    <section className="relative bg-slate-50 py-20 text-slate-800 overflow-hidden border-t border-slate-200">
      {/* Background Accent Glows */}
      <div className="absolute top-1/3 left-0 -translate-y-1/2 w-96 h-96 bg-[#C69A33]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#061e14]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/10 border border-emerald-900/20 text-xs text-emerald-900 font-medium mb-3">
              <FaGavel className="text-[#C69A33]" />
              <span className="font-semibold uppercase tracking-wider">Judicial Calendar</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight">
              Court <span className="text-[#061e14]">Events & Forums</span>
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Stay updated with upcoming public forums, stakeholder engagements, judicial training sessions, and legal conferences hosted by the Environment and Land Court.
          </p>
        </div>

        {/* ================= CATEGORY FILTERS ================= */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
            <FaFilter className="text-[#C69A33]" /> Filter:
          </span>
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveCategory(cat)}
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

        {/* ================= EVENTS GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className={`group relative flex flex-col justify-between rounded-2xl bg-white border transition-all duration-500 hover:shadow-2xl overflow-hidden ${
                event.isFeatured
                  ? 'lg:col-span-2 border-[#C69A33] shadow-lg'
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Top Highlight Accent Bar */}
              <div 
                className={`h-1.5 w-full ${
                  event.status === 'Completed' 
                    ? 'bg-slate-300' 
                    : 'bg-gradient-to-r from-[#061e14] via-[#C69A33] to-[#061e14]'
                }`} 
              />

              <div className="p-6 sm:p-8 space-y-6">
                
                {/* Meta Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono uppercase tracking-wider font-semibold text-slate-700">
                    {event.category}
                  </span>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                    event.status === 'Completed'
                      ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : 'bg-emerald-900/10 text-[#061e14] border border-emerald-900/20'
                  }`}>
                    {event.status === 'Completed' ? <FaCheckCircle /> : <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />}
                    {event.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className={`font-serif font-bold text-slate-900 leading-tight group-hover:text-[#061e14] transition-colors ${
                  event.isFeatured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}>
                  {event.title}
                </h3>

                {/* Event Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 px-4 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaCalendarAlt className="text-[#C69A33]" />
                    <span className="font-semibold">{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaClock className="text-[#C69A33]" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <FaMapMarkerAlt className="text-[#C69A33]" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-600 text-sm leading-relaxed">
                  {event.description}
                </p>

              </div>

              {/* Card Action Footer */}
              <div className="p-6 sm:p-8 pt-0 flex items-center justify-between border-t border-slate-100 mt-4">
                <button 
                  onClick={() => alert(`Shared ${event.title}`)} 
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#061e14] transition-colors"
                >
                  <FaShareAlt /> Share Event
                </button>

                <button
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#061e14] hover:bg-[#0a2e1f] text-[#D4AF37] text-xs font-bold transition-all shadow-md group/btn"
                >
                  <span>{event.status === 'Completed' ? 'View Minutes' : 'Register / Details'}</span>
                  <FaArrowRight className="w-3 h-3 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Events;