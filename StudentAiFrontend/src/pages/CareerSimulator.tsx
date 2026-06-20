import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Gauge,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Cpu,
  Trophy,
  Sword,
  ShieldAlert,
  ShieldCheck,
  Flame,
  Clock,
  ExternalLink,
  Code2,
  CheckCircle,
  AlertTriangle,
  BrainCircuit,
  Zap,
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react'
import axios from 'axios'
import Editor from '@monaco-editor/react'
import { useUserStore } from '../store/useUserStore'
import Sidebar from '../components/ui/Sidebar'
import confetti from 'canvas-confetti'

interface BossQuestion {
  id: string
  type: 'MCQ' | 'MultipleChoice' | 'Scenario' | 'Coding'
  prompt: string
  options?: string[]
}

interface BossChallengePayload {
  bossId: string
  bossName: string
  questions: BossQuestion[]
}

export default function CareerSimulator() {
  const { user, profileState, fetchProfileState, addXP } = useUserStore()
  
  // Fight state
  const [activeBossId, setActiveBossId] = useState<string | null>(null)
  const [activeBossName, setActiveBossName] = useState<string>('')
  const [questions, setQuestions] = useState<BossQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loadingChallenge, setLoadingChallenge] = useState<boolean>(false)
  const [submittingFight, setSubmittingFight] = useState<boolean>(false)
  const [fightResult, setFightResult] = useState<any | null>(null)

  // Cyberpunk RPG enhancements
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number>(300) // 5 minutes (300 seconds)
  const [timerActive, setTimerActive] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingText, setLoadingText] = useState<string>('Loading Challenge...')

  // Timer countdown hook
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimerActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerActive, timeLeft])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const getBossDifficulty = (bossId: string) => {
    const skill = profileState.selectedSkills?.find((s: any) => s.skillName.toLowerCase() === bossId.toLowerCase())
    if (!skill) {
      switch (bossId.toLowerCase()) {
        case 'react': return 'Medium'
        case 'java': return 'Medium'
        case 'dsa': return 'Hard'
        case 'python': return 'Easy'
        case 'ml': return 'Hard'
        default: return 'Medium'
      }
    }
    switch (skill.currentLevel?.toLowerCase()) {
      case 'beginner': return 'Easy'
      case 'intermediate': return 'Medium'
      case 'advanced': return 'Hard'
      default: return 'Medium'
    }
  }

  const getBossXpReward = (bossId: string) => {
    const boss = bosses.find((b: any) => b.id.toLowerCase() === bossId.toLowerCase())
    return boss?.xpReward || 250
  }

  useEffect(() => {
    fetchProfileState()
  }, [])

  if (!profileState || !user) {
    return (
      <div className="min-h-screen bg-[#02050d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Syncing Career Simulator Matrix...</p>
        </div>
      </div>
    )
  }

  // Extract from unified profileState
  const basic = profileState.basicDetails
  const readiness = profileState.careerReadiness || {}
  const readinessBreakdown = readiness.breakdown || {}
  const readinessHistory = readiness.history || []
  const bosses = profileState.bosses || []
  const recovery = profileState.recoveryPlan || {}

  // Current active boss details if fighting
  const upcomingBoss = bosses.find((b: any) => b.status === 'Ready') || bosses.find((b: any) => b.status === 'Locked')
  const defeatedCount = bosses.filter((b: any) => b.status === 'Defeated').length

  const handleLaunchChallenge = async (bossId: string, bossName: string) => {
    setActiveBossId(bossId)
    setActiveBossName(bossName)
    setLoadingChallenge(true)
    setLoadingText('Loading Challenge...')
    setFightResult(null)
    setAnswers({})
    setCurrentQuestionIdx(0)
    setTimeLeft(300)
    setTimerActive(false)
    setError(null)
    try {
      setTimeout(() => setLoadingText('AI generating battle...'), 1500)
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://localhost:8080/api/career/boss/${bossId}/challenge`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response.data as BossChallengePayload
      setQuestions(data.questions || [])
      setTimerActive(true)
    } catch (err: any) {
      console.error('Failed to generate boss challenge', err)
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message || 'Unknown network error'
      setError(`Failed to retrieve boss challenge. [Status: ${status || 'Unknown'}] - ${msg}`)
    } finally {
      setLoadingChallenge(false)
    }
  }

  const handleSelectOption = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSelectMultipleOption = (qId: string, option: string) => {
    const current = Array.isArray(answers[qId]) ? answers[qId] : []
    const next = current.includes(option)
      ? current.filter((item: string) => item !== option)
      : [...current, option]
    setAnswers(prev => ({ ...prev, [qId]: next }))
  }

  const handleTextChange = (qId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }

  const isQuestionAnswered = (q: BossQuestion) => {
    const ans = answers[q.id]
    if (!ans) return false
    if (q.type === 'MultipleChoice') return Array.isArray(ans) && ans.length > 0
    return typeof ans === 'string' && ans.trim().length > 0
  }

  const isChallengeReady = () => {
    return questions.length > 0 && questions.every(q => isQuestionAnswered(q))
  }

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1)
    }
  }

  const handleSubmitFight = async () => {
    if (!activeBossId || submittingFight) return
    setSubmittingFight(true)
    setTimerActive(false)
    setError(null)
    setLoadingText('Evaluating answers...')
    try {
      setTimeout(() => setLoadingText('Generating readiness report...'), 1500)
      const token = localStorage.getItem('token')
      const submission = {
        bossId: activeBossId,
        answers: Object.entries(answers).map(([id, response]) => ({
          questionId: id,
          response: response
        }))
      }
      const response = await axios.post(`http://localhost:8080/api/career/boss/${activeBossId}/evaluate`, submission, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = response.data
      setFightResult(result)
      
      // Update global operating system state
      await fetchProfileState()

      if (result.passed) {
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ['#EF4444', '#10B981', '#3B82F6']
        })
      }
    } catch (err: any) {
      console.error('Battle evaluation failure', err)
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message || 'Unknown network error'
      setError(`Evaluation submission failed. [Status: ${status || 'Unknown'}] - ${msg}`)
      setTimerActive(true) // let them retry
    } finally {
      setSubmittingFight(false)
    }
  }

  const handleCloseBattle = () => {
    setActiveBossId(null)
    setQuestions([])
    setAnswers({})
    setFightResult(null)
    setTimerActive(false)
    setError(null)
  }

  return (
    <div className="relative min-h-screen bg-[#02050d] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6">
      <Sidebar />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cyberpunk Header HUD */}
        <header className="glass rounded-3xl border border-white/5 p-8 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12),transparent_35%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-red-500">RPG Career Simulator</span>
                <h1 className="mt-2 text-3xl font-extrabold text-white flex items-center gap-2">
                  <Sword className="h-7 w-7 text-red-500 animate-pulse" />
                  Boss Arena & Readiness Matrix
                </h1>
                <p className="mt-2 text-xs text-slate-400 max-w-2xl leading-relaxed">
                  Engage with professional technology bosses. All challenges are generated dynamically by Llama-3.3-70b. Submit code outlines, solve design scenarios, and secure career readiness badges.
                </p>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3.5 text-center min-w-32">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Defeated Bosses</span>
                  <p className="mt-1 text-2xl font-bold text-emerald-400 font-mono">{defeatedCount}</p>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3.5 text-center min-w-32">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Level Indicator</span>
                  <p className="mt-1 text-2xl font-bold text-purple-400 font-mono">LVL {basic.level}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Inactivity Recovery Alert Banner */}
        {recovery.active && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3 shadow-md shadow-red-500/3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0 animate-bounce" />
            <div>
              <h4 className="text-xs font-bold text-red-400 font-mono uppercase tracking-wider">OS Recovery Mode Active</h4>
              <p className="text-xs text-slate-300 mt-1">{recovery.motivation}</p>
            </div>
          </div>
        )}

        {/* Dynamic Fighting Section Backdrop Modal */}
        {activeBossId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="w-full max-w-3xl glass rounded-3xl border border-blue-500/20 bg-slate-950/95 p-6 space-y-6 shadow-2xl relative my-8">
              
              {/* Modal Title Banner */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] font-mono tracking-widest text-blue-400 uppercase">Interactive Battle Sequence</span>
                  <h3 className="mt-0.5 text-xl font-bold text-white flex items-center gap-2">
                    ⚔ Fighting: {activeBossName}
                  </h3>
                </div>
                <button 
                  onClick={handleCloseBattle} 
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Combat HUD metrics bar */}
              {!loadingChallenge && !submittingFight && !fightResult && questions.length > 0 && (
                <div className="grid grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                  <div className="text-center p-2 rounded-xl bg-white/3">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono font-bold">Difficulty</span>
                    <p className="text-xs font-bold text-amber-400 font-mono mt-0.5">{getBossDifficulty(activeBossId)}</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/3">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono font-bold">XP Reward</span>
                    <p className="text-xs font-bold text-cyan-400 font-mono mt-0.5">+{getBossXpReward(activeBossId)} XP</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/3 flex flex-col justify-center items-center">
                    <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono font-bold flex items-center gap-1">
                      <Clock className="h-3 w-3 text-red-500 animate-pulse" /> Time Left
                    </span>
                    <p className="text-xs font-bold text-red-400 font-mono mt-0.5">{formatTime(timeLeft)}</p>
                  </div>
                </div>
              )}

              {/* Progress Slider */}
              {!loadingChallenge && !submittingFight && !fightResult && questions.length > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Progress</span>
                    <span>{Math.round(((currentQuestionIdx + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error log alert overlay */}
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-950/40 p-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <h4 className="text-sm font-bold uppercase tracking-wider font-mono">System Exception Logged</h4>
                  </div>
                  <p className="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded-lg border border-white/5 break-all max-h-32 overflow-y-auto">
                    {error}
                  </p>
                  <div className="flex justify-end">
                    <button 
                      onClick={() => setError(null)} 
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 text-[9px] uppercase tracking-wider font-bold rounded-lg cursor-pointer"
                    >
                      Clear Alert
                    </button>
                  </div>
                </div>
              )}

              {loadingChallenge ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 font-mono text-xs">
                  <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>{loadingText}</span>
                </div>
              ) : submittingFight ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 font-mono text-xs">
                  <div className="h-8 w-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <span>{loadingText}</span>
                </div>
              ) : fightResult ? (
                <div className="rounded-2xl p-6 border border-white/5 bg-white/3 space-y-5">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white mb-3 shadow-lg ${fightResult.passed ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                      {fightResult.passed ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <h4 className={`text-lg font-bold ${fightResult.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fightResult.passed ? 'VICTORY IN THE ARENA!' : 'BATTLE COMPLETED'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Combat Rating: {fightResult.score}% graded score</p>
                  </div>

                  {/* Readiness HUD inside Fight result */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-3">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Updated Readiness HUD</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="p-2 rounded-lg bg-white/3 border border-white/5 text-center">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Internship</span>
                        <p className="text-sm font-bold text-blue-400 font-mono mt-0.5">{fightResult.internshipReady || 0}%</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/3 border border-white/5 text-center">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Placement</span>
                        <p className="text-sm font-bold text-purple-400 font-mono mt-0.5">{fightResult.placementReady || 0}%</p>
                      </div>
                      <div className="p-2 rounded-lg bg-white/3 border border-white/5 text-center">
                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Interview</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{fightResult.interviewReady || 0}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Grading Suggestions</span>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {fightResult.suggestions?.map((s: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">• <span>{s}</span></li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/5">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Recommended Growth Projects</span>
                      <ul className="mt-2 space-y-1 text-xs text-slate-300">
                        {fightResult.projectsNeeded?.map((p: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">🚀 <span>{p}</span></li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                      onClick={handleCloseBattle}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10"
                    >
                      Return to Arena
                    </button>
                  </div>
                </div>
              ) : (
                // Active single question card view
                <div className="space-y-6">
                  {questions[currentQuestionIdx] && (
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider">
                          Question {currentQuestionIdx + 1} of {questions.length} • {questions[currentQuestionIdx].type}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white leading-relaxed">{questions[currentQuestionIdx].prompt}</p>

                      <div className="mt-3 space-y-2">
                        {questions[currentQuestionIdx].type === 'MCQ' && questions[currentQuestionIdx].options?.map(opt => (
                          <label key={opt} className={`flex items-center gap-3 rounded-xl bg-white/3 p-2.5 cursor-pointer border hover:border-white/10 hover:bg-white/5 ${answers[questions[currentQuestionIdx].id] === opt ? 'border-blue-500/60 bg-blue-500/5' : 'border-transparent'}`}>
                            <input 
                              type="radio" 
                              name={questions[currentQuestionIdx].id}
                              checked={answers[questions[currentQuestionIdx].id] === opt}
                              onChange={() => handleSelectOption(questions[currentQuestionIdx].id, opt)}
                              className="h-4.5 w-4.5 accent-cyan-400"
                            />
                            <span className="text-xs text-slate-200">{opt}</span>
                          </label>
                        ))}

                        {questions[currentQuestionIdx].type === 'MultipleChoice' && questions[currentQuestionIdx].options?.map(opt => {
                          const isChecked = Array.isArray(answers[questions[currentQuestionIdx].id]) && answers[questions[currentQuestionIdx].id].includes(opt)
                          return (
                            <label key={opt} className={`flex items-center gap-3 rounded-xl bg-white/3 p-2.5 cursor-pointer border hover:border-white/10 hover:bg-white/5 ${isChecked ? 'border-blue-500/60 bg-blue-500/5' : 'border-transparent'}`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => handleSelectMultipleOption(questions[currentQuestionIdx].id, opt)}
                                className="h-4.5 w-4.5 accent-cyan-400"
                              />
                              <span className="text-xs text-slate-200">{opt}</span>
                            </label>
                          )
                        })}

                        {questions[currentQuestionIdx].type === 'Scenario' && (
                          <textarea 
                            rows={4}
                            value={answers[questions[currentQuestionIdx].id] || ''}
                            onChange={(e) => handleTextChange(questions[currentQuestionIdx].id, e.target.value)}
                            placeholder="Explain your debugging design or logic steps..."
                            className="w-full bg-[#030b12] border border-white/10 focus:border-blue-500 rounded-xl p-3.5 text-xs text-slate-200 font-mono outline-none transition-colors resize-none shadow-inner"
                          />
                        )}

                        {questions[currentQuestionIdx].type === 'Coding' && (
                          <div className="border border-white/10 rounded-xl overflow-hidden mt-2 bg-[#02050d]">
                            <Editor
                              height="250px"
                              defaultLanguage={activeBossId === 'java' ? 'java' : activeBossId === 'python' ? 'python' : 'javascript'}
                              theme="vs-dark"
                              value={answers[questions[currentQuestionIdx].id] || ''}
                              onChange={(value) => handleTextChange(questions[currentQuestionIdx].id, value || '')}
                              options={{
                                minimap: { enabled: false },
                                fontSize: 12,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <button 
                      onClick={handleCloseBattle}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Retreat
                    </button>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handleBack}
                        disabled={currentQuestionIdx === 0}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back
                      </button>

                      {currentQuestionIdx < questions.length - 1 ? (
                        <button
                          onClick={handleNext}
                          disabled={!questions[currentQuestionIdx] || !isQuestionAnswered(questions[currentQuestionIdx])}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                        >
                          Next <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={handleSubmitFight}
                          disabled={!isChallengeReady()}
                          className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-red-500/20 flex items-center gap-1.5"
                        >
                          <Zap className="h-4 w-4" />
                          Launch Attack
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Grid: Arena & Stats */}
        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          
          {/* RPG Boss Arena Panel */}
          <div className="space-y-6">
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sword className="h-5 w-5 text-red-500" />
                <div>
                  <h2 className="text-lg font-bold text-white">Boss Combat Arena</h2>
                  <p className="text-xs text-slate-400">Select active targets to launch coding challenges and secure experience points.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {bosses.map((boss: any) => {
                  let badgeColor = 'bg-slate-800 text-slate-500 border-slate-700/55 opacity-60'
                  let cardBorder = 'border-white/5'
                  let btnColor = 'bg-white/5 text-slate-400 hover:bg-white/10 cursor-pointer'

                  if (boss.status === 'Defeated') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    cardBorder = 'border-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.04)] bg-emerald-500/2'
                    btnColor = 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer'
                  } else if (boss.status === 'Ready') {
                    badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/25 animate-pulse'
                    cardBorder = 'border-blue-500/25 shadow-[0_0_15px_rgba(59,130,246,0.06)] hover:border-blue-500/50'
                    btnColor = 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 cursor-pointer'
                  }

                  return (
                    <div 
                      key={boss.id} 
                      className={`rounded-2xl bg-white/3 border p-4.5 flex flex-col justify-between gap-4 transition-all duration-300 ${cardBorder}`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-bold font-mono tracking-wider ${badgeColor}`}>
                            {boss.status}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">+{boss.xpReward} XP</span>
                        </div>
                        <h3 className="text-base font-bold text-white pt-1">{boss.name}</h3>
                        <p className="text-xs text-slate-400 leading-normal">
                          {boss.status === 'Defeated' 
                            ? `Combat cleared! The ${boss.name} has been indexed.`
                            : boss.status === 'Ready' 
                            ? `Attack vector unlocked. Click launch to challenge the ${boss.name}.`
                            : `Combat locked. Defeat prior bosses to unlock the ${boss.name} tree.`
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => handleLaunchChallenge(boss.id, boss.name)}
                        disabled={boss.status === 'Locked'}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed ${btnColor}`}
                      >
                        {boss.status === 'Defeated' ? 'Replay Battle' : boss.status === 'Ready' ? 'Launch Battle' : 'LOCKED'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Cognitive Diagnostics Assessment Center */}
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-5 w-5 text-cyan-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Diagnostic Assessment Center</h2>
                  <p className="text-xs text-slate-400">Establish your baseline cognitive profile. Triggers strengths, weaknesses, and goal mappings.</p>
                </div>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {basic.diagnosticComplete ? '✓ Cognitive Diagnostics Complete' : 'Cognitive Diagnostics Pending'}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md leading-relaxed">
                    Our 50-likert cognitive audit maps PCM/PCB matrices, code analysis, and learning styles dynamically via Llama.
                  </p>
                </div>
                <Link 
                  to="/assessment"
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-cyan-500/10 shrink-0 text-center"
                >
                  {basic.diagnosticComplete ? 'Retake Diagnostics' : 'Begin Assessment'}
                </Link>
              </div>
            </section>
          </div>

          {/* Readiness Dashboard Command Panel */}
          <aside className="space-y-6">
            
            {/* Readiness Gauges */}
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <Gauge className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-bold text-white">Career Readiness HUD</h2>
              </div>

              <div className="space-y-4">
                <ReadinessBar label="Internship Ready" percent={readiness.internshipReady || 0} color="from-blue-600 to-cyan-400 shadow-blue-500/10" />
                <ReadinessBar label="Placement Ready" percent={readiness.placementReady || 0} color="from-purple-600 to-pink-500 shadow-purple-500/10" />
                <ReadinessBar label="Technical Interview" percent={readiness.interviewReady || 0} color="from-emerald-600 to-teal-400 shadow-emerald-500/10" />
              </div>

              <div className="bg-white/3 border border-white/5 rounded-2xl p-4 space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Timeline Recommendation</span>
                <p className="text-xs text-white leading-relaxed">{readiness.estimatedTimeline || 'Complete diagnostic quizzes and defeat bosses to calculate estimated timeline.'}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                {/* Weak skills */}
                {readiness.weakAreas && readiness.weakAreas.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Weak Areas Identified</span>
                    <div className="flex flex-wrap gap-1.5">
                      {readiness.weakAreas.map((w: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded font-mono">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {readiness.improvementSuggestions && readiness.improvementSuggestions.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono">Improvement Roadmap</span>
                    <ul className="space-y-1.5 text-[11px] text-slate-300">
                      {readiness.improvementSuggestions.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1">• <span>{s}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Readiness Breakdown */}
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Readiness Breakdown</h2>
              </div>
              <div className="grid gap-3">
                {Object.entries(readinessBreakdown).map(([label, payload]: any) => (
                  <div key={label} className="bg-slate-950/80 border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wide font-mono mb-2">
                      <span>{label}</span>
                      <span>{payload.score || 0}%</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{payload.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Readiness Snapshot History */}
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-slate-300" />
                <h2 className="text-lg font-bold text-white">Snapshot Timeline</h2>
              </div>
              <div className="space-y-3">
                {readinessHistory.length > 0 ? readinessHistory.slice(0, 5).map((entry: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 text-xs text-slate-300">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span>{entry.date.substring(0, 10)}</span>
                      <span className="uppercase text-slate-400">{entry.type || 'AUTO'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
                      <span>Score {entry.score}%</span>
                      <span>{entry.internshipReady}% Internship</span>
                      <span>{entry.interviewReady}% Interview</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-slate-500">No readiness snapshots available yet. They will appear after boss fights, assessments, and roadmap updates.</p>
                )}
              </div>
            </section>
          </aside>
        </div>

            {/* Quick Metrics */}
            <section className="glass rounded-3xl border border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Simulation Metrics</h2>
              </div>
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Ready Confidence</span>
                  <p className="text-lg font-bold text-white font-mono">{readiness.confidence || 0}%</p>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Available Coins</span>
                  <p className="text-lg font-bold text-yellow-400 font-mono">{basic.coins} c</p>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Current Rank</span>
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wide font-mono mt-1">
                    {basic.level >= 10 ? 'Elite Builder' : 'Explorer'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/3 border border-white/5 p-3">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 font-mono">Weekly Mission</span>
                  <p className="text-xs font-bold text-slate-300 truncate mt-1">Defeat next boss</p>
                </div>
              </div>
            </section>
      </div>
    </div>
  )
}

function ReadinessBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{percent}%</span>
      </div>
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500 shadow-md`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
