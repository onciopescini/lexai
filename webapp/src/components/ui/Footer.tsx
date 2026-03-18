import Link from 'next/link';
import { Scale, ShieldCheck, FileText, Activity } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-marble-200 py-12 px-6 sm:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div className="col-span-1 md:col-span-1 flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Scale className="h-6 w-6 text-amber-500" />
            <span className="text-xl font-bold text-slate-900">
              Atena
            </span>
          </div>
          <p className="text-sm text-slate-500">
            L&apos;intelligenza artificiale giuridica progettata per proteggere, informare e agire.
          </p>
        </div>

        {/* Navigation */}
        <div className="col-span-1 flex flex-col space-y-3">
          <h4 className="text-slate-800 font-bold mb-2 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" /> Ecosistema
          </h4>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Atena Chat Engine
          </Link>
          <Link href="/guardian" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Guardian Radar
          </Link>
          <Link href="/lessons" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Civic Lessons
          </Link>
        </div>

        {/* Legal & Compliance */}
        <div className="col-span-1 flex flex-col space-y-3">
          <h4 className="text-slate-800 font-bold mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-500" /> Compliance
          </h4>
          <Link href="/legal/privacy" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Privacy Policy (GDPR)
          </Link>
          <Link href="/legal/terms" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Terms of Service
          </Link>
          <Link href="/legal/cookies" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Cookie Policy
          </Link>
        </div>

        {/* About */}
        <div className="col-span-1 flex flex-col space-y-3">
          <h4 className="text-slate-800 font-bold mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-500" /> Atena Intel
          </h4>
          <Link href="/legal/about" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Il Progetto Atena
          </Link>
          <Link href="/legal/disclaimer" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Disclaimer Legale
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-marble-200 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Atena AI Legal Systems. Tutti i diritti riservati.</p>
        <p className="mt-2 md:mt-0 flex items-center gap-1">
          Protetto dall&apos;algoritmo Data-Clash <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
        </p>
      </div>
    </footer>
  );
}
