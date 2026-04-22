import React from 'react';
import './AuthSplitLayout.scss';

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthSplitLayout: React.FC<AuthSplitLayoutProps> = ({ children, title, subtitle }) => {
  const features = [
    { icon: 'school', title: 'Expert Mentors', desc: 'Learn from industry professionals' },
    { icon: 'calendar_today', title: 'Flexible Sessions', desc: 'Book sessions on your schedule' },
    { icon: 'groups', title: 'Learning Groups', desc: 'Collaborate with peers' },
  ];

  return (
    <div className="auth-split-layout">
      {/* Left Panel: Branding & Features */}
      <div className="left-panel">
        <div className="brand-container">
          <div className="logo-box">
            <img src="/assets/logo.png" className="logo-img" alt="SkillSync" />
          </div>
          <h1 className="brand-name">SkillSync</h1>
          <p className="brand-tagline">Connect. Learn. Grow.</p>

          <div className="feature-list">
            {features.map((f, i) => (
              <div className="feature-item" key={i}>
                <div className="icon-wrapper">
                  <span className="material-icons">{f.icon}</span>
                </div>
                <div className="feature-text">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Blobs for Visual Interest */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {/* Right Panel: Form Content */}
      <div className="right-panel">
        <div className="form-content">
          {/* Mobile Header */}
          <div className="mobile-header">
            <div className="flex items-center gap-2">
              <img src="/assets/logo.png" className="w-8 h-8 object-contain" alt="SkillSync" />
              <span className="text-xl font-bold text-indigo-600">SkillSync</span>
            </div>
          </div>

          <div className="form-header text-left">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500">{subtitle}</p>
          </div>

          <div className="form-body mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
