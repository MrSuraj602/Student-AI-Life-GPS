import { useEffect, useState } from 'react'
import { Trophy, Award, Sparkles, Flame, Star, Target } from 'lucide-react'
import Sidebar from '../components/ui/Sidebar'
import axios from 'axios'

interface LeaderboardUser {
  username: string
  level: number
  xp: number
  streak: number
  badges: string[]
}

export default function LeaderboardPage() {
  const [boardData, setBoardData] = useState<LeaderboardUser[]>([])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:8080/api/achievements/leaderboard', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setBoardData(response.data)
      } catch (err) {
        // Fallback mock data
        setBoardData([
          { username: 'alex_matrix', level: 45, xp: 18200, streak: 34, badges: ['Python Hero', 'DSA Master', 'Hackathon Warrior'] },
          { username: 'tanya_dev', level: 38, xp: 15400, streak: 21, badges: ['Python Hero', 'DSA Master'] },
          { username: 'aryan_ml', level: 25, xp: 9800, streak: 12, badges: ['Python Hero'] },
          { username: 'student_gps', level: 12, xp: 4800, streak: 8, badges: ['Python Hero'] },
          { username: 'matrix_freshman', level: 8, xp: 3200, streak: 4, badges: [] }
        ])
      }
    }
    fetchLeaderboard()
  }, [])

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6">
      <Sidebar />

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* LEADERBOARD MATRIX */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <header className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
              <Trophy className="h-6 w-6 text-yellow-400 fill-yellow-500/10" />
              <div>
                <h2 className="font-display font-bold text-lg text-white">Global Leaderboard Matrix</h2>
                <p className="text-[10px] text-slate-400">Ranks calculated across total XP points acquired.</p>
              </div>
            </header>

            <div className="flex flex-col gap-3">
              {boardData.map((user, idx) => {
                const rank = idx + 1
                let rankStyle = 'bg-white/5 border-white/5 text-slate-400'
                if (rank === 1) rankStyle = 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400 font-extrabold shadow-[0_0_12px_rgba(234,179,8,0.1)]'
                if (rank === 2) rankStyle = 'bg-slate-300/10 border-slate-300/25 text-slate-300 font-bold'
                if (rank === 3) rankStyle = 'bg-amber-700/10 border-amber-700/25 text-amber-500 font-bold'

                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:bg-white/3 ${rankStyle}`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <span className="w-6 text-center font-mono text-sm">{rank}</span>
                      
                      {/* Avatar */}
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shrink-0">
                        {user.username.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-200 text-sm leading-none">{user.username}</h4>
                          {rank === 1 && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[9px] text-blue-400 font-bold uppercase">Lv. {user.level}</span>
                          <span className="h-1 w-1 bg-slate-700 rounded-full" />
                          <span className="text-[9px] text-orange-400 font-bold flex items-center gap-0.5">
                            <Flame className="h-3 w-3 fill-orange-400/10" /> {user.streak}d
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      {/* Badges icons count */}
                      <div className="hidden sm:flex gap-1.5">
                        {user.badges.map((b, i) => (
                          <span key={i} title={b} className="text-xs">🛡</span>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100 font-mono">{user.xp} XP</p>
                        <p className="text-[9px] text-slate-500">Accumulated</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 mt-6 text-center text-xs text-slate-500 font-mono">
            *Updates refresh on daily matrix completions.
          </div>
        </div>

        {/* DAILY CHALLENGES & EVENT PANELS */}
        <div className="flex flex-col gap-6">
          {/* Daily Challenges */}
          <div className="glass p-6 rounded-2xl flex flex-col gap-4">
            <h3 className="font-display font-semibold text-slate-300 flex items-center gap-2 border-b border-white/5 pb-3">
              <Target className="h-5 w-5 text-blue-400" />
              Daily Challenges
            </h3>
            
            {[
              { title: 'Practice Daily Node', xp: '+50 XP', active: true, desc: 'Unlock or complete one lesson milestone.' },
              { title: 'Chat with AI Counselor', xp: '+30 XP', active: false, desc: 'Ask about study roadmaps or OOP designs.' },
              { title: 'Attempt Diagnostic MCQ', xp: '+100 XP', active: false, desc: 'Provide 5 feedback responses.' }
            ].map((ch, i) => (
              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-200">{ch.title}</h4>
                  <span className="text-[9px] text-emerald-400 font-bold font-mono">{ch.xp}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">{ch.desc}</p>
              </div>
            ))}
          </div>

          {/* Seasonal Events */}
          <div className="glass p-6 rounded-2xl flex-1 flex flex-col gap-4 justify-between">
            <div>
              <h3 className="font-display font-semibold text-slate-300 flex items-center gap-2 border-b border-white/5 pb-3">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Active Event Matrix
              </h3>
              
              <div className="mt-4 text-center">
                <span className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider">
                  Summer Matrix Hackathon
                </span>
                <p className="font-display font-bold text-sm text-slate-200 mt-3">Clearing 5 skill nodes awards double XP milestones.</p>
                <p className="text-[10px] text-slate-400 mt-2">Active until July 1st, 2026. Join community challenges!</p>
              </div>
            </div>

            <div className="bg-white/2 rounded-xl p-3 text-center border border-white/5 text-[10px] text-slate-500">
              Complete challenges to climb rankings.
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
