import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import {
  ArrowRight,
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Stopwatch,
  Target,
  Trophy,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Rocket,
  Compass,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'
import confetti from 'canvas-confetti'

const stepLabels = [
  'Basic Details',
  'Target Career',
  'Skills Selection',
  'Current Levels',
  'Availability',
  'Learning Preferences',
  'Target Date',
  'AI Analysis'
]

const careerOptions = [
  'AI Engineer',
  'Data Scientist',
  'Backend Developer',
  'Fullstack Engineer',
  'Cybersecurity Engineer',
  'Cloud Engineer',
  'Game Developer',
  'Researcher',
  'Startup Founder'
]

const skillOptions = [
  'React',
  'Java',
  'Spring Boot',
  'DSA',
  'AWS',
  'Python',
  'TensorFlow',
  'Docker',
  'System Design'
]

const learningStyles = [
  'Videos',
  'Books',
  'Projects',
  'Articles',
  'Challenges',
  'Interactive Labs'
]

const deadlineOptions = ['3 months', '6 months', '1 year']

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, setUser, fetchProfileState } = useUserStore()

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([])
  const [activeLogIndex, setActiveLogIndex] = useState(-1)
  const [progressPercent, setProgressPercent] = useState(0)

  // Step 1: Basic Details
  const [basicDetails, setBasicDetails] = useState({
    name: '',
    age: '',
    country: '',
    education: '',
    semester: ''
  })

  // Step 2: Target Career
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')

  // Step 3: Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState('')

  // Step 4: Levels
  const [skillLevels, setSkillLevels] = useState<Record<string, string>>({})

  // Step 5: Availability
  const [availability, setAvailability] = useState(
    days.map((day) => ({ day, hours: day === 'Saturday' || day === 'Sunday' ? 3 : 2 }))
  )
  const [weeklyPreset, setWeeklyPreset] = useState('15 hours')

  // Step 6: Learning Preferences
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])

  // Step 7: Deadline
  const [deadline, setDeadline] = useState('6 months')
  const [customDeadline, setCustomDeadline] = useState('')

  // Sync skill default values when skills list updates
  useEffect(() => {
    const nextLevels = { ...skillLevels }
    selectedSkills.forEach((skill) => {
      if (!nextLevels[skill]) {
        nextLevels[skill] = 'Beginner'
      }
    })
    // Remove unused skills
    Object.keys(nextLevels).forEach((k) => {
      if (!selectedSkills.includes(k)) {
        delete nextLevels[k]
      }
    })
    setSkillLevels(nextLevels)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkills])

  // Load from local storage if available
  useEffect(() => {
    const stored = localStorage.getItem('student_profile')
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (parsed.basicDetails) setBasicDetails(parsed.basicDetails)
      if (parsed.goals) setSelectedGoals(parsed.goals)
      if (parsed.skills) setSelectedSkills(parsed.skills)
      if (parsed.skillLevels) setSkillLevels(parsed.skillLevels)
      if (parsed.availability) setAvailability(parsed.availability)
      if (parsed.learningPreferences) setSelectedStyles(parsed.learningPreferences)
      if (parsed.deadline) {
        if (deadlineOptions.includes(parsed.deadline)) {
          setDeadline(parsed.deadline)
        } else {
          setDeadline('Custom')
          setCustomDeadline(parsed.deadline)
        }
      }
    } catch (e) {
      console.warn('Could not parse cached onboarding data', e)
    }
  }, [])

  // Presets mapping
  const applyPreset = (preset: string) => {
    setWeeklyPreset(preset)
    const hours = preset === '10 hours' ? 10 : preset === '15 hours' ? 15 : 25
    const base = Math.floor(hours / 7)
    const remainder = hours % 7
    setAvailability((current) =>
      current.map((entry, index) => ({
        ...entry,
        hours: base + (index < remainder ? 1 : 0)
      }))
    )
  }

  const toggleValue = (value: string, currentList: string[], setFn: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentList.includes(value)) {
      setFn(currentList.filter((item) => item !== value))
    } else {
      setFn([...currentList, value])
    }
  }

  const addCustomItem = (value: string, setter: React.Dispatch<React.SetStateAction<string>>, setArray: React.Dispatch<React.SetStateAction<string[]>>, array: string[]) => {
    const trimmed = value.trim()
    if (!trimmed || array.includes(trimmed)) return
    setArray([...array, trimmed])
    setter('')
  }

  // Input Validation per step
  const validateStep = (): boolean => {
    setError('')
    switch (step) {
      case 0:
        if (!basicDetails.name.trim()) return failValidation('Full name is required.')
        if (!basicDetails.age.trim() || Number(basicDetails.age) < 10) return failValidation('Please enter a valid age (10+).')
        if (!basicDetails.country.trim()) return failValidation('Country is required.')
        if (!basicDetails.education) return failValidation('Please select your current education stage.')
        return true
      case 1:
        if (selectedGoals.length === 0) return failValidation('Select at least one career path or enter a custom goal.')
        return true
      case 2:
        if (selectedSkills.length === 0) return failValidation('Please select at least one skill to wishlist.')
        return true
      case 3:
        return true
      case 4:
        const totalHours = availability.reduce((acc, curr) => acc + curr.hours, 0)
        if (totalHours <= 0) return failValidation('Weekly hours must be greater than zero. Setup study blocks.')
        return true
      case 5:
        if (selectedStyles.length === 0) return failValidation('Please select at least one learning preference.')
        return true
      case 6:
        if (deadline === 'Custom' && !customDeadline) return failValidation('Please choose a valid completion date.')
        return true
      default:
        return true
    }
  }

  const failValidation = (msg: string): boolean => {
    setError(msg)
    return false
  }

  const handleNext = () => {
    if (validateStep()) {
      setStep((curr) => curr + 1)
    }
  }

  const handleBack = () => {
    setError('')
    if (step > 0) {
      setStep((curr) => curr - 1)
    }
  }

  // Submit and launch terminal logging pipeline
  const handleSubmitOnboarding = async () => {
    setError('')
    setLoading(true)
    setTerminalLogs([])
    setActiveLogIndex(0)
    setProgressPercent(5)

    const payload = {
      profile: basicDetails,
      goals: selectedGoals,
      skills: selectedSkills.map((skill) => ({
        skillName: skill,
        currentLevel: skillLevels[skill] ?? 'Beginner',
        targetLevel: 'Advanced',
        status: 'Planned'
      })),
      availability: availability.map((a) => ({ day: a.day, availableHours: a.hours })),
      learningPreferences: selectedStyles,
      deadline: deadline === 'Custom' ? customDeadline : deadline
    }

    console.log('[OnboardingPage] Submitting payload:', payload)

    // Setup animated logs sequence
    const logMessages = [
      'Establishing connection with LLama-3.3 Core Daemon...',
      'Analyzing career goal vectors...',
      'Mapping core curriculum milestones...',
      'Synthesizing personalized study schedules...',
      'Constructing simulator boss battles...',
      'Assembling interactive recovery checkpoints...',
      'Synchronizing profile schemas in central DB...',
      'Configuring StudentAI Educational OS Dashboard...'
    ]

    let logCounter = 0
    const logInterval = setInterval(() => {
      if (logCounter < logMessages.length) {
        setTerminalLogs((prev) => [...prev, `[PROCESS] ${logMessages[logCounter]}`])
        logCounter++
        setProgressPercent(Math.floor((logCounter / logMessages.length) * 95))
      } else {
        clearInterval(logInterval)
      }
    }, 700)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        'http://localhost:8080/api/planner/onboarding',
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('[OnboardingPage] Response received:', response)

      // Cache locally
      localStorage.setItem('student_profile', JSON.stringify(payload))
      localStorage.setItem('student_goals', JSON.stringify(selectedGoals))
      localStorage.setItem('student_skills', JSON.stringify(selectedSkills))
      localStorage.setItem('student_availability', JSON.stringify(availability))
      localStorage.setItem('learning_preferences', JSON.stringify(selectedStyles))

      // Wait for animation to finish
      const timeElapsed = logCounter * 700
      const remainingTime = Math.max(0, 5800 - timeElapsed)
      await new Promise((resolve) => setTimeout(resolve, remainingTime))

      // Finish log sequence
      setTerminalLogs((prev) => [...prev, '[SUCCESS] Student Profile synchronization complete!'])
      setProgressPercent(100)
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Update user context
      if (user) {
        setUser({ ...user, activeMission: 'Onboarding completed successfully' })
      }

      await fetchProfileState()

      // Explosive confetti
      setIsSuccess(true)
      setLoading(false)
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981']
      })
    } catch (err: any) {
      clearInterval(logInterval)
      console.error('[OnboardingPage] Error submitting onboarding:', err)
      console.error('[OnboardingPage] Server response data:', err.response?.data)

      let detailedError = 'Unable to generate student profile.'
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          detailedError = err.response.data
        } else if (err.response.data.message) {
          detailedError = err.response.data.message
        } else {
          detailedError = JSON.stringify(err.response.data)
        }
      } else if (err.message) {
        detailedError = err.message
      }

      setTerminalLogs((prev) => [
        ...prev,
        `[CRITICAL ERROR] Operation aborted: ${detailedError}`
      ])
      setError(detailedError)
      setLoading(false)
      setStep(7) // return to summary step to review and retry
    }
  }

  // Render Wizard Forms
  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 1</span>
              <h2 className="text-3xl font-bold text-white mt-1">Tell us your story</h2>
              <p className="text-sm text-slate-400 mt-1">We personalize your workspace based on your local context.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Full Name</span>
                <input
                  type="text"
                  placeholder="Alice Vance"
                  value={basicDetails.name}
                  onChange={(e) => setBasicDetails({ ...basicDetails, name: e.target.value })}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Age</span>
                <input
                  type="number"
                  placeholder="21"
                  min={10}
                  max={120}
                  value={basicDetails.age}
                  onChange={(e) => setBasicDetails({ ...basicDetails, age: e.target.value })}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Country</span>
                <input
                  type="text"
                  placeholder="United States"
                  value={basicDetails.country}
                  onChange={(e) => setBasicDetails({ ...basicDetails, country: e.target.value })}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Stage/Semester</span>
                <input
                  type="text"
                  placeholder="Semester 5, 3rd Year"
                  value={basicDetails.semester}
                  onChange={(e) => setBasicDetails({ ...basicDetails, semester: e.target.value })}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-300 font-mono">Education Track</span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['10th Grade', '12th Grade', 'BTech / BS', 'Diploma', 'Working Professional'].map((edu) => (
                  <button
                    key={edu}
                    type="button"
                    onClick={() => setBasicDetails({ ...basicDetails, education: edu })}
                    className={`p-3 rounded-2xl border text-center text-xs font-medium transition-all ${
                      basicDetails.education === edu
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                        : 'border-white/5 bg-slate-950/60 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    {edu}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 2</span>
              <h2 className="text-3xl font-bold text-white mt-1">Select your target career</h2>
              <p className="text-sm text-slate-400 mt-1">What professional nodes do you wish to unlock?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {careerOptions.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleValue(goal, selectedGoals, setSelectedGoals)}
                  className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all relative overflow-hidden ${
                    selectedGoals.includes(goal)
                      ? 'border-cyan-500 bg-cyan-500/15 text-cyan-100 shadow-lg shadow-cyan-500/5'
                      : 'border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{goal}</span>
                    {selectedGoals.includes(goal) && (
                      <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-glow" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-end">
              <label className="flex-1 flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Add Custom Career Ambition</span>
                <input
                  type="text"
                  placeholder="e.g. Embedded AI Specialist"
                  value={customGoal}
                  onChange={(e) => setCustomGoal(e.target.value)}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomItem(customGoal, setCustomGoal, setSelectedGoals, selectedGoals)
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => addCustomItem(customGoal, setCustomGoal, setSelectedGoals, selectedGoals)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl text-sm font-bold border border-white/5"
              >
                Add
              </button>
            </div>

            {selectedGoals.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-wrap gap-2">
                {selectedGoals.map((g) => (
                  <span
                    key={g}
                    className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 3</span>
              <h2 className="text-3xl font-bold text-white mt-1">Select key skills</h2>
              <p className="text-sm text-slate-400 mt-1">Which skills do you want to build on your roadmap?</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleValue(skill, selectedSkills, setSelectedSkills)}
                  className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all relative overflow-hidden ${
                    selectedSkills.includes(skill)
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-100 shadow-lg shadow-indigo-500/5'
                      : 'border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{skill}</span>
                    {selectedSkills.includes(skill) && (
                      <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-glow" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 items-end">
              <label className="flex-1 flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Add Custom Skill</span>
                <input
                  type="text"
                  placeholder="e.g. Next.js, PyTorch"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomItem(customSkill, setCustomSkill, setSelectedSkills, selectedSkills)
                    }
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => addCustomItem(customSkill, setCustomSkill, setSelectedSkills, selectedSkills)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl text-sm font-bold border border-white/5"
              >
                Add
              </button>
            </div>

            {selectedSkills.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 flex flex-wrap gap-2">
                {selectedSkills.map((s) => (
                  <span
                    key={s}
                    className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 4</span>
              <h2 className="text-3xl font-bold text-white mt-1">Rate your level</h2>
              <p className="text-sm text-slate-400 mt-1">Your starter milestone is adjusted according to your skill rank.</p>
            </div>

            {selectedSkills.length === 0 ? (
              <div className="p-6 rounded-2xl border border-amber-500/10 bg-amber-500/5 text-amber-300 text-sm flex gap-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>No skills wishlisted. Go back and select the skills you want to learn.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto pr-2 space-y-4">
                {selectedSkills.map((skill) => (
                  <div key={skill} className="p-4 rounded-2xl border border-white/5 bg-slate-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h4 className="text-md font-bold text-white">{skill}</h4>
                      <p className="text-xs text-slate-500">Pick current competency rank</p>
                    </div>

                    <div className="flex gap-2">
                      {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setSkillLevels({ ...skillLevels, [skill]: lvl })}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                            skillLevels[skill] === lvl
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-950/60 border border-white/5 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 5</span>
              <h2 className="text-3xl font-bold text-white mt-1">Weekly availability</h2>
              <p className="text-sm text-slate-400 mt-1">How many hours can you commit to learning each day?</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {['10 hours', '15 hours', '25 hours'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`px-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
                    weeklyPreset === preset
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-200'
                      : 'border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {preset} / week
                </button>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-3">
              {availability.map((dayObj) => (
                <div key={dayObj.day} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-300">{dayObj.day}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={12}
                      value={dayObj.hours}
                      onChange={(e) => {
                        setWeeklyPreset('')
                        setAvailability(
                          availability.map((a) =>
                            a.day === dayObj.day ? { ...a, hours: Number(e.target.value) } : a
                          )
                        )
                      }}
                      className="w-32 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />
                    <span className="text-xs font-bold text-white font-mono w-12 text-right">
                      {dayObj.hours} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 6</span>
              <h2 className="text-3xl font-bold text-white mt-1">Learning preferences</h2>
              <p className="text-sm text-slate-400 mt-1">Select media formats you engage with most.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {learningStyles.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => toggleValue(style, selectedStyles, setSelectedStyles)}
                  className={`p-4 rounded-2xl border text-left text-sm font-semibold transition-all relative overflow-hidden ${
                    selectedStyles.includes(style)
                      ? 'border-violet-500 bg-violet-500/15 text-violet-100'
                      : 'border-white/5 bg-slate-900/40 text-slate-300 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{style}</span>
                    {selectedStyles.includes(style) && (
                      <div className="h-2 w-2 rounded-full bg-violet-400 shadow-glow" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 7</span>
              <h2 className="text-3xl font-bold text-white mt-1">Target date</h2>
              <p className="text-sm text-slate-400 mt-1">Choose your target completion timeframe.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {deadlineOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setDeadline(opt)
                    setCustomDeadline('')
                  }}
                  className={`p-4 rounded-2xl border text-center text-sm font-semibold transition-all ${
                    deadline === opt
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setDeadline('Custom')}
              className={`w-full p-4 rounded-2xl border text-center text-sm font-semibold transition-all ${
                deadline === 'Custom'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                  : 'border-white/5 bg-slate-900/40 text-slate-400 hover:border-white/10'
              }`}
            >
              Pick Specific Calendar Date
            </button>

            {deadline === 'Custom' && (
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-300 font-mono">Target Date</span>
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>
            )}
          </div>
        )

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">Step 8</span>
              <h2 className="text-3xl font-bold text-white mt-1">Synthesize Student Profile</h2>
              <p className="text-sm text-slate-400 mt-1">Double check your configuration matrix before launching AI OS compiler.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-h-[350px] overflow-y-auto pr-2">
              <div className="p-4 rounded-2xl bg-slate-900/20 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Account Context</span>
                <p className="text-sm font-medium text-white">{basicDetails.name}</p>
                <p className="text-xs text-slate-400">
                  {basicDetails.age} y/o • {basicDetails.country} • {basicDetails.education} ({basicDetails.semester})
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/20 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Target Career</span>
                <p className="text-sm font-medium text-white">{selectedGoals.join(', ')}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/20 border border-white/5 space-y-2 col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Selected Skills & Levels</span>
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((s) => (
                    <span key={s} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-300">
                      {s} ({skillLevels[s] ?? 'Beginner'})
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/20 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">AvailabilityPreset</span>
                <p className="text-sm font-medium text-white">
                  {availability.reduce((acc, curr) => acc + curr.hours, 0)} hours per week
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/20 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Timeline Deadline</span>
                <p className="text-sm font-medium text-white">
                  {deadline === 'Custom' ? customDeadline : deadline}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#03060f] text-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Background Matrix overlays */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-500/20 animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 8 + 4}s`
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-5xl relative z-10">
        <AnimatePresence mode="wait">
          {/* 1. Loading AI Compiler screen */}
          {loading && (
            <motion.div
              key="loading-terminal"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass glass-glow rounded-3xl p-6 sm:p-10 w-full max-w-2xl mx-auto space-y-6 border border-cyan-500/20"
            >
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-cyan-400 animate-pulse" />
                <h3 className="text-xl font-bold font-mono text-white tracking-wide uppercase">
                  AI Profile Synthesis Active
                </h3>
              </div>

              {/* Progress HUD */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-cyan-400">
                  <span>[LLAMA-3.3-70B ORCHESTRATOR]</span>
                  <span>{progressPercent}% COMPLETE</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Logger console */}
              <div className="bg-black/80 rounded-2xl p-5 border border-white/5 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-2 shadow-inner">
                {terminalLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`leading-relaxed ${
                      log.includes('[SUCCESS]')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('[CRITICAL ERROR]')
                        ? 'text-red-400 font-bold'
                        : 'text-cyan-300/90'
                    }`}
                  >
                    {log}
                  </div>
                ))}
                {/* Active blinking cursor log line */}
                {terminalLogs.length < 8 && (
                  <div className="text-cyan-500 animate-pulse flex items-center gap-1">
                    <span>[COMPILING MATRIX MODULES]</span>
                    <span className="h-3 w-1.5 bg-cyan-400 inline-block animate-ping" />
                  </div>
                )}
              </div>

              <div className="text-[10px] text-center text-slate-500 font-mono">
                COMPUTING NEURAL EMBEDDINGS • ROADMAP GRAPHS • ACTIVE DATA PIPELINE
              </div>
            </motion.div>
          )}

          {/* 2. Success screen */}
          {isSuccess && !loading && (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass glass-glow rounded-[32px] p-8 sm:p-12 w-full max-w-lg mx-auto text-center space-y-8 border border-emerald-500/20"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-white tracking-tight">System Synthesis Complete</h2>
                <p className="text-sm text-slate-400">
                  Your StudentAI OS instance is prepared, validated, and ready for deployment.
                </p>
              </div>

              {/* Output validation checklist */}
              <div className="bg-slate-950/60 rounded-2xl border border-white/5 p-5 text-left space-y-3">
                {[
                  'Student Profile Created',
                  'Roadmap Generated',
                  'Schedule Generated',
                  'Dashboard Ready',
                  'Career Simulator Ready'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-md cursor-pointer hover:scale-[1.01]"
              >
                <span>Launch StudentAI OS</span>
                <Rocket className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* 3. Progressive Wizard Form */}
          {!loading && !isSuccess && (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="glass rounded-[32px] overflow-hidden grid md:grid-cols-[280px_1fr] border border-white/10 shadow-2xl shadow-black/80"
            >
              {/* Left Steps Sidebar */}
              <div className="bg-slate-950/80 border-r border-white/5 p-6 space-y-8 flex flex-col justify-between hidden md:flex">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    <span className="font-bold text-xs uppercase tracking-wider font-mono text-white">
                      LifeGPS Architect
                    </span>
                  </div>

                  <div className="space-y-2">
                    {stepLabels.map((lbl, idx) => (
                      <div
                        key={lbl}
                        className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                          idx === step
                            ? 'bg-white/5 text-cyan-400'
                            : idx < step
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}
                      >
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                            idx === step
                              ? 'bg-cyan-500 text-slate-950 font-extrabold'
                              : idx < step
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-xs font-medium truncate">{lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 space-y-2">
                  <div className="flex gap-2 items-center text-cyan-300">
                    <Lightbulb className="h-4 w-4" />
                    <span className="text-xs font-bold font-mono">Compiler Alert</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    The compiler uses actual context data to optimize your calendar matrices and roadmap nodes.
                  </p>
                </div>
              </div>

              {/* Right Content Panel */}
              <div className="p-6 sm:p-10 flex flex-col justify-between min-h-[460px] md:min-h-[520px]">
                {/* Progress Indicators for Mobile */}
                <div className="md:hidden flex items-center justify-between gap-4 mb-6">
                  <span className="text-xs font-bold text-slate-400 font-mono">
                    Step {step + 1} of {stepLabels.length}
                  </span>
                  <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${((step + 1) / stepLabels.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Form contents */}
                <div>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex gap-2 items-center font-medium"
                    >
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Actions */}
                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={step === 0}
                    onClick={handleBack}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold text-slate-300 hover:text-white bg-slate-900/40 border border-white/5 hover:border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>

                  {step < stepLabels.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold px-6 py-3.5 rounded-2xl text-sm shadow-md shadow-cyan-500/10 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitOnboarding}
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold px-7 py-3.5 rounded-2xl text-sm shadow-md shadow-emerald-500/10 hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <span>Generate Student Profile</span>
                      <Sparkles className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
