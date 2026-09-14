import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPhoneAlt, 
  FaEnvelope, 
  FaClock, 
  FaChevronRight, 
  FaGavel 
} from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="relative bg-[#061e14] text-white pt-16 pb-8 border-t-4 border-[#C69A33] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C69A33]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          
          {/* Column 1: Brand & Contact Info (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/10 border border-[#C69A33]/40 text-[#D4AF37]">
                <FaGavel className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-white tracking-wide uppercase">
                  Environment & Land Court
                </h3>
                <p className="text-xs text-[#C69A33] font-mono font-semibold tracking-wider uppercase">
                  Republic of Kenya
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The Registrar Environment and Land Court — Milimani Law Courts Building, Nairobi.
            </p>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-3">
                <FaClock className="w-4 h-4 text-[#C69A33] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-white">Opening Hours:</p>
                  <p>Mon – Fri: 8:00 am – 5:00 pm</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FaPhoneAlt className="w-4 h-4 text-[#C69A33] shrink-0" />
                <a href="tel:+2540730181000" className="hover:text-[#D4AF37] transition-colors">
                  Phone: +254 0730 181 000
                </a>
              </div>

              <div className="flex items-center gap-3">
                <FaEnvelope className="w-4 h-4 text-[#C69A33] shrink-0" />
                <a href="mailto:registrarelc@court.go.ke" className="hover:text-[#D4AF37] transition-colors truncate">
                  Email: orelc@court.go.ke
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-base font-serif font-bold text-[#D4AF37] border-b border-[#C69A33]/30 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                { label: 'Home', path: '/' },
                { label: 'History of the ELC', path: '/about/history' },
                { label: 'Office of The Principal Judge', path: '/leadership/principal-judge' },
                { label: 'Office of The Registrar', path: '/leadership/registrar' },
                { label: 'ELC Advisory Committee', path: '/leadership/advisory-committee' },
                { label: 'Contact Us', path: '/contact' },
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.path} 
                    className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 group"
                  >
                    <FaChevronRight className="w-2 h-2 text-[#C69A33] group-hover:translate-x-1 transition-transform" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Useful Links (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-base font-serif font-bold text-[#D4AF37] border-b border-[#C69A33]/30 pb-2">
              Useful Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                { label: 'E-Filing Portal', href: 'https://efiling.judiciary.go.ke' },
                { label: 'Public Information Kiosk', href: '#' },
                { label: 'Validate Court Orders', href: '#' },
                { label: 'Environment & Land Cause Lists', href: '#' },
                { label: 'Judiciary Advocates Management System', href: '#' },
              ].map((link, idx) => (
                <li key={idx}>
                  <a 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 group"
                  >
                    <FaChevronRight className="w-2 h-2 text-[#C69A33] group-hover:translate-x-1 transition-transform" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Affiliate Links (lg:col-span-3) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-base font-serif font-bold text-[#D4AF37] border-b border-[#C69A33]/30 pb-2">
              Affiliate Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                { label: 'Judiciary of Kenya', href: 'https://www.judiciary.go.ke' },
                { label: 'Judicial Service Commission (JSC)', href: 'https://www.jsc.go.ke' },
                { label: 'Supreme Court of Kenya', href: '#' },
                { label: 'Office of the Chief Justice', href: '#' },
                { label: 'Kenya Judiciary Academy (KJA)', href: '#' },
                { label: 'Kenya Law Reports', href: 'http://kenyalaw.org' },
                { label: 'National Council on the Administration of Justice (NCAJ)', href: '#' },
                { label: 'Office of the Attorney General', href: '#' },
                { label: 'Office of the Director of Public Prosecutions', href: '#' },
              ].map((link, idx) => (
                <li key={idx}>
                  <a 
                    href={link.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 group"
                  >
                    <FaChevronRight className="w-2 h-2 text-[#C69A33] group-hover:translate-x-1 transition-transform" />
                    <span>{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-8 text-center text-xs text-slate-400 font-mono">
          <p>
            The Judiciary - Environment and Land Court of Kenya © 2026. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;