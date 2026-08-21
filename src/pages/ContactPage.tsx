import React, { useState } from 'react';
import { 
  FaPhoneAlt, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaPaperPlane, 
  FaBuilding, 
  FaSearch, 
  FaTree 
} from 'react-icons/fa';

interface StationContact {
  station: string;
  poBox: string;
  phone: string;
  email: string;
}

const elcStations: StationContact[] = [
  {
    station: 'Nairobi ELC Registry (Milimani)',
    poBox: 'P.O. Box 30041-00100, Nairobi',
    phone: '+254 0730 181 000',
    email: 'elcnairobi@court.go.ke',
  },
  {
    station: 'Mombasa ELC Registry',
    poBox: 'P.O. Box 90142-80100, Mombasa',
    phone: '+254 0730 181 200',
    email: 'elcmombasa@court.go.ke',
  },
  {
    station: 'Kisumu ELC Registry',
    poBox: 'P.O. Box 116-40100, Kisumu',
    phone: '+254 0730 181 300',
    email: 'elckisumu@court.go.ke',
  },
  {
    station: 'Nakuru ELC Registry',
    poBox: 'P.O. Box 61-20100, Nakuru',
    phone: '+254 0730 181 400',
    email: 'elcnakuru@court.go.ke',
  },
  {
    station: 'Eldoret ELC Registry',
    poBox: 'P.O. Box 144-30100, Eldoret',
    phone: '+254 0730 181 500',
    email: 'elceldoret@court.go.ke',
  },
  {
    station: 'Nyeri ELC Registry',
    poBox: 'P.O. Box 298-10100, Nyeri',
    phone: '+254 0730 181 600',
    email: 'elcnyeri@court.go.ke',
  },
];

export const ContactPage: React.FC = () => {
  const [stationSearch, setStationSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  const filteredStations = elcStations.filter((st) =>
    st.station.toLowerCase().includes(stationSearch.toLowerCase()) ||
    st.email.toLowerCase().includes(stationSearch.toLowerCase())
  );

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
            Environment & Land Court <span className="text-[#D4AF37]">Contacts</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-sans">
            Get in touch with the ELC Principal Registry, station registries, or submit inquiries regarding environmental and land dispute filings.
          </p>
        </div>
      </div>

      {/* ================= MAIN CONTACT & FORM SECTION ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-slate-900">Get In Touch</h2>
              <p className="text-xs text-slate-500 font-sans leading-relaxed">
                Reach out to the Environment and Land Court central registry offices using the options below.
              </p>
            </div>

            {/* Contacts Info List */}
            <div className="space-y-5">
              <h3 className="text-xs font-mono font-bold text-[#C69A33] uppercase tracking-wider">
                Principal Registry Details
              </h3>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                  <FaMapMarkerAlt className="w-4 h-4 text-[#C69A33]" />
                </div>
                <div>
                  <span className="block text-xs font-mono text-slate-400 font-bold uppercase">Address</span>
                  <p className="text-xs font-semibold text-slate-800">ELC Principal Registry, Fort Jesus / Milimani Law Courts.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                  <FaPhoneAlt className="w-4 h-4 text-[#C69A33]" />
                </div>
                <div>
                  <span className="block text-xs font-mono text-slate-400 font-bold uppercase">Call Us</span>
                  <p className="text-xs font-semibold text-slate-800">+254 0730 181 000</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-[#061e14]/5 text-[#061e14] shrink-0 border border-[#061e14]/10">
                  <FaEnvelope className="w-4 h-4 text-[#C69A33]" />
                </div>
                <div>
                  <span className="block text-xs font-mono text-slate-400 font-bold uppercase">Mail</span>
                  <p className="text-xs font-semibold text-slate-800">registrarelc@court.go.ke</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Opening Hours */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold text-[#061e14] uppercase tracking-wider flex items-center gap-2">
                <FaClock className="text-[#C69A33]" />
                <span>Operating Hours</span>
              </h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-mono">
                <span className="font-bold text-slate-900">Mon – Fri</span> | 8:00am – 5:00pm
              </div>
            </div>
          </div>

          {/* Right Column: Feedback Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#061e14]">Leave Your Message</h2>
              <p className="text-xs text-slate-500 font-sans">
                Submit court inquiries or feedback regarding ELC registry services directly to our team.
              </p>
            </div>

            {submitted && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                ✓ Thank you! Your message has been submitted to the ELC Registry.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-600">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-600">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="Your Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-600">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Subject of inquiry (e.g., E-filing, Cause List, Land Case)"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-slate-600">Message</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your inquiry or message..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14] resize-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#C69A33] hover:bg-[#b0882b] text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <FaPaperPlane /> Send Message
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
              Contact channels for individual Environment and Land Court station registries nationwide.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Search station or email..."
              value={stationSearch}
              onChange={(e) => setStationSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#061e14]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStations.map((item, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FaBuilding className="text-[#C69A33] shrink-0" />
                <h3 className="text-sm font-serif font-bold text-slate-900">{item.station}</h3>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                <p><span className="text-slate-400">P.O. Box:</span> {item.poBox}</p>
                <p><span className="text-slate-400">Phone:</span> {item.phone}</p>
                <p className="truncate"><span className="text-slate-400">Email:</span> <a href={`mailto:${item.email}`} className="text-[#061e14] font-semibold underline">{item.email}</a></p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ContactPage;