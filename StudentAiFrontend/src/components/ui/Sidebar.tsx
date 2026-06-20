import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'
import { 
  LayoutDashboard, 
  Map, 
  BrainCircuit, 
  Compass, 
  MessageSquare, 
  LifeBuoy, 
  Trophy, 
  LogOut,
  Sparkles,
  Flame
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUserStore()

  if (!user) return null

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Onboarding', path: '/onboarding', icon: BrainCircuit },
    { name: 'AI Life Planner', path: '/planner', icon: Map },
    { name: 'Career Simulator', path: '/simulator', icon: Compass },
    { name: 'AI Mentor', path: '/mentor', icon: MessageSquare },
    { name: 'Failure Recovery', path: '/recovery', icon: LifeBuoy },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-4 bottom-4 w-64 glass glass-glow rounded-2xl flex flex-col justify-between p-4 z-40"
    >
      <div className="flex flex-col gap-6">
        {/* Brand/Header */}
        <div className="flex items-center gap-3 px-2 py-3 border-b border-white/5">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-none bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">LifeGPS</h1>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Educational OS</span>
          </div>
        </div>

        {/* User Card Mini */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-sm text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">{user.username}</p>
              <p className="text-[9px] text-blue-400 font-medium">Lv. {user.level} {user.level >= 40 ? 'Innovator' : user.level >= 20 ? 'Engineer' : user.level >= 10 ? 'Builder' : 'Explorer'}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full text-orange-400">
            <Flame className="h-3 w-3 fill-orange-400" />
            <span className="text-[10px] font-bold">{user.streak}d</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group relative ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-l-2 border-blue-500' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-l-2 border-transparent'
                }`}
              >
                <item.icon className={`h-4.5 w-4.5 transition-transform group-hover:scale-105 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                {item.name}
                {isActive && (
                  <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout button */}
      <div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border-l-2 border-transparent duration-300 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Logout
        </button>
      </div>
    </motion.aside>
  )
}
