import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, BrainCircuit, Target, ArrowRight, ShieldCheck, Compass, MessageSquare, Award, HelpCircle } from 'lucide-react'
import { useState } from 'react'

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const features = [
    {
      title: 'Cognitive Diagnostic Quiz',
      desc: 'Evaluate 50 metrics across Logic, Math, Programming, Leadership, and Creativity to pinpoint your exact placement profile.',
      icon: BrainCircuit,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'RPG Cyberpunk Skill Trees',
      desc: 'Level up your skills like a videogame character. Unlock locked nodes, complete Boss missions, and earn XP milestones.',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'AI Counselor & Mentor',
      desc: 'Get live guidance from an experienced education advisor. Streaming chats, personalized resource suggestions, and custom study plans.',
      icon: MessageSquare,
      color: 'from-violet-500 to-purple-500'
    },
    {
      title: 'Failure Recovery Engine',
      desc: 'Missed JEE, low CGPA, or failed placement? Instantly construct alternative routes, off-campus maps, and recovery steps.',
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'Interactive Career Simulator',
      desc: 'Toggle streams like PCM/PCB/Commerce and preview your interactive timeline, future salary growth graphs, and career trends.',
      icon: Compass,
      color: 'from-amber-500 to-orange-500'
    },
    {
      title: 'Gamified Achievement Ledger',
      desc: 'Collect XP, earn badges like "Python Hero" or "DSA Master", maintain streaks, and climb the global leaderboard.',
      icon: Award,
      color: 'from-rose-500 to-red-500'
    }
  ]

  const faqData = [
    {
      q: 'How does the diagnostic quiz determine my learning profile?',
      a: 'The quiz evaluates 50 indicators across logical thinking, technical aptitude, creativity, and leadership. We map these answers using Groq llama-3.3-70b-versatile into a multi-dimensional JSON matrix detailing your strengths, weaknesses, and confidence levels.'
    },
    {
      q: 'What is the failure recovery engine?',
      a: 'In education, failure can be crushing. Our recovery engine simulates secondary fallback options (e.g. state-level tests, resume optimizations, open-source maps) to redirect students immediately from defeat to a practical action plan.'
    },
    {
      q: 'Do I need a paid plan to use the RPG roadmaps?',
      a: 'No! The core educational operating system, including basic roadmaps and the progress tracker, is 100% free. The Premium Tier offers unlimited AI counseling queries and deeper predictive diagnostics.'
    }
  ]

  return (
    <div className="relative min-h-screen grid-bg overflow-x-hidden bg-[#030712] font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[130px]" />
      
      {/* Floating particles background styling */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-blue-500/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 10 + Math.random() * 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            StudentAI LifeGPS
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/auth" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link 
            to="/auth" 
            className="relative group overflow-hidden px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/25 transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="max-w-2xl text-center lg:text-left flex flex-col justify-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              The Educational Operating System is Here
            </span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-5xl md:text-6xl font-bold tracking-tight text-white leading-none mb-6"
          >
            Navigate from Confusion to{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              Career Success
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg"
          >
            LifeGPS behaves like an experienced education counselor. It simulates your academic paths, provides dynamic RPG-style skill roadmaps, and guides you step-by-step.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link 
              to="/auth" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 group transition-all"
            >
              Start Free Diagnosis
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-all"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Hero AI Interactive Visualizer Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-md lg:max-w-none flex justify-center"
        >
          <div className="relative w-80 h-80 md:w-96 md:h-96 rounded-3xl glass glass-glow flex items-center justify-center p-8 overflow-hidden">
            <div className="scanline" />
            
            {/* Pulsing Core */}
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1],
                rotate: 360,
                borderRadius: ["30%", "50%", "30%"]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: 'easeInOut' 
              }}
              className="absolute w-48 h-48 bg-gradient-to-br from-blue-500/30 to-purple-600/30 blur-2xl"
            />
            
            {/* Rings */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute border border-dashed border-blue-500/30 w-72 h-72 rounded-full flex items-center justify-center"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
              className="absolute border border-dashed border-purple-500/20 w-60 h-60 rounded-full flex items-center justify-center"
            />

            {/* Glowing Orb */}
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-gradient-to-tr from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 mb-4">
                <BrainCircuit className="h-8 w-8 text-white animate-pulse" />
              </div>
              <p className="font-display font-semibold text-lg text-white">Counselor Engine</p>
              <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Simulating thousands of educational outcomes in real-time</p>
              <span className="mt-4 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[9px] uppercase tracking-wider">
                Active & Diagnostic ready
              </span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Reinventing Career Advising</h2>
          <p className="text-slate-400 text-lg">No static text files. No boring question sets. Interactive widgets built for the modern developer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="glass glass-glow p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-3xl pointer-events-none" />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} p-3 text-white flex items-center justify-center`}>
                <feat.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-white group-hover:text-blue-400 transition-colors">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Empowering Confusion into Action</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl">
            <p className="text-sm text-slate-300 leading-relaxed italic">"I failed JEE Mains and felt completely directionless. LifeGPS analyzed my profile and mapped an off-campus recovery route. I'm now completing my DSA milestones and got an intern placement."</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">A</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Aryan Sharma</h4>
                <p className="text-[10px] text-slate-500">CSE Freshman</p>
              </div>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <p className="text-sm text-slate-300 leading-relaxed italic">"The RPG Skill tree is addicting. Instead of scrolling through courses, I am clearing nodes and unlocking my Boss missions. It feels exactly like leveling a character in Cyberpunk."</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-purple-500/20 flex items-center justify-center font-bold text-purple-400">T</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Tanya Goel</h4>
                <p className="text-[10px] text-slate-500">MERN Developer</p>
              </div>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <p className="text-sm text-slate-300 leading-relaxed italic">"The live AI Mentor explained complex compiler design ideas in seconds. The custom recovery schedules it builds are extremely precise. Absolutely recommended for any tech student."</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center font-bold text-emerald-400">R</div>
              <div>
                <h4 className="text-sm font-semibold text-white">Rohan Verma</h4>
                <p className="text-[10px] text-slate-500">AI Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-4xl font-bold text-white mb-4">Flexible, transparent plans</h2>
          <p className="text-slate-400">Unlock diagnostic counsel and game-like dashboards.</p>
        </div>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="flex-1 glass p-8 rounded-3xl flex flex-col justify-between border border-white/5 relative">
            <div>
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Explorer Matrix</span>
              <h3 className="font-display text-3xl font-bold text-white mt-2">Free</h3>
              <p className="text-sm text-slate-400 mt-2">Perfect for starting career exploration and progress tracking.</p>
              <ul className="mt-6 flex flex-col gap-3 text-slate-300 text-sm">
                <li className="flex items-center gap-2">✔ Diagnostic MCQ Quiz (50 questions)</li>
                <li className="flex items-center gap-2">✔ Cyberpunk Skill Tree roadmaps</li>
                <li className="flex items-center gap-2">✔ Streak Calendar and Contribution charts</li>
                <li className="flex items-center gap-2">✔ Leaderboard entry</li>
              </ul>
            </div>
            <Link to="/auth" className="mt-8 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 flex items-center justify-center transition-all">
              Join Free
            </Link>
          </div>

          {/* Paid Tier */}
          <div className="flex-1 glass glass-glow p-8 rounded-3xl flex flex-col justify-between border border-blue-500/30 relative overflow-hidden scale-105">
            <div className="absolute top-0 right-0 bg-blue-500 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-lg shadow-blue-500/20">
              Popular
            </div>
            <div>
              <span className="text-xs uppercase font-bold text-blue-400 tracking-wider">LifeGPS Navigator</span>
              <h3 className="font-display text-3xl font-bold text-white mt-2">$9<span className="text-sm font-normal text-slate-400">/mo</span></h3>
              <p className="text-sm text-slate-400 mt-2">Complete access to AI agents, recovery maps, and prediction gauges.</p>
              <ul className="mt-6 flex flex-col gap-3 text-slate-300 text-sm">
                <li className="flex items-center gap-2">✔ Everything in Explorer matrix</li>
                <li className="flex items-center gap-2">✔ Unlimited Groq AI Counselor queries</li>
                <li className="flex items-center gap-2">✔ Failure Recovery Custom Generators</li>
                <li className="flex items-center gap-2">✔ Real-time college and percentile predictions</li>
              </ul>
            </div>
            <Link to="/auth" className="mt-8 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all">
              Go GPS Premium
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="font-display text-4xl font-bold text-white mb-10 text-center flex items-center justify-center gap-3">
          <HelpCircle className="h-8 w-8 text-blue-400" />
          Frequently Asked Questions
        </h2>
        <div className="flex flex-col gap-4">
          {faqData.map((faq, idx) => (
            <div key={idx} className="glass rounded-2xl overflow-hidden transition-all border border-white/5">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left px-6 py-5 font-display font-semibold text-white flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-blue-400 font-bold text-lg">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-5 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black/40 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            <span className="font-display font-bold text-sm text-slate-300">StudentAI LifeGPS</span>
          </div>
          <p>© 2026 StudentAI LifeGPS. All rights reserved. Created for National Hackathon.</p>
        </div>
      </footer>
    </div>
  )
}
