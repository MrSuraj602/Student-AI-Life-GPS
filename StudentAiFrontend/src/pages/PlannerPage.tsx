import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useUserStore } from '../store/useUserStore'
import { Sparkles, ListChecks, CalendarDays, Trophy, Compass, Lightbulb, CheckCircle2, Clock, ChevronRight, X, Check, MessageSquare, Send } from 'lucide-react'
import Sidebar from '../components/ui/Sidebar'

export default function PlannerPage() {
  const { user, fetchProfileState } = useUserStore()
  const [planner, setPlanner] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // Modal and chat state
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [activeModule, setActiveModule] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [userMessage, setUserMessage] = useState('')
  const [toggleLoading, setToggleLoading] = useState<number | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchPlanner = async () => {
    if (!user) return
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:8080/api/planner', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlanner(response.data)
      
      // Update selectedTask if it is currently open, to keep modules synchronized
      if (selectedTask) {
        const updatedTask = response.data.weeklyPlan
          ?.flatMap((day: any) => day.tasks)
          ?.find((t: any) => t.id === selectedTask.id)
        if (updatedTask) {
          setSelectedTask(updatedTask)
          if (activeModule) {
            const updatedMod = updatedTask.modules?.find((m: any) => m.id === activeModule.id)
            if (updatedMod) {
              setActiveModule(updatedMod)
            }
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data || 'Unable to load your AI planner. Please refresh.')
    }
  }

  useEffect(() => {
    const initFetch = async () => {
      setLoading(true)
      await fetchPlanner()
      setLoading(false)
    }
    initFetch()
  }, [user])

  const handleToggleModule = async (taskId: number, moduleId: number) => {
    setToggleLoading(moduleId)
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `http://localhost:8080/api/planner/task/${taskId}/module/${moduleId}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      await fetchPlanner()
      await fetchProfileState()
    } catch (err) {
      console.error('Toggle module failed:', err)
    } finally {
      setToggleLoading(null)
    }
  }

  const loadChatHistory = async (taskId: number, moduleId: number) => {
    setChatLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(
        `http://localhost:8080/api/planner/task/${taskId}/module/${moduleId}/chat`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setChatMessages(response.data || [])
    } catch (err) {
      console.error('Failed to load chat history:', err)
    } finally {
      setChatLoading(false)
    }
  }

  const handleSendChatMessage = async (text: string) => {
    if (!text.trim() || !selectedTask || !activeModule) return
    
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      message: text,
      createdAt: new Date().toISOString()
    }
    setChatMessages(prev => [...prev, tempUserMsg])
    setUserMessage('')
    setChatLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `http://localhost:8080/api/planner/task/${selectedTask.id}/module/${activeModule.id}/chat`,
        { message: text },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setChatMessages(prev => [...prev, response.data])
    } catch (err) {
      console.error('Send message failed:', err)
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    if (selectedTask && activeModule) {
      loadChatHistory(selectedTask.id, activeModule.id)
    } else {
      setChatMessages([])
    }
  }, [activeModule])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatLoading])

  const getTomorrowTopic = () => {
    if (!planner || !planner.weeklyPlan) return 'Rest Day'
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    const todayIndex = new Date().getDay()
    const todayDayOfWeekName = days[(todayIndex + 6) % 7]
    const tomorrowIndex = (days.indexOf(todayDayOfWeekName) + 1) % 7
    const tomorrowDayName = days[tomorrowIndex]

    const tomorrowPlan = planner.weeklyPlan.find((day: any) => day.day === tomorrowDayName)
    if (tomorrowPlan && tomorrowPlan.tasks && tomorrowPlan.tasks.length > 0) {
      const firstTask = tomorrowPlan.tasks[0]
      if (firstTask.type === 'rest') return 'Rest and Recovery'
      return firstTask.title
    }
    return 'Rest Day'
  }

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6">
      <Sidebar />
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="glass rounded-3xl p-8 shadow-2xl shadow-slate-900/20">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-3xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-3 text-white shadow-lg shadow-cyan-500/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">AI Life Planner</p>
                  <h1 className="text-4xl font-bold text-white">Your personalized career roadmap</h1>
                </div>
              </div>
              <p className="text-slate-400 max-w-3xl">This planner uses your onboarding inputs to generate goals, milestones, weekly study tasks, and progress estimates without relying on dummy data.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-slate-100">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Active mission</p>
              <p className="mt-2 font-semibold text-white">{user?.activeMission || 'Complete AI onboarding'}</p>
            </div>
          </div>
        </header>

        {loading && (
          <div className="glass rounded-3xl p-12 text-center text-slate-300">
            <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-sm">Loading your planner...</p>
          </div>
        )}

        {error && (
          <div className="glass rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {!loading && planner && (
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-3">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-soft rounded-3xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <ListChecks className="h-5 w-5 text-cyan-400" />
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Goals</p>
                </div>
                {planner.goals?.length ? (
                  <ul className="space-y-2 text-slate-300">
                    {planner.goals.map((goal: string, index: number) => (
                      <li key={index} className="rounded-2xl bg-white/5 p-3">{goal}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No goals configured yet.</p>
                )}
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="glass-soft rounded-3xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays className="h-5 w-5 text-blue-400" />
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Weekly plan</p>
                </div>
                <p className="text-3xl font-semibold text-white">{planner.weeklyPlan?.length ?? 0} Days</p>
                <p className="text-sm text-slate-500 mt-2">Daily task schedule based on your availability</p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="glass-soft rounded-3xl p-6 border border-white/10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Progress</p>
                </div>
                <p className="text-3xl font-semibold text-white">{planner.completionProgress ?? 0}%</p>
                <p className="text-sm text-slate-500 mt-2">Estimated completion by {planner.estimatedCompletionDate || 'TBD'}</p>
              </motion.div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="glass-soft rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <Compass className="h-5 w-5 text-violet-400" />
                  <h2 className="text-lg font-semibold text-white">Milestones</h2>
                </div>
                {planner.milestones?.length ? (
                  <div className="space-y-4">
                    {planner.milestones.map((milestone: any, index: number) => (
                      <div key={index} className="rounded-3xl bg-slate-950/70 p-4 border border-white/5">
                        <p className="text-sm font-semibold text-white">{milestone.title}</p>
                        <p className="text-sm text-slate-400 mt-2">{milestone.description}</p>
                        <p className="text-xs text-slate-500 mt-3">Target: {milestone.targetDate}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">No milestones available yet.</p>
                )}
              </section>

              <section className="glass-soft rounded-3xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-5">
                  <Lightbulb className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">AI Suggestions</h2>
                </div>
                {planner.aiSuggestions?.length ? (
                  <ul className="space-y-3 text-slate-300">
                    {planner.aiSuggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="rounded-2xl bg-slate-950/70 p-4 border border-white/5">{suggestion}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500">Your planner will generate suggestions once onboarding is complete.</p>
                )}
              </section>
            </div>

            {/* Today's Tasks Interactive Section */}
            <section className="glass-soft rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-5">
                <CalendarDays className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold text-white">Today&apos;s tasks (Click to start learning)</h2>
              </div>
              {planner.todayTasks?.length ? (
                <div className="grid gap-4">
                  {planner.todayTasks.map((task: any, index: number) => {
                    if (task.type === 'rest') {
                      return (
                        <div key={index} className="rounded-3xl bg-slate-950/40 p-5 border border-white/5 flex justify-between items-center text-slate-400">
                          <div>
                            <p className="font-semibold">{task.title}</p>
                            <p className="text-xs mt-1 text-slate-500">Rest and recover strength today!</p>
                          </div>
                          <span className="text-xs rounded-full bg-slate-800 px-3 py-1 text-slate-400">Rest</span>
                        </div>
                      )
                    }
                    const totalModules = task.modules?.length || 0;
                    const completedModules = task.modules?.filter((m: any) => m.completed).length || 0;
                    const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
                    
                    return (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.005, y: -2 }}
                        onClick={() => setSelectedTask(task)}
                        className="rounded-3xl bg-slate-950/70 p-5 border border-white/5 cursor-pointer hover:border-blue-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-3">
                            {task.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-slate-600 shrink-0" />
                            )}
                            <p className="font-semibold text-white text-lg">{task.title}</p>
                          </div>
                          <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-blue-400" /> {task.hours ?? 0} Hours Scheduled
                            {totalModules > 0 && (
                              <span className="text-slate-500">• {completedModules}/{totalModules} modules finished</span>
                            )}
                          </p>
                        </div>
                        {totalModules > 0 && (
                          <div className="flex items-center gap-4">
                            <div className="w-24 bg-white/5 h-2 rounded-full overflow-hidden shrink-0">
                              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-sm text-slate-400 w-10 text-right font-medium">{pct}%</span>
                            <ChevronRight className="h-5 w-5 text-slate-500" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-slate-500">No tasks are scheduled for today yet.</p>
              )}
            </section>

            {/* Weekly Schedule Planner */}
            <section className="glass-soft rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-5">
                <CalendarDays className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Weekly Calendar Planner</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {planner.weeklyPlan?.map((dayPlan: any, dIdx: number) => {
                  const dayName = dayPlan.day;
                  const task = dayPlan.tasks?.[0];
                  const isRest = task?.type === 'rest';
                  
                  return (
                    <motion.div
                      key={dIdx}
                      whileHover={!isRest ? { y: -3 } : {}}
                      onClick={() => {
                        if (!isRest && task) {
                          setSelectedTask(task);
                        }
                      }}
                      className={`rounded-3xl p-5 border flex flex-col justify-between h-40 transition-all ${
                        isRest
                          ? 'bg-slate-950/20 border-white/5 text-slate-500'
                          : 'bg-slate-950/70 border-white/5 hover:border-purple-500/30 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{dayName}</span>
                          {!isRest && task?.completed && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">Done</span>
                          )}
                        </div>
                        <p className={`font-semibold text-sm leading-snug ${isRest ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                          {task?.title || 'Rest Day'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-slate-500">
                          {isRest ? '0 hrs' : `${task?.hours || 0} hrs`}
                        </span>
                        {!isRest && (
                          <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                            Start Study <ChevronRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            <section className="glass-soft rounded-3xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Roadmap progress</h2>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-6 border border-white/5">
                <p className="text-sm text-slate-400 mb-4">Current roadmap completion score</p>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${planner.roadmapProgress ?? 0}%` }} />
                </div>
                <p className="mt-3 text-sm text-slate-300">{Math.round(planner.roadmapProgress ?? 0)}% complete</p>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Interactive Tutor & Module Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-5xl h-[85vh] bg-[#0b0f19] border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl"
            >
              {/* Left Column: Task Info & Modules (60% width) */}
              <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-white/10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full uppercase tracking-wider">
                      {selectedTask.hours} Hour Session
                    </span>
                    <h2 className="text-2xl font-bold text-white mt-2">{selectedTask.title}</h2>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setActiveModule(null);
                    }}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Celebration view when all modules finished */}
                {selectedTask.modules?.length > 0 && selectedTask.modules.every((m: any) => m.completed) ? (
                  <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/5 border border-emerald-500/20 rounded-3xl p-6 mb-6 flex flex-col items-center text-center">
                    <Trophy className="h-12 w-12 text-emerald-400 mb-3" />
                    <h3 className="text-xl font-bold text-emerald-400">Session Completed!</h3>
                    <p className="text-slate-300 text-sm mt-1 max-w-md">
                      Awesome work! You've finished all modules in today's study block, unlocked roadmap progress, and earned active rewards.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-md">
                      <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Modules Finished</span>
                        <p className="text-lg font-bold text-white mt-1">{selectedTask.modules.length}</p>
                      </div>
                      <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl">
                        <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Total XP Earned</span>
                        <p className="text-lg font-bold text-amber-400 mt-1">
                          +{selectedTask.modules.reduce((sum: number, m: any) => sum + m.xpReward, 0)} XP
                        </p>
                      </div>
                      <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl col-span-2 text-left">
                        <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Tomorrow's Topic</span>
                        <p className="text-sm font-semibold text-white mt-1 truncate">{getTomorrowTopic()}</p>
                      </div>
                      <div className="bg-slate-900/60 p-4 border border-white/5 rounded-2xl col-span-2 text-left flex justify-between items-center">
                        <div>
                          <span className="text-[10px] uppercase text-slate-500 tracking-wider font-bold">Career Readiness Progress</span>
                          <p className="text-sm font-semibold text-emerald-400 mt-1">{user?.careerReadyScore || 0}%</p>
                        </div>
                        <div className="w-24 bg-white/5 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400" style={{ width: `${user?.careerReadyScore || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard progress bar indicator */
                  <div className="bg-slate-900/40 p-4 border border-white/5 rounded-2xl mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-slate-400">Session Progress</span>
                      <span className="text-xs font-semibold text-blue-400">
                        {selectedTask.modules?.filter((m: any) => m.completed).length || 0} of {selectedTask.modules?.length || 0} modules done
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                        style={{
                          width: `${
                            selectedTask.modules?.length > 0
                              ? Math.round((selectedTask.modules.filter((m: any) => m.completed).length / selectedTask.modules.length) * 100)
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex-1 space-y-3">
                  <p className="text-xs uppercase text-slate-500 tracking-wider font-bold mb-1">Learning Modules</p>
                  {selectedTask.modules?.map((mod: any) => {
                    const isActive = activeModule?.id === mod.id;
                    return (
                      <div
                        key={mod.id}
                        onClick={() => setActiveModule(mod)}
                        className={`group rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex justify-between items-center ${
                          isActive
                            ? 'bg-blue-500/5 border-blue-500/50 shadow-md shadow-blue-500/5'
                            : 'bg-slate-950/40 border-white/5 hover:border-white/10 hover:bg-slate-950/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleModule(selectedTask.id, mod.id)
                            }}
                            className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center border-2 transition-all cursor-pointer ${
                              mod.completed
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : 'border-slate-500 hover:border-blue-400'
                            }`}
                          >
                            {toggleLoading === mod.id ? (
                              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : mod.completed ? (
                              <Check className="h-4 w-4 stroke-[3]" />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold text-sm truncate ${mod.completed ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                              {mod.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                mod.difficulty?.toLowerCase() === 'beginner'
                                  ? 'bg-cyan-500/10 text-cyan-400'
                                  : mod.difficulty?.toLowerCase() === 'intermediate'
                                  ? 'bg-blue-500/10 text-blue-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}>
                                {mod.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-500">• {mod.duration} mins</span>
                              <span className="text-[10px] text-amber-500 font-semibold">• +{mod.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 group-hover:text-slate-300 pl-2 shrink-0">
                          <span className="text-xs">Tutor</span>
                          <ChevronRight className="h-4 w-4 animate-pulse" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: AI Tutor Chat Panel (40% width) */}
              <div className="w-full md:w-[420px] flex flex-col h-full bg-[#070b13]">
                {activeModule ? (
                  <div className="flex flex-col h-full">
                    {/* Tutor Panel Header */}
                    <div className="p-4 border-b border-white/10 bg-[#080d16] flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase text-blue-400 tracking-widest font-bold">AI Tutor Chatroom</p>
                        <h3 className="font-bold text-white text-sm truncate">{activeModule.title}</h3>
                      </div>
                      <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full font-semibold ml-2 shrink-0">
                        {activeModule.duration}m
                      </span>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="p-2 border-b border-white/5 bg-[#070b13] flex gap-1.5 overflow-x-auto scrollbar-thin">
                      {[
                        { label: 'Explain', query: 'Explain the core concepts of this module simply.' },
                        { label: 'Examples', query: 'Show me clean, commented code examples for this module.' },
                        { label: 'Best Practices', query: 'What are the key professional best practices and common mistakes to avoid?' },
                        { label: 'Quiz', query: 'Give me a mini-quiz question to test my understanding of this module.' },
                        { label: 'Interview Prep', query: 'What are typical interview questions on this topic?' },
                        { label: 'Exercise', query: 'Generate a coding exercise or challenge for me to solve.' },
                        { label: 'Mini Project', query: 'Suggest a small mini project idea that integrates these concepts.' }
                      ].map((act, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => handleSendChatMessage(act.query)}
                          disabled={chatLoading}
                          className="text-xs bg-slate-900 border border-white/5 hover:border-blue-500/30 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all shrink-0 disabled:opacity-50 font-medium"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>

                    {/* Conversational content scroll container */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#05080e]/60 flex flex-col">
                      {chatMessages.length === 0 && !chatLoading ? (
                        <div className="my-auto text-center p-6 space-y-3">
                          <div className="mx-auto h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <h4 className="font-semibold text-slate-300">Welcome to AI Tutor!</h4>
                          <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                            Ask questions, get explanations, request quizzes or code challenges. Select a quick action above or type below.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {chatMessages.map((msg: any) => {
                            const isUser = msg.role === 'user';
                            return (
                              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                <div
                                  className={`max-w-[90%] rounded-2xl p-3.5 text-sm shadow-sm leading-relaxed ${
                                    isUser
                                      ? 'bg-blue-600 text-white rounded-br-none'
                                      : 'bg-slate-900 border border-white/5 text-slate-200 rounded-bl-none whitespace-pre-wrap'
                                  }`}
                                >
                                  {msg.message}
                                </div>
                              </div>
                            )
                          })}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-slate-900 border border-white/5 text-slate-400 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-2">
                                <div className="flex gap-1 shrink-0">
                                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                  <span className="h-2 w-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-xs">Tutor is compiling explanation...</span>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Chat Text Input field */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendChatMessage(userMessage)
                      }}
                      className="p-3 border-t border-white/10 bg-[#080d16] flex gap-2"
                    >
                      <input
                        type="text"
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        disabled={chatLoading}
                        placeholder="Ask custom question..."
                        className="flex-1 bg-slate-950 border border-white/5 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none placeholder-slate-600 disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={chatLoading || !userMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-md shadow-blue-500/10 shrink-0"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <MessageSquare className="h-10 w-10 text-slate-600 mb-3" />
                    <h4 className="font-semibold text-slate-400 text-sm">No Module Selected</h4>
                    <p className="text-xs text-slate-600 max-w-xs mt-1">
                      Select one of the modules on the left to start learning, request code exercises, or ask follow-up questions to your AI Tutor.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
