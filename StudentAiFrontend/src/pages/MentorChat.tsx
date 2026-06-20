import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Send, Sparkles, User, BrainCircuit, Lightbulb, Flame, RefreshCw } from 'lucide-react'
import Sidebar from '../components/ui/Sidebar'
import axios from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const CHIP_PROMPTS = [
  'Explain OOP classes and polymorphism.',
  'Generate a 30-day study roadmap for DSA.',
  'What alternative exams can I write if I miss JEE?',
  'Explain dynamic programming with a simple analogy.',
]

export default function MentorChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Salutations, explorer. I am your AI Education Counselor. I navigate the life GPS matrices. How can I steer your education tree today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const typeMessage = (fullText: string) => {
    let currentText = ''
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        currentText += fullText.charAt(index)
        setStreamingText(currentText)
        index++
      } else {
        clearInterval(interval)
        setMessages(prev => [...prev, { role: 'assistant', content: fullText }])
        setStreamingText('')
        setLoading(false)
      }
    }, 12) // Typing speed
  }

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return
    
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('http://localhost:8080/api/chat/message', {
        message: userText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const aiReply = response.data.reply
      typeMessage(aiReply)
    } catch (err) {
      console.error(err)
      // Fallback response matrix based on prompt patterns
      setTimeout(() => {
        let fallback = 'I have queried the counseling matrices. If you need details on specific subjects, try asking about "OOP", "DSA", "JEE", or "Career paths". I am ready to advise!'
        
        const textLower = userText.toLowerCase()
        if (textLower.includes('oop') || textLower.includes('object')) {
          fallback = `Here is a structured explanation of **Object-Oriented Programming (OOP)**:\n\n1. **Classes & Objects**: Think of a class as a blueprint (e.g., Car blueprint) and objects as instances built from it (e.g., your Model S Tesla).\n2. **Inheritance**: Subclasses inherit properties from parent classes. (e.g., ElectricCar inherits from Car).\n3. **Polymorphism**: The ability for different classes to respond to the same method call in their own way. (e.g., both CombustionCar and ElectricCar implement drive(), but combustion burns fuel while electric drains charge).\n4. **Encapsulation**: Restricting direct access to state variables. Access is mediated via getters and setters.\n\n*Suggested Action*: Proceed to the **OOP Principles Node** in your RPG Skill Tree to complete assignments!`
        } else if (textLower.includes('dsa') || textLower.includes('data structure') || textLower.includes('study plan')) {
          fallback = `Here is a **30-Day Master Study Roadmap** to secure DSA capabilities:\n\n* **Days 1-7: Arrays & Sorting**: Learn bubble sort, merge sort, binary search and dynamic array indexing.\n* **Days 8-15: Linear Structures**: Implement Stacks, Queues, Linked Lists, and hash maps from scratch.\n* **Days 16-22: Tree Matrices**: Study Binary Search Trees, BFS, DFS, and recursion depths.\n* **Days 23-30: Graph Strategy & DP**: Implement graph nodes, topological sort, and memoization arrays.\n\n*Motivation Tip*: Clear the **Data Structures Node** in the skill tree to secure +200 XP!`
        } else if (textLower.includes('jee') || textLower.includes('exam') || textLower.includes('failed')) {
          fallback = `Do not worry if JEE Mains scores did not align with your target. Excellent alternate pathways exist:\n\n1. **State-Level Entrances**: Write state engineering exams like MHT-CET, WBJEE, COMEDK, or VITEEE. Many top-tier universities allocate ranks through these.\n2. **Off-Campus Mastery**: Focus directly on open source projects, Leetcode tracking, and full-stack modules. In tech, skills always trump college name.\n3. **BCA / BSc routes**: Consider a BCA degree followed by MCA. This is equivalent to a B.Tech degree in salary scales.\n\n*Action*: Access the **Failure Recovery Module** in the left sidebar for a customized alternative plan.`
        } else if (textLower.includes('motivate') || textLower.includes('motivation')) {
          fallback = `*Counselor Transmission*:\n\n"Every expert developer you admire was once a confused student staring at a compile error they did not understand. Success is not a single leap—it is a sequence of daily commits. Keep your streak active, complete your daily challenge, and let's clear the next RPG node together."`
        }

        typeMessage(fallback)
      }, 800)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6 h-screen flex flex-col justify-between overflow-hidden">
      <Sidebar />

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-between min-h-0">
        
        {/* Chat Header */}
        <header className="glass px-6 py-4 rounded-t-2xl border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/10 p-2 rounded-xl text-purple-400 border border-purple-500/20">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">AI Counselor Mentor</h2>
              <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Groq Llama-3 Pipeline
              </span>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: 'assistant', content: 'Counselor memory reset. What can I steer today?' }])}
            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Chat"
          >
            <RefreshCw className="h-4.5 w-4.5" />
          </button>
        </header>

        {/* Chat History Panel */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-950/20 border-x border-white/5 flex flex-col gap-6">
          {messages.map((msg, idx) => {
            const isAI = msg.role === 'assistant'
            return (
              <div 
                key={idx} 
                className={`flex gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {/* AI Avatar */}
                {isAI && (
                  <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 self-start">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                )}

                {/* Message Bubble */}
                <div 
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                    isAI 
                      ? 'bg-white/4 border border-white/5 text-slate-300' 
                      : 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/15'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {msg.content}
                </div>

                {/* User Avatar */}
                {!isAI && (
                  <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 self-start">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            )
          })}

          {/* Streaming character output simulation */}
          {streamingText && (
            <div className="flex gap-4 justify-start">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 self-start">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div 
                className="max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed bg-white/4 border border-white/5 text-slate-300"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {streamingText}
                <span className="w-1.5 h-4 bg-purple-400 inline-block animate-pulse ml-0.5" />
              </div>
            </div>
          )}

          {/* Static loader dots */}
          {loading && !streamingText && (
            <div className="flex gap-4 justify-start">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 self-start">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div className="bg-white/4 border border-white/5 rounded-2xl px-5 py-4 flex gap-1.5 items-center justify-center">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Action Panel Footer */}
        <footer className="glass p-4 rounded-b-2xl border-t border-white/5 shrink-0 flex flex-col gap-3">
          {/* Prompt Suggestion Chips */}
          {messages.length === 1 && !loading && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CHIP_PROMPTS.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3.5 py-1.5 rounded-full bg-white/4 border border-white/5 text-[10px] font-semibold text-slate-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer shrink-0"
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          )}

          {/* Form input field */}
          <form 
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage(input)
            }}
            className="flex gap-3 items-center"
          >
            <input 
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about roadmaps, exams, recovery strategy..."
              className="flex-1 bg-white/4 border border-white/5 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 cursor-pointer transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </footer>

      </div>
    </div>
  )
}
