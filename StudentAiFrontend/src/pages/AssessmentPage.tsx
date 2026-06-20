import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { 
  BrainCircuit, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Award, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Gauge,
  Zap,
  ArrowRight,
  BookOpen
} from 'lucide-react'
import axios from 'axios'
import confetti from 'canvas-confetti'
import Sidebar from '../components/ui/Sidebar'

interface Question {
  id: string | number
  type: 'MCQ' | 'MultipleChoice' | 'Scenario' | 'Short Answer' | string
  prompt: string
  options?: string[]
}

export default function AssessmentPage() {
  const navigate = useNavigate()
  const { user, profileState, fetchProfileState } = useUserStore()

  // State
  const [loading, setLoading] = useState(true)
  const [loadingText, setLoadingText] = useState('Loading Challenge...')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string | number, any>>({})
  
  // Timer State (15 minutes = 900 seconds)
  const [timeLeft, setTimeLeft] = useState(900)
  const [timerActive, setTimerActive] = useState(false)
  const [result, setResult] = useState<any | null>(null)

  // Fetch assessment questions on load
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      setLoadingText('Loading Challenge...')
      setError(null)
      try {
        // AI Onboarding/Challenge status text animation simulation
        setTimeout(() => setLoadingText('AI generating assessment...'), 1500)

        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:8080/api/assessment/start', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        const qList = response.data.questions as Question[]
        if (!qList || qList.length === 0) {
          throw new Error('No questions returned from the server.')
        }
        
        setQuestions(qList)
        setTimerActive(true)
      } catch (err: any) {
        console.error('Failed to start assessment:', err)
        const status = err.response?.status
        const msg = err.response?.data?.message || err.message || 'Unknown network error'
        setError(`Failed to generate assessment. [Status: ${status || 'Unknown'}] - ${msg}`)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [])

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

  if (!user) return null

  // Format countdown string
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Answer selections
  const handleSelectOption = (qId: string | number, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSelectMultipleOption = (qId: string | number, option: string) => {
    const current = Array.isArray(answers[qId]) ? answers[qId] : []
    const next = current.includes(option)
      ? current.filter((item: string) => item !== option)
      : [...current, option]
    setAnswers(prev => ({ ...prev, [qId]: next }))
  }

  const handleTextChange = (qId: string | number, text: string) => {
    setAnswers(prev => ({ ...prev, [qId]: text }))
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1)
    }
  }

  // Submit flow
  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    setTimerActive(false)
    try {
      const token = localStorage.getItem('token')
      
      // Structure answers exactly matching API format
      const submission = {
        answers: Object.entries(answers).map(([id, response]) => ({
          questionId: id,
          response: response
        }))
      }

      const response = await axios.post('http://localhost:8080/api/assessment/submit', submission, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = response.data
      setResult(data)
      
      // Sync operating system state
      await fetchProfileState()

      // Confetti blast on victory
      confetti({
        particleCount: 150,
        spread: 80,
        colors: ['#06B6D4', '#8B5CF6', '#10B981']
      })
    } catch (err: any) {
      console.error('Failed to submit assessment:', err)
      const status = err.response?.status
      const msg = err.response?.data?.message || err.message || 'Unknown network error'
      setError(`Failed to submit assessment. [Status: ${status || 'Unknown'}] - ${msg}`)
      setTimerActive(true) // reactivate timer to retry
    } finally {
      setSubmitting(false)
    }
  }

  const progressPercentage = questions.length > 0 ? Math.round(((currentIdx + 1) / questions.length) * 100) : 0
  const activeQuestion = questions[currentIdx]
  
  // Checking if the active question has been answered
  const isQuestionAnswered = (q: Question) => {
    const ans = answers[q.id]
    if (!ans) return false
    if (q.type === 'MultipleChoice' || q.type === 'Checkbox') {
      return Array.isArray(ans) && ans.length > 0
    }
    return typeof ans === 'string' && ans.trim().length > 0
  }

  // Check if everything is answered
  const isAllAnswered = () => {
    return questions.every(q => isQuestionAnswered(q))
  }

  return (
    <div className="relative min-h-screen bg-[#02050d] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6">
      <Sidebar />

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header HUD */}
        <header className="glass rounded-3xl border border-white/5 p-6 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.1),transparent_35%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-cyan-400 font-bold">Diagnostic Evaluation Center</span>
              <h1 className="mt-1 text-2xl font-black text-white flex items-center gap-2">
                <BrainCircuit className="h-6 w-6 text-cyan-400 animate-pulse" />
                Readiness Diagnostic Test
              </h1>
            </div>
            
            {timerActive && (
              <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/5">
                <Clock className={`h-4.5 w-4.5 ${timeLeft < 120 ? 'text-red-500 animate-bounce' : 'text-cyan-400'}`} />
                <span className={`text-base font-mono font-bold ${timeLeft < 120 ? 'text-red-400' : 'text-slate-200'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Errors display */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-950/40 p-4 space-y-2 relative overflow-hidden">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h4 className="text-sm font-bold uppercase tracking-wider font-mono">System Exception Logged</h4>
            </div>
            <p className="text-xs text-slate-300 font-mono bg-black/40 p-3 rounded-lg border border-white/5 break-all max-h-48 overflow-y-auto">
              {error}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setError(null)} 
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold rounded-lg cursor-pointer"
              >
                Clear Alert
              </button>
            </div>
          </div>
        )}

        {/* Main interactive state machine */}
        <AnimatePresence mode="wait">
          
          {/* 1. Loading Challenge Screen */}
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center min-h-[400px] relative"
            >
              <div className="relative h-16 w-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin" />
                <BrainCircuit className="absolute left-4 top-4 h-8 w-8 text-cyan-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{loadingText}</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Compiling diagnostic vectors, parsing user skill weights, and rendering diagnostic questions...
              </p>
            </motion.div>
          )}

          {/* 2. Submitting answers screen */}
          {submitting && (
            <motion.div
              key="submitting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl p-12 border border-white/5 flex flex-col items-center justify-center text-center min-h-[400px] relative"
            >
              <div className="relative h-16 w-16 mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/10 border-t-purple-400 animate-spin" />
                <Sparkles className="absolute left-4 top-4 h-8 w-8 text-purple-400 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Evaluating answers...</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Analyzing test submissions, scoring response categories, and generating diagnostic readiness report...
              </p>
            </motion.div>
          )}

          {/* 3. Diagnostic Report Screen */}
          {result && !submitting && !loading && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl border border-emerald-500/15 p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_35%)] pointer-events-none" />
              
              <div className="flex flex-col items-center text-center pb-6 border-b border-white/5">
                <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10 border border-emerald-500/20 mb-4 animate-bounce">
                  <Award className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-black text-white">Diagnostic Report Compiled!</h2>
                <p className="text-xs text-slate-400 mt-1">Matrix analysis finished successfully (+{result.xpEarned || 150} XP earned)</p>
              </div>

              {/* Main metrics block */}
              <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                
                {/* Readiness Progress bars */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 space-y-5">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Gauge className="h-4.5 w-4.5 text-cyan-400" />
                    <h3 className="text-xs uppercase tracking-wider font-mono font-bold text-slate-400">Career Readiness HUD</h3>
                  </div>
                  <div className="space-y-4">
                    <ReadinessBar label="Internship Ready" percent={result.internshipReady || 0} color="from-blue-600 to-cyan-400" />
                    <ReadinessBar label="Placement Ready" percent={result.placementReady || 0} color="from-purple-600 to-pink-500" />
                    <ReadinessBar label="Technical Interview" percent={result.interviewReady || 0} color="from-emerald-600 to-teal-400" />
                  </div>
                </div>

                {/* Score HUD summary */}
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold">Diagnostic Score</span>
                    <h3 className="text-4xl font-black font-mono text-cyan-400">{result.score || 0}%</h3>
                    <p className="text-xs text-slate-400 leading-relaxed pt-1">
                      Calculated confidence quotient is {result.confidence || 0}% based on 15 category matrices.
                    </p>
                  </div>
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3 text-[11px] text-slate-300 font-mono mt-3">
                    ⏰ {result.estimatedTimeline || 'Estimated ready in 6-8 weeks.'}
                  </div>
                </div>

              </div>

              {/* Weaknesses / Strengths */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="border border-red-500/10 bg-red-500/3 p-5 rounded-2xl space-y-3">
                  <span className="text-xs font-bold font-mono text-red-400 uppercase tracking-wider block">Identified Weak Areas</span>
                  <div className="flex flex-wrap gap-1.5">
                    {result.weakAreas && result.weakAreas.length > 0 ? (
                      result.weakAreas.map((w: string, i: number) => (
                        <span key={i} className="px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded font-mono font-bold">
                          {w}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">None logged.</span>
                    )}
                  </div>
                </div>

                <div className="border border-white/5 bg-white/3 p-5 rounded-2xl space-y-3">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block">Recommended Projects</span>
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {result.projectsNeeded && result.projectsNeeded.length > 0 ? (
                      result.projectsNeeded.map((p: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">🚀 <span>{p}</span></li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No project reinforcements recommended.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/5 space-y-2">
                  <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider block">AI Counselor Recommendations</span>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                    {result.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/simulator')}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
                >
                  Return to Simulator
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </motion.div>
          )}

          {/* 4. Active Stepper Wizard */}
          {!loading && !submitting && !result && activeQuestion && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass rounded-3xl p-8 border border-white/5 space-y-6 relative overflow-hidden"
            >
              {/* Card Scanline */}
              <div className="scanline" />

              {/* Question HUD */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-500/10 p-2 rounded-xl text-cyan-400 border border-cyan-500/20">
                    <BookOpen className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Question Matrix</h3>
                    <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold">
                      Type: {activeQuestion.type}
                    </span>
                  </div>
                </div>
                
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
                  {currentIdx + 1} / {questions.length}
                </span>
              </div>

              {/* Top Progress bar slider */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Question Prompt */}
              <div className="py-4">
                <p className="text-lg font-bold text-white leading-relaxed">
                  {activeQuestion.prompt}
                </p>
              </div>

              {/* Inputs based on type */}
              <div className="space-y-3">
                
                {/* MCQ (Radio options) */}
                {activeQuestion.type === 'MCQ' && activeQuestion.options?.map((opt, i) => (
                  <label 
                    key={i} 
                    className={`flex items-center gap-3.5 rounded-2xl bg-white/3 p-4 cursor-pointer border transition-all duration-200 hover:bg-white/5 ${answers[activeQuestion.id] === opt ? 'border-cyan-500 bg-cyan-500/5 shadow-md shadow-cyan-500/3' : 'border-transparent'}`}
                  >
                    <input 
                      type="radio" 
                      name={`question_${activeQuestion.id}`}
                      checked={answers[activeQuestion.id] === opt}
                      onChange={() => handleSelectOption(activeQuestion.id, opt)}
                      className="h-5 w-5 accent-cyan-400 shrink-0"
                    />
                    <span className="text-sm text-slate-200">{opt}</span>
                  </label>
                ))}

                {/* MultipleChoice (Checkbox options) */}
                {(activeQuestion.type === 'MultipleChoice' || activeQuestion.type === 'Checkbox') && activeQuestion.options?.map((opt, i) => {
                  const isChecked = Array.isArray(answers[activeQuestion.id]) && answers[activeQuestion.id].includes(opt)
                  return (
                    <label 
                      key={i} 
                      className={`flex items-center gap-3.5 rounded-2xl bg-white/3 p-4 cursor-pointer border transition-all duration-200 hover:bg-white/5 ${isChecked ? 'border-cyan-500 bg-cyan-500/5 shadow-md shadow-cyan-500/3' : 'border-transparent'}`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleSelectMultipleOption(activeQuestion.id, opt)}
                        className="h-5 w-5 accent-cyan-400 shrink-0"
                      />
                      <span className="text-sm text-slate-200">{opt}</span>
                    </label>
                  )
                })}

                {/* Short Answer (Input field) */}
                {activeQuestion.type === 'Short Answer' && (
                  <input 
                    type="text" 
                    value={answers[activeQuestion.id] || ''}
                    onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-[#030b12] border border-white/10 focus:border-cyan-500 rounded-2xl p-4 text-sm text-slate-200 font-mono outline-none transition-colors shadow-inner"
                  />
                )}

                {/* Scenario (Textarea) */}
                {activeQuestion.type === 'Scenario' && (
                  <textarea 
                    rows={5}
                    value={answers[activeQuestion.id] || ''}
                    onChange={(e) => handleTextChange(activeQuestion.id, e.target.value)}
                    placeholder="Describe your design, approach or reasoning details..."
                    className="w-full bg-[#030b12] border border-white/10 focus:border-cyan-500 rounded-2xl p-4 text-sm text-slate-200 font-mono outline-none transition-colors resize-none shadow-inner"
                  />
                )}

              </div>

              {/* Navigation Action Buttons */}
              <div className="flex justify-between items-center border-t border-white/5 pt-5 mt-6">
                <button
                  onClick={handleBack}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                  Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    disabled={!isQuestionAnswered(activeQuestion)}
                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Next
                    <ChevronRight className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!isAllAnswered() || submitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <Zap className="h-4 w-4" />
                    Submit Assessment
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  )
}

// Helpers
function ReadinessBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{percent}%</span>
      </div>
      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
