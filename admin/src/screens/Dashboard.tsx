import { useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  LayoutDashboard,
  MonitorPlay,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'
import ContentManager from '../components/ContentManager'
import ScreenManager from '../components/ScreenManager'
import GroupManager from '../components/GroupManager'
import SettingsPanel from '../components/SettingsPanel'

type Tab = 'content' | 'groups' | 'screens' | 'settings'

function Dashboard() {
  const [tab, setTab] = useState<Tab>('content')

  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <MonitorPlay size={28} />
          <span>Signage Admin</span>
        </div>
        <nav>
          <button
            className={tab === 'content' ? 'active' : ''}
            onClick={() => setTab('content')}
          >
            <LayoutDashboard size={18} />
            Conteúdos
          </button>
          <button
            className={tab === 'groups' ? 'active' : ''}
            onClick={() => setTab('groups')}
          >
            <Users size={18} />
            Grupos
          </button>
          <button
            className={tab === 'screens' ? 'active' : ''}
            onClick={() => setTab('screens')}
          >
            <MonitorPlay size={18} />
            Telas
          </button>
          <button
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => setTab('settings')}
          >
            <Settings size={18} />
            Configurações
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="ghost" onClick={handleLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>
      <main className="content">
        {tab === 'content' ? (
          <ContentManager />
        ) : tab === 'groups' ? (
          <GroupManager />
        ) : tab === 'screens' ? (
          <ScreenManager />
        ) : (
          <SettingsPanel />
        )}
      </main>
    </div>
  )
}

export default Dashboard
