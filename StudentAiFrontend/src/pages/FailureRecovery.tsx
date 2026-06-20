import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  LifeBuoy, 
  AlertCircle, 
  Compass, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Clock, 
  ShieldAlert, 
  Activity, 
  BookOpen, 
  HeartHandshake
} from 'lucide-react'
import { useUserStore } from '../store/useUserStore'
import Sidebar from '../components/ui/Sidebar'

export default function FailureRecovery() {
  const { user, profileState, fetchProfileState } = useUserStore()

  useEffect(() => {
    fetchProfileState()
  }, [])

  if (!profileState || !user) {
    return (
      <div className="min-h-screen bg-[#02050d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Synthesizing Recovery Matrix...</p>
        </div>
      </div>
    )
  }

  // Extract from unified profileState
  const basic = profileState.basicDetails
  const recovery = profileState.recoveryPlan || {}
  const completedNodeIds = profileState.completedNodes || []
  const studySessions = profileState.studySessions || []
  const skills = profileState.selectedSkills || []
  const readiness = profileState.careerReadiness || {}

  // Weak skills display
  const weakSkills = readiness.weakAreas || []

  return (
    <div className="relative min-h-screen bg-[#02050d] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6">
      <Sidebar />
      
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header HUD */}
        <header className="glass rounded-3xl border border-white/5 p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_35%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-emerald-400">AI Recovery Lab</span>
                <h1 className="mt-2 text-3xl font-extrabold text-white flex items-center gap-2">
                  <LifeBuoy className="h-7 w-7 text-emerald-400 animate-pulse" />
                  Adaptive Failure Recovery
                </h1>
                <p className="mt-2 text-xs text-slate-400 max-w-2xl leading-relaxed">
                  The recovery engine continuously listens to your study consistency, quiz histories, and boss battle results. If study rhythm slips, AI recalculates workloads and timeline delays dynamically.
                </p>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3.5 text-center min-w-32">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Consistency State</span>
                  <p className={`mt-1 text-base font-bold font-mono ${recovery.active ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {recovery.active ? 'COOLDOWN' : 'ACTIVE STABLE'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3.5 text-center min-w-32">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Streak Flame</span>
                  <p className="mt-1 text-base font-bold text-orange-400 font-mono flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4 fill-orange-400 text-orange-400" />
                    {basic.streak} Days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Diagnostic Status Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Recovery Overview Diagnostic */}
          <div className="glass rounded-3xl border border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Consistency Telemetry</h2>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Study Blocks logged</span>
                <span className="text-sm font-bold text-white font-mono">{studySessions.length}</span>
              </div>
              <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-slate-400">Completed Roadmap Nodes</span>
                <span className="text-sm font-bold text-white font-mono">{completedNodeIds.length}</span>
              </div>
              <div className="rounded-2xl bg-slate-950 p-4 border border-white/5 flex justify-between items-center">
                <span className="text-xs text-slate-400">Tracked Skills</span>
                <span className="text-sm font-bold text-white font-mono">{skills.length}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Recovery Insights (Centered layout) */}
          <div className="glass rounded-3xl border border-white/5 p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <ShieldAlert className={`h-5 w-5 ${recovery.active ? 'text-orange-400' : 'text-emerald-400'}`} />
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {recovery.active ? 'AI Recovery Plan Activated' : 'System Standby — Consistency Healthy'}
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">Engine updates every 48 hours</span>
              </div>
            </div>

            {recovery.active ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-orange-400 font-mono">Recovery Headline</span>
                  <h3 className="text-base font-bold text-white">{recovery.headline || 'Inactivity Cooldown Detected'}</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Suggestions */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Adjusted Schedule Strategy</span>
                    <ul className="space-y-2">
                      {recovery.suggestions?.map((item: string, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-white/3 p-2 rounded-lg border border-white/5">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Motivations & timeline delays */}
                  <div className="space-y-3">
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Expected Delay Impact</span>
                      <p className="mt-1 text-sm font-bold text-white font-mono">{recovery.timelineDelay}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono flex items-center gap-1 text-cyan-400">
                        <HeartHandshake className="h-3.5 w-3.5" />
                        AI Counselor Motivation
                      </span>
                      <p className="text-xs text-slate-300 leading-normal italic bg-white/3 p-2.5 rounded-lg border border-white/5">
                        "{recovery.motivation}"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <ShieldCheck className="h-10 w-10 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Your study rhythm is within the target parameters!</h3>
                    <p className="text-xs text-slate-400 mt-0.5">The failure recovery engine detected no major consistency breaks. Standby status active.</p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">AI Recommended Next Operations</span>
                  <ul className="mt-2 space-y-2">
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      Keep your daily study sessions consistent to lock in your streak multiplier.
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      Engage with the next Boss fight inside the Career Simulator.
                    </li>
                    <li className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      Regularly review concept guides on completed roadmap nodes.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Failure Diagnostic Matrix footer */}
        <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-blue-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">System Readiness Diagnostics</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Estimated Path Delay</span>
              <p className="mt-2 text-sm text-white font-semibold">{recovery.active ? recovery.timelineDelay : 'None Detected'}</p>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Target Timeline</span>
              <p className="mt-2 text-sm text-white font-semibold">
                {profileState.targetCompletionDate || 'Not Configured'}
              </p>
            </div>
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/5">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Weak Skill Zones</span>
              <div className="flex flex-wrap gap-1 mt-2">
                {weakSkills.length > 0 ? (
                  weakSkills.slice(0, 3).map((w: string, idx: number) => (
                    <span key={idx} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded font-mono uppercase">
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-400 font-mono">None Identified</span>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
