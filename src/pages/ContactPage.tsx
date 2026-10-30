import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import {
  submitContactMessage,
  clearSubmitMessageState,
} from '../store/slices/contactSlice';
import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaBuilding,
  FaSearch,
  FaTree,
  FaTimes,
} from 'react-icons/fa';

interface StationContact {
  station: string;
  poBox: string;
  phone: string;
  email: string;
  altEmail?: string;
}

// ─── ELC station registry ────────────────────────────────────────────────────
// Sourced from the court station submissions. Where a station supplied more
// than one email address, the primary one goes in `email` and the secondary
// in `altEmail`. Phone numbers are rendered as given (spacing normalised).
//
// `poBox` is left as an em-dash for stations that haven't supplied a postal
// address yet, so the layout stays consistent and it's obvious what's missing.

const ELC_STATIONS: StationContact[] = [
  // ── Principal / apex registries ───────────────────────────────────────────
  {
    station: 'Milimani ELC Registry (Nairobi)',
    poBox: 'P.O. Box 30041-00100, Nairobi',
    phone: '0730 181 192',
    email: 'milimani.orelc@court.go.ke',
  },
  {
    station: 'Milimani ELC Appeals Division',
    poBox: 'P.O. Box 30041-00100, Nairobi',
    phone: '—',
    email: 'milimani.elcappeals@court.go.ke',
  },
  {
    station: 'Mombasa ELC Registry',
    poBox: 'P.O. Box 90142-80100, Mombasa',
    phone: '0730 181 230 / 0730 188 887',
    email: 'elcmombasa@court.go.ke',
    altEmail: 'elcmombasa@gmail.com',
  },
  {
    station: 'Kisumu ELC Registry',
    poBox: 'P.O. Box 116-40100, Kisumu',
    phone: '0788 320 154',
    email: 'elcourtkisumu@court.go.ke',
    altEmail: 'elcourtkisumu@gmail.com',
  },
  {
    station: 'Nakuru ELC Registry',
    poBox: 'P.O. Box 61-20100, Nakuru',
    phone: '—', // No official telephone number supplied
    email: 'elcnakuru@gmail.com',
  },
  {
    station: 'Eldoret ELC Registry',
    poBox: 'P.O. Box 144-30100, Eldoret',
    phone: '—',
    email: 'eldoretelc@court.go.ke',
  },
  {
    station: 'Nyeri ELC Registry',
    poBox: 'P.O. Box 298-10100, Nyeri',
    phone: '0752 052 443',
    email: 'nyericourt@court.go.ke',
    altEmail: 'nyerielc2020@gmail.com',
  },

  // ── Station registries (alphabetical) ─────────────────────────────────────
  {
    station: 'Bungoma ELC',
    poBox: '—',
    phone: '0113 460 658',
    email: 'elcbungoma@court.co.ke',
  },
  {
    station: 'Busia Law Courts',
    poBox: '—',
    phone: '0795 587 083',
    email: 'elcbusia@gmail.com',
  },
  {
    station: 'Chuka ELC',
    poBox: '—',
    phone: '—', // No phone number supplied
    email: 'elcchuka@court.go.ke',
  },
  {
    station: 'Embu ELC',
    poBox: '—',
    phone: '0758 971 436', // Airtel office line
    email: 'elcembu@court.go.ke',
  },
  {
    station: 'Garissa ELC',
    poBox: '—',
    phone: '0702 687 542',
    email: 'garissacourt@court.go.ke',
  },
  {
    station: 'Homa Bay ELC',
    poBox: '—',
    phone: '0710 622 801',
    email: 'homabayelc@court.go.ke',
  },
  {
    station: 'Isiolo ELC',
    poBox: '—',
    phone: '0704 410 197',
    email: 'elcisiolo@court.go.ke',
  },
  {
    station: 'Iten ELC',
    poBox: '—',
    phone: '0748 201 457',
    email: 'elciten@court.go.ke',
  },
  {
    station: 'Kajiado ELC',
    poBox: '—',
    phone: '0110 832 875',
    email: 'kajiadoelccourts@gmail.com',
  },
  {
    station: 'Kakamega ELC',
    poBox: '—',
    phone: '—',
    email: 'elckakamega@court.go.ke',
    altEmail: 'elckakamega@gmail.com',
  },
  {
    station: 'Kapsabet ELC',
    poBox: '—',
    phone: '+254 748 042 158',
    email: 'elckapsabet@court.go.ke',
  },
  {
    station: 'Kericho ELC',
    poBox: '—',
    phone: '0799 532 974',
    email: 'elckericho@court.go.ke',
    altEmail: 'elckericho@gmail.com',
  },
  {
    station: 'Kerugoya ELC',
    poBox: '—',
    phone: '+254 745 814 243',
    email: 'elckerugoya@court.go.ke',
    altEmail: 'kerugoyaelccourt@gmail.com',
  },
  {
    station: 'Kilgoris ELC Sub-Registry',
    poBox: '—',
    phone: '0712 961 364',
    email: 'kilgorissubregistries@gmail.com',
  },
  {
    station: 'Kisii ELC',
    poBox: '—',
    phone: '0111 431 147',
    email: 'elckisii@court.go.ke',
    altEmail: 'elccourtkisii@gmail.com',
  },
  {
    station: 'Kitale ELC',
    poBox: '—',
    phone: '0742 152 503',
    email: 'elckitale@court.go.ke',
  },
  {
    station: 'Kitui Law Courts',
    poBox: '—',
    phone: '0704 409 167',
    email: 'elckitui@court.go.ke',
  },
  {
    station: 'Kwale ELC',
    poBox: '—',
    phone: '0790 099 579',
    email: 'elckwale@court.go.ke',
  },
  {
    station: 'Lamu ELC Sub-Registry',
    poBox: '—',
    phone: '0704 409 306',
    email: 'lamucourt@court.go.ke',
  },
  {
    station: 'Limuru ELC',
    poBox: '—',
    phone: '0711 877 726',
    email: 'elclimuru@court.go.ke',
  },
  {
    station: 'Machakos ELC',
    poBox: '—',
    phone: '0727 979 958',
    email: 'elcmachakos@gmail.com',
  },
  {
    station: 'Makueni ELC',
    poBox: '—',
    phone: '+254 117 764 797',
    email: 'makuenielc@gmail.com',
  },
  {
    station: 'Malindi Law Courts',
    poBox: '—',
    phone: '0759 317 018',
    email: 'elcmalindi@court.go.ke',
  },
  {
    station: 'Maralal ELC Sub-Registry',
    poBox: '—',
    phone: '0704 409 514',
    email: 'elcmaralal@court.go.ke',
  },
  {
    station: 'Mavoko ELC',
    poBox: '—',
    phone: '0741 884 618',
    email: 'elcmavoko@court.go.ke',
  },
  {
    station: 'Meru ELC',
    poBox: '—',
    phone: '0740 164 022', // Station line — no ELC-specific number
    email: 'elcmeru@court.go.ke',
  },
  {
    station: "Murang'a ELC",
    poBox: '—',
    phone: '0746 578 559',
    email: 'elcmuranga@gmail.com',
  },
  {
    station: 'Naivasha ELC',
    poBox: '—',
    phone: '0759 373 395',
    email: 'elcnaivasha@gmail.com',
  },
  {
    station: 'Nyamira ELC',
    poBox: '—',
    phone: '0759 173 064',
    email: 'elcnyamira@court.go.ke',
  },
  {
    station: 'Nyahururu Law Courts',
    poBox: '—',
    phone: '0724 754 356',
    email: 'elcnyahururu@court.go.ke',
  },
  {
    station: 'Siaya ELC',
    poBox: '—',
    phone: '0701 444 738',
    email: 'elcsiaya@court.go.ke',
  },
  {
    station: 'Thika ELC',
    poBox: '—',
    phone: '0791 569 875',
    email: 'thikaelcregistry@court.go.ke',
    altEmail: 'thikaelcregistry@gmail.com',
  },
  {
    station: 'Voi ELC',
    poBox: '—',
    phone: '+254 794 591 572',
    email: 'elcvoi@court.go.ke',
    altEmail: 'elccourtvoi@gmail.com',
  },
  {
    station: 'Wajir ELC',
    poBox: '—',
    phone: '+254 143 513 220',
    email: 'elcwajir@court.go.ke',
  },
];

