import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Treemap
} from 'recharts'
import { 
  Award, 
  Flame, 
  Compass, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  BookOpen,
  History,
  AlertTriangle,
  Coins,
  Activity,
  Milestone,
  Target
} from 'lucide-react'
import Sidebar from '../components/ui/Sidebar'

export default function Dashboard() {
  const { user, profileState, fetchProfileState } = useUserStore()

  useEffect(() => {
    fetchProfileState()
  }, [])

  if (!profileState || !user) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Booting AI Educational OS...</p>
        </div>
      </div>
    )
  }

  // Extract from unified profileState
  const basic = profileState.basicDetails
  const readiness = profileState.careerReadiness?.score || 0
  const recovery = profileState.recoveryPlan
  const completedNodeIds = profileState.completedNodes || []
  const skills = profileState.selectedSkills || []
  const schedule = profileState.availableHours || []
  const studySessions = profileState.studySessions || []
  const xpHistory = profileState.xpHistory || []
  const badges = profileState.unlockedBadges || []
  const goals = profileState.careerGoals || []
  const readinessDetail = profileState.careerReadiness || {}
  const readinessBreakdown = readinessDetail.breakdown || {}
  const readinessHistory = readinessDetail.history || []

  // Compute rank based on level
  const currentRank = basic.level >= 40 ? 'Innovator' : basic.level >= 20 ? 'Engineer' : basic.level >= 10 ? 'Builder' : 'Explorer'

  // Construct Radar Data dynamically from user skills
  const radarData = skills.map((s: any) => ({
    subject: s.skillName,
    A: s.progress,
    B: 70,
    fullMark: 100
  }))

  // Construct Area Data from study sessions
  const productivityData = studySessions.slice(0, 7).reverse().map((s: any) => ({
    name: s.date.substring(5), // MM-DD
    hours: s.hours
  }))

  // Construct Mastery Treemap Data dynamically from user skills
  const masteryData = [
    {
      name: 'User Skills',
      children: skills.map((s: any) => ({
        name: s.skillName,
        size: s.progress
      }))
    }
  ]

  // Construct Donut Chart Data
  const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981']
  const distributionData = skills.map((s: any, idx: number) => ({
    name: s.skillName,
    value: s.progress,
    color: COLORS[idx % COLORS.length]
  }))

  // Compute 365-day heatmap grids from study sessions
  const heatmapDays = Array.from({ length: 371 }, (_, idx) => {
    // Check if session exists on this relative day
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (370 - idx));
    const dateStr = targetDate.toISOString().substring(0, 10);
    const daySessions = studySessions.filter((s: any) => s.date === dateStr);
    
    if (daySessions.length > 0) {
      const sum = daySessions.reduce((acc: number, cur: any) => acc + cur.hours, 0);
      return sum >= 4 ? 3 : sum >= 2 ? 2 : 1;
    }
    return 0;
  })

  // Compute Duolingo-style monthly streak calendar
  const currentMonthDays = Array.from({ length: 30 }, (_, idx) => {
    const day = idx + 1;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (29 - idx));
    const dateStr = targetDate.toISOString().substring(0, 10);
    const hasSession = studySessions.some((s: any) => s.date === dateStr);
    return { day, active: hasSession }
  })

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6 overflow-x-hidden">
      <Sidebar />

      {/* Main Mission Control Layout Grid */}
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* MISSION CONTROL HEADER */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass p-6 rounded-2xl relative overflow-hidden">
          <div className="scanline" />
          
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/20">
              {basic.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-2xl text-white">Mission Control // {basic.username}</h1>
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  {basic.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Active Target Career:</span>
                <span className="text-purple-400 font-semibold">{profileState.targetCareer}</span>
                <span className="h-1 w-1 bg-slate-500 rounded-full" />
                <span>Rank:</span>
                <span className="text-blue-400 font-semibold">{currentRank}</span>
              </p>
            </div>
          </div>

          {/* Gamified Stat Counters */}
          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="glass bg-white/5 border border-orange-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-lg text-orange-400">
                <Flame className="h-5 w-5 fill-orange-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Streak</p>
                <p className="text-sm font-bold text-slate-200">{basic.streak} Days</p>
              </div>
            </div>

            {/* Level */}
            <div className="glass bg-white/5 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Level {basic.level}</p>
                <p className="text-sm font-bold text-slate-200">
                  {basic.xp} XP
                </p>
              </div>
            </div>

            {/* Coins */}
            <div className="glass bg-white/5 border border-yellow-500/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-400">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Coins</p>
                <p className="text-sm font-bold text-slate-200">{basic.coins}</p>
              </div>
            </div>
          </div>
        </header>

        {/* AUTOMATED RECOVERY ALERTS SECTION */}
        {recovery?.active && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-amber-500/30 bg-amber-500/5 p-6 rounded-2xl flex items-start gap-4 relative overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          >
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-amber-500" />
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-amber-300">AI Recovery Recommendation Triggered</h3>
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                  {recovery.timelineDelay}
                </span>
              </div>
              <p className="text-sm text-slate-300 font-semibold">{recovery.headline}</p>
              <p className="text-xs text-slate-400 leading-relaxed italic">"{recovery.motivation}"</p>
              <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                {recovery.suggestions?.map((item: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2 bg-white/5 border border-white/5 p-2 rounded-xl">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* WORKSPACE MAIN PANELS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Target Objective */}
          <div className="lg:col-span-2 glass p-6 rounded-2xl flex flex-col justify-between relative">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-slate-300 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                  Active Target Objective
                </h3>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-mono">
                  PRIORITY 1
                </span>
              </div>
              <p className="text-lg font-bold text-white leading-tight">
                {basic.activeMission || 'Complete Cognitive Diagnostics Quiz to establish skill matrix.'}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Completed nodes and assessment benchmarks generate 400 XP milestones.
              </p>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>XP Progression Progress</span>
                <span className="font-bold text-blue-400">{basic.xp} / {basic.level * 400} XP</span>
              </div>
              <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(basic.xp / (basic.level * 400)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* GAUGE CHART: Career Readiness */}
          <div className="glass p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <h3 className="font-display font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Compass className="h-5 w-5 text-purple-400" />
              Career Readiness Index
            </h3>
            
            <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
              <svg className="w-40 h-20">
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="220" 
                  strokeLinecap="round"
                />
                <circle 
                  cx="80" cy="80" r="70" 
                  stroke="url(#bluePurpleGrad)" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="220" 
                  strokeDashoffset={220 - (220 * readiness) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="bluePurpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-0 text-center">
                <p className="text-3xl font-extrabold text-white font-display leading-none">{readiness}%</p>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold mt-1">Ready Level</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-normal max-w-[200px]">
              {readiness >= 75 ? 'Highly compatible for direct placement tracks!' : 'Complete boss fights and skill nodes to boost readiness score.'}
            </p>
          </div>
        </div>

        {/* Readiness breakdown and timeline history */}
        <div className="glass p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <h3 className="font-display font-semibold text-slate-300">Career Readiness Breakdown</h3>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Score: {readinessDetail.score || 0}%</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {Object.entries(readinessBreakdown).map(([title, value]: any) => (
              <div key={title} className="bg-slate-950/80 border border-white/5 rounded-2xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-mono mb-2">{title}</p>
                <p className="text-2xl font-bold text-white">{value.score || 0}%</p>
                <p className="text-xs text-slate-400 mt-2 leading-snug">{value.description}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Recent Snapshot History</span>
                <span className="text-[10px] text-slate-400">{readinessHistory.length} entries</span>
              </div>
              <div className="space-y-3">
                {readinessHistory.length > 0 ? (
                  readinessHistory.slice(0, 4).map((entry: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{entry.date.substring(0, 10)}</span>
                        <span className="uppercase font-bold">{entry.type || 'AUTO'}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-slate-200">
                        <span>Score {entry.score}%</span>
                        <span>Internship {entry.internshipReady}%</span>
                        <span>Interview {entry.interviewReady}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No readiness snapshots recorded yet. Progress will be captured after each major milestone.</p>
                )}
              </div>
            </div>
            <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Current Readiness Detail</span>
                <span className="text-[10px] text-slate-400">Confidence {readinessDetail.confidence || 0}%</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{readinessDetail.estimatedTimeline || 'Continue completing roadmap nodes and boss challenges to improve your placement readiness.'}</p>
            </div>
          </div>
        </div>

        {/* 365-DAY GITHUB HEATMAP CONTRIBUTION GRAPH */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-300 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-400" />
              Study Consistency Heatmap (Past 365 Days)
            </h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span>Less</span>
              <span className="w-2.5 h-2.5 bg-white/5 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-blue-500/20 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-blue-500/50 rounded-sm" />
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
              <span>More</span>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-2">
            <div className="grid grid-flow-col grid-rows-7 gap-1 min-w-[760px] h-28">
              {heatmapDays.map((level, idx) => {
                let colorClass = 'bg-white/5'
                if (level === 1) colorClass = 'bg-blue-500/20'
                if (level === 2) colorClass = 'bg-blue-500/50'
                if (level === 3) colorClass = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                return (
                  <div 
                    key={idx} 
                    className={`w-2.5 h-2.5 rounded-sm transition-colors duration-300 hover:border hover:border-white/30 cursor-pointer ${colorClass}`}
                    title={`Relative Study Level #${idx}`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* CHARTS WORKSPACE: RADAR, TREEMAP, DAILY HOURS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RADAR CHART */}
          <div className="glass p-6 rounded-2xl flex flex-col h-96">
            <h3 className="font-display font-semibold text-slate-300 mb-4">Multi-Dimension Skills Balance</h3>
            {radarData.length > 0 ? (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="70%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" stroke="#94A3B8" fontSize={11} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar name="Current Skill Level" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.25} />
                    <Radar name="Target Level" dataKey="B" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                    <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500 italic text-sm">
                No active skills to plot. Save skills in Onboarding!
              </div>
            )}
          </div>

          {/* MASTER TREEMAP */}
          <div className="glass p-6 rounded-2xl flex flex-col h-96">
            <h3 className="font-display font-semibold text-slate-300 mb-4">Topic Mastery Distribution</h3>
            {skills.length > 0 ? (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={masteryData}
                    dataKey="size"
                    stroke="#030712"
                    fill="#8B5CF6"
                    strokeWidth={2}
                  >
                    <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  </Treemap>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500 italic text-sm">
                Complete onboarding to view mastery weights.
              </div>
            )}
          </div>

          {/* AREA CHART: Productivity Trends */}
          <div className="glass p-6 rounded-2xl flex flex-col h-96">
            <h3 className="font-display font-semibold text-slate-300 mb-4">Daily Study Session trends</h3>
            {productivityData.length > 0 ? (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={productivityData}>
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip contentStyle={{ background: '#0b0f19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Area type="monotone" dataKey="hours" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.15)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-grow flex items-center justify-center text-slate-500 italic text-sm">
                No session logging. Log study events to draw chart.
              </div>
            )}
          </div>

        </div>

        {/* CALENDAR STREAK & ACHIEVEMENTS LOG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Calendar Streak (Duolingo Style) */}
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-5 w-5 text-orange-400 fill-orange-400" />
              <h3 className="font-display font-semibold text-slate-300">Streak Calendar (Duolingo Style)</h3>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 mb-2 border-b border-white/5 pb-2">
              <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {currentMonthDays.map((d) => (
                <div 
                  key={d.day}
                  className={`h-8 rounded-lg flex items-center justify-center font-bold text-xs relative ${
                    d.active 
                      ? 'bg-orange-500/10 border border-orange-500/40 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]' 
                      : 'bg-white/5 text-slate-600 border border-transparent'
                  }`}
                >
                  {d.day}
                  {d.active && (
                    <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-orange-400 animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* XP History activities */}
          <div className="glass p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History className="h-5 w-5 text-slate-400" />
                <h3 className="font-display font-semibold text-slate-300">Logged Console Activities</h3>
              </div>
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
                {xpHistory.length > 0 ? (
                  xpHistory.map((log: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-2.5 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <span className="text-slate-300">{log.action}: {log.metadata}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-500">{log.createdAt.substring(11, 16)}</span>
                        <span className="font-bold text-emerald-400 font-mono">+{log.amount} XP</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic text-xs py-4">No logged achievements or activities. Start clearing skill nodes!</div>
                )}
              </div>
            </div>

            {/* Badges shelves */}
            <div className="border-t border-white/5 pt-4 mt-4">
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Unlocked Matrix Badges</h4>
              <div className="flex gap-2.5 flex-wrap">
                {badges.length === 0 ? (
                  <span className="text-xs text-slate-600 italic">No badges unlocked yet. Complete quiz and roadmaps!</span>
                ) : (
                  badges.map((badge: string, idx: number) => (
                    <span 
                      key={idx} 
                      className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold text-[10px] flex items-center gap-1 shadow-sm"
                    >
                      🛡 {badge}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
