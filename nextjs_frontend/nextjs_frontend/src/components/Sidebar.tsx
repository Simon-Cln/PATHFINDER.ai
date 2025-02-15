interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  matchRate: number;
  profileCompletion: number;
  hasSearched: boolean;
}

export default function Sidebar({ 
  activeTab, 
  onTabChange,
  matchRate = 0,
  profileCompletion = 0,
  hasSearched = false
}: SidebarProps) {
  return (
    <aside className="dashboard-sidebar">
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="profile-avatar flex items-center justify-center">
            <svg className="w-6 h-6 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="heading-3 mb-0">Welcome back</h2>
            <p className="caption">Your personal space</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>
          <button
            onClick={() => onTabChange('matches')}
            className={`nav-item ${activeTab === 'matches' ? 'nav-item-active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Your Matches
          </button>
          <button
            onClick={() => onTabChange('profile')}
            className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        </nav>
      </div>

      <div className="stats-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="heading-3 text-[--accent] mb-0">Quick Stats</h3>
          <svg className="w-5 h-5 text-[--accent]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        
        <div className="space-y-6">
          <div className="stat-item">
            <div className="stat-header">
              <span className="stat-label">Match Rate</span>
              <span className="stat-value">{hasSearched ? `${matchRate}%` : '-'}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-value" 
                style={{ 
                  width: hasSearched ? `${matchRate}%` : '0%',
                  transition: hasSearched ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                }} 
              />
            </div>
          </div>
          
          <div className="stat-item">
            <div className="stat-header">
              <span className="stat-label">Profile Completion</span>
              <span className="stat-value">{hasSearched ? `${profileCompletion}%` : '-'}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-value" 
                style={{ 
                  width: hasSearched ? `${profileCompletion}%` : '0%',
                  transition: hasSearched ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
