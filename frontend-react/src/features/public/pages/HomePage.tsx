import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import './HomePage.scss';

const categories = [
  { name: 'FRONTEND', icon: 'code', bg: 'bg-blue-600', shadow: 'shadow-blue-500/30' },
  { name: 'BACKEND', icon: 'list', bg: 'bg-emerald-700', shadow: 'shadow-emerald-500/30' },
  { name: 'DESIGN', icon: 'palette', bg: 'bg-pink-600', shadow: 'shadow-pink-500/30' },
  { name: 'MARKETING', icon: 'insights', bg: 'bg-orange-700', shadow: 'shadow-orange-500/30' },
  { name: 'MOBILE', icon: 'smartphone', bg: 'bg-purple-600', shadow: 'shadow-purple-500/30' },
  { name: 'AI / ML', icon: 'psychology', bg: 'bg-indigo-600', shadow: 'shadow-indigo-500/30' },
  { name: 'BUSINESS', icon: 'business_center', bg: 'bg-cyan-700', shadow: 'shadow-cyan-500/30' },
  { name: 'WRITING', icon: 'edit_note', bg: 'bg-red-700', shadow: 'shadow-red-500/30' },
];

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/mentors');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="home-page min-h-screen bg-white flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-950">
      
      {/* ── Nav Bar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-[50] h-20 px-6 lg:px-12 flex items-center justify-between bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.png" className="w-10 h-10 object-contain" alt="SkillSync" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">SkillSync</span>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/auth/login" className="text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">Sign In</Link>
          <Link to="/auth/register" className="bg-indigo-600 text-white rounded-xl px-8 py-3 text-sm font-extrabold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">Get Started</Link>
        </div>
      </nav>

      {/* ── Hero Section (Image 1) ─────────────────────────────────────────── */}
      <section className="relative pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-12 shadow-sm mx-auto">
            <img src="/assets/logo.png" className="w-4 h-4" alt="" />
            <span className="text-[10px] font-extrabold uppercase tracking-[.25em] text-slate-600">Expert Learning Platform</span>
          </div>
          
          <h1 className="text-6xl lg:text-[5.5rem] font-black tracking-tight text-slate-900 mb-8 leading-[1.05] max-w-5xl mx-auto">
            Unlock your Potential with <br />
            <span className="text-indigo-500">Expert Mentorship</span>
          </h1>
          
          <p className="text-lg text-slate-500 mb-14 max-w-2xl mx-auto leading-relaxed font-medium">
            Connect with industry-leading experts for personalized coaching, session bookings, and career growth. Join thousands of learners accelerating their careers today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link to="/auth/register" className="w-full sm:w-auto bg-indigo-500 text-white px-12 py-5 rounded-2xl text-lg font-black shadow-2xl shadow-indigo-300 transform hover:-translate-y-1 transition-all">
              Explore Best Mentors
            </Link>
            <div className="flex items-center gap-4 text-slate-600 font-bold">
              <div className="flex -space-x-4">
                <img src="https://i.pravatar.cc/100?u=1" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="" />
                <img src="https://i.pravatar.cc/100?u=2" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="" />
                <img src="https://i.pravatar.cc/100?u=3" className="w-12 h-12 rounded-full border-4 border-white object-cover" alt="" />
              </div>
              <span className="text-sm">Trusted by 10k+ learners</span>
            </div>
          </div>
        </div>

        {/* ── Category Grid (Image 4) ─────────────────────────────────────── */}
        <div className="max-w-6xl mx-auto px-6 mt-32">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {categories.map((cat) => (
              <div key={cat.name} className={`${cat.bg} ${cat.shadow} group relative rounded-2xl p-10 flex flex-col items-center justify-center gap-6 cursor-pointer hover:-translate-y-2 transition-all duration-300`}>
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-icons-outlined text-4xl text-white">{cat.icon}</span>
                </div>
                <span className="text-xs font-black tracking-[.2em] text-white">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section (Image 2) ────────────────────────────────────── */}
      <section className="bg-white py-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            
            <div className="space-y-12 text-left">
              <h2 className="text-4xl lg:text-6xl font-black text-slate-900 leading-[1.1]">
                Everything you need to <br/> 
                <span className="text-indigo-500">succeed professionally</span>
              </h2>
              
              <div className="space-y-10">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <span className="material-icons-outlined text-indigo-500 font-bold">video_call</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-black text-slate-900 text-xl mb-2">Live 1:1 Sessions</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">Schedule high-impact video calls directly with experts in your field.</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <span className="material-icons-outlined text-emerald-500 font-bold">payments</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-black text-slate-900 text-xl mb-2">Secure Payments</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">Transparent, secure transactions with Razorpay integration and automated payouts.</p>
                  </div>
                </div>

                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                    <span className="material-icons-outlined text-orange-500 font-bold">stars</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-black text-slate-900 text-xl mb-2">Monetize Expertise</h3>
                    <p className="text-slate-500 leading-relaxed font-medium">Are you an expert? Apply to become a mentor and earn by sharing your wisdom.</p>
                  </div>
                </div>
              </div>

              <div className="pt-8">
                <Link to="/auth/register" className="inline-flex items-center gap-3 group text-indigo-500 font-black tracking-widest uppercase text-sm border-b-2 border-transparent hover:border-indigo-500 pb-1 transition-all">
                  Find your domain 
                  <span className="material-icons group-hover:translate-x-2 transition-transform">arrow_forward</span>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 bg-indigo-50/50 rounded-[4rem] blur-3xl"></div>
              <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" 
                   className="relative rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border-8 border-white"
                   alt="Mentorship" />
              
              {/* Floating UI Element (Image 2) */}
              <div className="absolute -bottom-10 -left-10 bg-slate-900/80 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 shadow-3xl text-left">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <span className="material-icons text-white font-bold">check</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[.25em] mb-1">Growth</p>
                    <p className="text-lg font-black text-white">+85% Skill Match</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer Section (Image 3) ───────────────────────────────────────── */}
      <footer className="bg-[#0b1120] pt-24 pb-16 px-6 lg:px-12 text-left">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16 border-b border-slate-800/50 pb-20">
          <div className="space-y-8 max-w-xs">
            <div className="flex items-center gap-3">
              <img src="/assets/logo.png" className="w-10 h-10 object-contain" alt="SkillSync" />
              <span className="text-2xl font-black text-white">SkillSync</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Leading the next generation of online learning through human-to-human connection.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 lg:gap-32">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-white">Platform</h4>
              <nav className="flex flex-col gap-4 text-sm font-medium text-slate-400">
                <a href="#" className="hover:text-indigo-400 transition-colors">Mentors</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Skills</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Pricing</a>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-white">Company</h4>
              <nav className="flex flex-col gap-4 text-sm font-medium text-slate-400">
                <a href="#" className="hover:text-indigo-400 transition-colors">About</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Careers</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Support</a>
              </nav>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[.3em] text-white">Legal</h4>
              <nav className="flex flex-col gap-4 text-sm font-medium text-slate-400">
                <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">© 2026 SkillSync Platform. All rights reserved.</p>
          <div className="flex gap-8">
            <span className="text-slate-500 hover:text-white transition-all cursor-pointer material-icons-outlined text-lg">facebook</span>
            <span className="text-slate-500 hover:text-white transition-all cursor-pointer material-icons-outlined text-lg">camera_alt</span>
            <span className="text-slate-500 hover:text-white transition-all cursor-pointer material-icons-outlined text-lg">share</span>
          </div>
        </div>
      </footer>
      
    </div>
  );
};
