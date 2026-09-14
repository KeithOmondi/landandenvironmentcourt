// src/pages/NotFoundPage.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft, Home, HelpCircle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-md w-full text-center space-y-6">
        
        {/* Judicial Icon Badge */}
        <div className="inline-flex items-center justify-center p-4 bg-emerald-900/10 rounded-full border-2 border-amber-600/30 text-amber-600 shadow-sm">
          <Scale className="w-12 h-12" />
        </div>

        {/* Status & Title */}
        <div className="space-y-2">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-600">
            404 Error • Page Not Found
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 tracking-tight">
            Not Found
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            The page you are looking for does not exist, has been removed, or moved to another court register.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-900"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            Go Back
          </button>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-950 text-white font-medium text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <Home className="w-4 h-4 text-amber-500" />
            Return Home
          </Link>
        </div>

        {/* Help Link Footer */}
        <div className="pt-8 border-t border-slate-200">
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-900 font-medium transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need assistance? Contact Court Registry
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFoundPage;