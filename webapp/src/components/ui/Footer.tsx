import Link from 'next/link';
import Image from 'next/image';
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

      {/* Powered By Section */}
      <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-marble-200">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Powered By</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* Google Gemini */}
            <a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group">
              <Image src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" alt="Gemini" width={20} height={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-600">Gemini</span>
            </a>
            
            {/* Perplexity */}
            <a href="https://www.perplexity.ai" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform">
                <path d="M12 2L2 8.5V15.5L12 22L22 15.5V8.5L12 2Z" stroke="#1a1a1a" strokeWidth="1.5" fill="none"/>
                <path d="M12 2V22" stroke="#1a1a1a" strokeWidth="1.5"/>
                <path d="M2 8.5L22 8.5" stroke="#1a1a1a" strokeWidth="1.5"/>
                <path d="M2 15.5L22 15.5" stroke="#1a1a1a" strokeWidth="1.5"/>
              </svg>
              <span className="text-xs font-semibold text-slate-600">Perplexity</span>
            </a>

            {/* Stripe */}
            <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="group-hover:scale-110 transition-transform">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.918 3.757 7.063c0 4.406 2.686 6.3 7.07 7.893 2.789 1.005 3.759 1.72 3.759 2.812 0 .987-.741 1.54-2.14 1.54-1.88 0-4.699-.985-6.772-2.298L4.697 22.5C6.627 23.61 9.676 24.5 12.487 24.5c2.627 0 4.773-.65 6.273-1.887 1.652-1.336 2.483-3.263 2.483-5.58 0-4.548-2.764-6.434-7.267-8.083z" fill="#635BFF"/>
              </svg>
              <span className="text-xs font-semibold text-slate-600">Stripe</span>
            </a>

            {/* Supabase */}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group">
              <svg width="18" height="18" viewBox="0 0 109 113" fill="none" className="group-hover:scale-110 transition-transform">
                <path d="M63.7076 110.284C60.8481 113.885 55.0502 111.912 54.9813 107.314L53.9738 40.0627L99.1935 40.0627C107.384 40.0627 111.952 49.5228 106.859 55.9374L63.7076 110.284Z" fill="#3ECF8E"/>
                <path d="M45.317 2.07103C48.1765 -1.53037 53.9745 0.442937 54.0434 5.04072L54.4849 72.2922H9.83113C1.64038 72.2922 -2.92775 62.8321 2.1655 56.4175L45.317 2.07103Z" fill="#3ECF8E" fillOpacity="0.6"/>
              </svg>
              <span className="text-xs font-semibold text-slate-600">Supabase</span>
            </a>

            {/* Vercel */}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 opacity-40 hover:opacity-80 transition-opacity group">
              <svg width="16" height="16" viewBox="0 0 76 65" fill="none" className="group-hover:scale-110 transition-transform">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#000"/>
              </svg>
              <span className="text-xs font-semibold text-slate-600">Vercel</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-marble-100 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Atena AI Legal Systems. Tutti i diritti riservati.</p>
        <p className="mt-2 md:mt-0 flex items-center gap-1">
          Protetto dall&apos;algoritmo Data-Clash <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
        </p>
      </div>
    </footer>
  );
}