// ─── Principal registry card data ────────────────────────────────────────────
// Kept as data (not JSX) so the search filter can match against it too.

const PRINCIPAL_REGISTRY = {
  address: 'ELC Principal Registry, Milimani Law Courts, Nairobi.',
  phone: '0730 181 192',
  email: 'milimani.drelc@court.go.ke',
  hours: 'Mon – Fri | 8:00am – 5:00pm',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip spaces, dashes, parentheses and leading +254/0 so "0730 181 192",
 *  "+254 730 181 192" and "0730181192" all match the same query. */
const normalisePhone = (v: string) =>
  v.replace(/[\s\-()]/g, '').replace(/^\+?254/, '0');

/** Lowercase + trim, for case-insensitive substring matching. */
const normaliseText = (v: string) => v.toLowerCase().trim();

/** Does `query` appear anywhere in `station`'s name, emails, phone or box? */
const stationMatches = (station: StationContact, query: string) => {
  const q = normaliseText(query);
  if (!q) return true;

  const haystack = [
    station.station,
    station.email,
    station.altEmail ?? '',
    station.poBox,
    station.phone,
  ]
    .map(normaliseText)
    .join(' ');

  if (haystack.includes(q)) return true;

  // Phone-aware match: only try if the query looks like digits.
  const digits = q.replace(/[^\d]/g, '');
  if (digits.length >= 3) {
    return normalisePhone(station.phone).includes(digits);
  }
  return false;
};

/** Does the principal registry card match the query? */
const principalMatches = (query: string) => {
  const q = normaliseText(query);
  if (!q) return true;

  const haystack = [
    PRINCIPAL_REGISTRY.address,
    PRINCIPAL_REGISTRY.email,
    PRINCIPAL_REGISTRY.phone,
    PRINCIPAL_REGISTRY.hours,
    'principal registry',
    'get in touch',
  ]
    .map(normaliseText)
    .join(' ');

  if (haystack.includes(q)) return true;

  const digits = q.replace(/[^\d]/g, '');
  if (digits.length >= 3) {
    return normalisePhone(PRINCIPAL_REGISTRY.phone).includes(digits);
  }
  return false;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const ContactPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'name-desc'>('name');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const dispatch = useDispatch<AppDispatch>();
  const { isSubmittingMessage, submitMessageError, submitMessageSuccess } =
    useSelector((state: RootState) => state.contact);
  // Honeypot: real users never see or fill this; bots do.
  const [honeypot, setHoneypot] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingMessage) return;

    const result = await dispatch(
      submitContactMessage({
        payload: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim() || null,
          message: formData.message.trim(),
        },
        honeypot,
      }),
    );

    // Only clear the form once the server has actually recorded it.
    if (submitContactMessage.fulfilled.match(result)) {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => dispatch(clearSubmitMessageState()), 6000);
    }
  };

  // ── Derived: filtered + sorted stations ────────────────────────────────────
  const filteredStations = useMemo(() => {
    const matches = ELC_STATIONS.filter((st) =>
      stationMatches(st, searchQuery),
    );

    return matches.slice().sort((a, b) => {
      const cmp = a.station.localeCompare(b.station, undefined, {
        sensitivity: 'base',
      });
      return sortBy === 'name' ? cmp : -cmp;
    });
  }, [searchQuery, sortBy]);

  // ── Derived: does the principal registry card match? ───────────────────────
  const showPrincipalCard = useMemo(
    () => principalMatches(searchQuery),
    [searchQuery],
  );

  const hasQuery = searchQuery.trim().length > 0;
  const totalMatches = filteredStations.length + (showPrincipalCard ? 1 : 0);

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 pb-20">
      {/* ================= HERO BANNER ================= */}
      <div className="relative bg-[#061e14] text-white overflow-hidden py-16 lg:py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#061e14]/80 via-[#061e14]/90 to-[#061e14]" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C69A33_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#C69A33]/40 backdrop-blur-md text-xs font-mono text-[#D4AF37] uppercase tracking-widest font-semibold">
            <FaTree />
            <span>ELC Principal Registry Helpdesk</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight">
            Environment &amp; Land Court{' '}
            <span className="text-[#D4AF37]">Contacts</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Get in touch with the ELC Principal Registry, station registries, or
            submit inquiries regarding environmental and land dispute filings.
          </p>

          {/* ── Unified search bar ──────────────────────────────────────── */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by court name, email, phone, or P.O. Box…"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl bg-white/95 backdrop-blur-md text-slate-900 placeholder-slate-500 text-sm shadow-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#C69A33]"
              />
              {hasQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {hasQuery && (
              <p className="mt-2 text-xs text-slate-300 font-mono">
                {totalMatches} result{totalMatches === 1 ? '' : 's'} for “
                {searchQuery}”
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTACT & FORM SECTION ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info — hidden if search excludes it */}
          {showPrincipalCard && (
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-bold text-slate-900">
                  Get In Touch
                </h2>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Reach out to the Environment and Land Court central registry
                  offices using the options below.
                </p>
              </div>

              <div className="space-y-5">
                <h3 className="text-xs font-mono font-bold text-[#C69A33] uppercase tracking-wider">
                  Principal Registry Details
                </h3>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                    <FaMapMarkerAlt className="w-4 h-4 text-[#C69A33]" />
                  </div>
                  <div>
                    <span className="block text-xs font-mono text-slate-400 font-bold uppercase">
                      Address
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {PRINCIPAL_REGISTRY.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                    <FaPhoneAlt className="w-4 h-4 text-[#C69A33]" />
                  </div>
                  <div>
                    <span className="block text-xs font-mono text-slate-400 font-bold uppercase">
                      Call Us
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {PRINCIPAL_REGISTRY.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                    <FaEnvelope className="w-4 h-4 text-[#C69A33]" />
                  </div>
                  <div>
                    <span className="block text-xs font-mono text-slate-400 font-bold uppercase">
                      Mail
                    </span>
                    <p className="text-xs font-semibold text-slate-800">
                      {PRINCIPAL_REGISTRY.email}
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold text-[#061e14] uppercase tracking-wider flex items-center gap-2">
                  <FaClock className="text-[#C69A33]" />
                  <span>Operating Hours</span>
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-mono">
                  <span className="font-bold text-slate-900">
                    {PRINCIPAL_REGISTRY.hours.split('|')[0].trim()}
                  </span>{' '}
                  | {PRINCIPAL_REGISTRY.hours.split('|')[1]?.trim()}
                </div>
              </div>
            </div>
          )}

          {/* Right Column: Feedback Form — always visible */}
          <div
            className={`bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 ${
              showPrincipalCard ? 'lg:col-span-7' : 'lg:col-span-12'
            }`}
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#061e14]">
                Leave Your Message
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                Submit court inquiries or feedback regarding ELC registry
                services directly to our team.
              </p>
            </div>

            {submitMessageSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                ✓ Thank you! Your message has been received by the ELC Registry.
              </div>
            )}

            {submitMessageError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-mono">
                ✕ {submitMessageError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-600">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-600">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  placeholder="Subject of inquiry (e.g., E-filing, Cause List, Land Case)"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-600">
                  Message
                </label>
                <textarea
                  rows={5}
                  required
                  minLength={10}
                  placeholder="Write your inquiry or message..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingMessage}
                className="px-6 py-3 rounded-xl bg-[#C69A33] hover:bg-[#b0882b] disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <FaPaperPlane /> {isSubmittingMessage ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ================= ELC STATIONS DIRECTORY ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">
              ELC Station Registries Directory
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              Contact channels for individual Environment and Land Court station
              registries nationwide.{' '}
              {hasQuery
                ? `${filteredStations.length} of ${ELC_STATIONS.length} stations match.`
                : `${ELC_STATIONS.length} stations listed.`}
            </p>
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label
              htmlFor="sortBy"
              className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap"
            >
              Sort
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'name' | 'name-desc')
              }
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#061e14] bg-white"
            >
              <option value="name">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((item) => (
            <div
              key={item.station}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FaBuilding className="text-[#C69A33] shrink-0" />
                <h3 className="text-sm font-serif font-bold text-slate-900">
                  {item.station}
                </h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                {item.poBox !== '—' && (
                  <p>
                    <span className="text-slate-400">P.O. Box:</span>{' '}
                    {item.poBox}
                  </p>
                )}
                <p>
                  <span className="text-slate-400">Phone:</span> {item.phone}
                </p>
                <p className="truncate">
                  <span className="text-slate-400">Email:</span>{' '}
                  <a
                    href={`mailto:${item.email}`}
                    className="text-[#061e14] font-semibold underline"
                  >
                    {item.email}
                  </a>
                </p>
                {item.altEmail && (
                  <p className="truncate">
                    <span className="text-slate-400">Alt:</span>{' '}
                    <a
                      href={`mailto:${item.altEmail}`}
                      className="text-[#061e14] font-semibold underline"
                    >
                      {item.altEmail}
                    </a>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredStations.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <FaSearch className="mx-auto text-2xl text-slate-300" />
            <p className="text-sm text-slate-600 font-serif">
              No stations match “{searchQuery}”.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-mono font-bold text-[#C69A33] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPage;