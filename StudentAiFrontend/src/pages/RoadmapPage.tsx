import { useState, useMemo, useEffect } from 'react'
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Node, 
  Edge,
  Handle,
  Position,
  NodeProps,
  useNodesState,
  useEdgesState
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import { 
  ShieldAlert, 
  BookOpen, 
  Trophy, 
  Sparkles, 
  X, 
  CheckCircle, 
  Lock, 
  Play, 
  Clock, 
  HelpCircle, 
  Terminal, 
  ExternalLink,
  Code2,
  Gauge
} from 'lucide-react'
import Sidebar from '../components/ui/Sidebar'
import confetti from 'canvas-confetti'
import axios from 'axios'

// RPG Node Node Data definition
interface RPGNodeData {
  label: string
  status: 'locked' | 'unlocked' | 'completed' | 'in_progress'
  type: 'skill' | 'boss'
  description: string
  xpReward: number
  difficulty: string
  hours: number
  resources: string[]
  projects: string[]
  interviewQuestions: string[]
  miniChallenges: string[]
}

type CustomNodeType = Node<RPGNodeData>

// Custom Markdown Renderer to display Groq explanations
function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null
  
  const items: JSX.Element[] = []
  const lines = content.split('\n')
  let inCodeBlock = false
  let codeBlockLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        const codeText = codeBlockLines.join('\n')
        items.push(
          <pre key={`code-${i}`} className="bg-[#020b12] border border-blue-500/20 p-3 rounded-lg font-mono text-[9px] text-cyan-400 overflow-x-auto my-2 shadow-inner">
            <code>{codeText}</code>
          </pre>
        )
        codeBlockLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    if (line.startsWith('# ')) {
      items.push(<h2 key={i} className="text-xs font-bold text-white mt-3 mb-1.5 border-l-2 border-cyan-500 pl-2">{line.substring(2)}</h2>)
    } else if (line.startsWith('## ')) {
      items.push(<h3 key={i} className="text-[11px] font-bold text-purple-400 mt-2.5 mb-1.5 uppercase tracking-wider">{line.substring(3)}</h3>)
    } else if (line.startsWith('### ')) {
      items.push(<h4 key={i} className="text-[10px] font-semibold text-blue-400 mt-2 mb-1">{line.substring(4)}</h4>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      items.push(
        <div key={i} className="flex items-start gap-1.5 ml-2 my-0.5">
          <span className="w-1 h-1 bg-cyan-400 rounded-full mt-1.5 shrink-0" />
          <span className="text-[10px] text-slate-300">{line.substring(2)}</span>
        </div>
      )
    } else if (line.trim().length > 0) {
      items.push(<p key={i} className="text-[10px] text-slate-300 leading-normal my-1">{line}</p>)
    }
  }

  return <div className="space-y-0.5 mt-1">{items}</div>
}

// Custom Node Component
function CustomRpgNode({ data }: NodeProps<CustomNodeType>) {
  const isBoss = data.type === 'boss'
  const status = data.status

  let styleClass = ''
  let statusBadge = ''
  let icon = null

  if (status === 'locked') {
    styleClass = 'bg-[#0b0f19]/80 border-slate-800 text-slate-500 opacity-60'
    statusBadge = 'LOCKED'
    icon = <Lock className="h-4 w-4" />
  } else if (status === 'unlocked') {
    styleClass = 'bg-[#0b0f19] border-blue-500/70 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)] cursor-pointer hover:bg-blue-500/5 transition-all'
    statusBadge = 'UNLOCKED'
    icon = <Play className="h-4 w-4 fill-blue-400/20 text-blue-400" />
  } else if (status === 'in_progress') {
    styleClass = 'bg-[#0b0f19] border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(139,92,246,0.3)] border-2 cursor-pointer hover:bg-purple-500/5'
    statusBadge = 'IN PROGRESS'
    icon = <BookOpen className="h-4 w-4" />
  } else if (status === 'completed') {
    styleClass = 'bg-[#0b0f19] border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.2)] cursor-pointer hover:bg-emerald-500/5'
    statusBadge = 'COMPLETED'
    icon = <CheckCircle className="h-4 w-4" />
  }

  if (isBoss) {
    styleClass += ' border-red-600 scale-105 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    statusBadge = `BOSS MISSION • ${statusBadge}`
    icon = <Trophy className="h-4 w-4 text-red-500" />
  }

  const difficultyColors: Record<string, string> = {
    Beginner: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Intermediate: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Advanced: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  }

  return (
    <div className={`px-4 py-3 rounded-2xl border font-sans w-56 text-left relative transition-all duration-300 ${styleClass}`}>
      <Handle type="target" position={Position.Left} className="!bg-slate-700 !w-2.5 !h-2.5" />
      
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={`text-[8px] font-extrabold tracking-widest ${isBoss ? 'text-red-500' : 'text-slate-500'}`}>
            {statusBadge}
          </span>
          {icon}
        </div>
        
        <p className="font-display font-bold text-sm text-white tracking-tight leading-tight">
          {data.label}
        </p>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${difficultyColors[data.difficulty] || 'text-slate-400 bg-slate-500/10'}`}>
            {data.difficulty}
          </span>
          <span className="text-[9px] text-slate-400 font-mono flex items-center gap-0.5">
            <Clock className="h-3 w-3 text-slate-500" />
            {data.hours}h
          </span>
        </div>

        <span className="text-[9px] text-cyan-400/90 font-mono mt-0.5 flex items-center gap-0.5">
          <Sparkles className="h-3 w-3" />
          +{data.xpReward} XP Reward
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-700 !w-2.5 !h-2.5" />
    </div>
  )
}

export default function RoadmapPage() {
  const { completedNodes, completeNode, addXP, profileState, fetchProfileState } = useUserStore()
  const [selectedNode, setSelectedNode] = useState<CustomNodeType | null>(null)
  
  // Elaboration state
  const [elaboration, setElaboration] = useState<string>('')
  const [loadingElab, setLoadingElab] = useState<boolean>(false)

  // Node Chat messages record (persisted per node session)
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{ role: 'user' | 'assistant'; content: string }>>>({})
  const [query, setQuery] = useState<string>('')
  const [sendingQuery, setSendingQuery] = useState<boolean>(false)

  const quickSuggestions = [
    'Core concept explanation?',
    'Show a short code example?',
    'What are typical mistakes?'
  ]

  // Custom Node bindings
  const nodeTypes = useMemo(() => ({ rpgNode: CustomRpgNode }), [])

  // Sync state on load
  useEffect(() => {
    fetchProfileState()
  }, [])

  const roadmapNodes = profileState?.roadmapNodes || []

  // Compute dynamic nodes and edges based on profileState.roadmapNodes
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!roadmapNodes.length) {
      return { flowNodes: [], flowEdges: [] }
    }

    const generatedNodes = roadmapNodes.map((node: any, index: number) => {
      const isCompleted = completedNodes.includes(node.nodeId)
      
      let status: RPGNodeData['status'] = 'locked'
      if (isCompleted) {
        status = 'completed'
      } else if (index === 0 || completedNodes.includes(roadmapNodes[index - 1].nodeId)) {
        status = 'in_progress'
      }

      return {
        id: node.nodeId,
        type: 'rpgNode',
        position: { x: index * 290 + 50, y: index % 2 === 0 ? 140 : 260 },
        data: {
          label: node.title,
          status,
          type: node.bossMission ? 'boss' : 'skill',
          description: node.description,
          xpReward: node.xpReward,
          difficulty: node.difficulty || 'Beginner',
          hours: node.hours || 10,
          resources: node.resources || [],
          projects: node.projects || [],
          interviewQuestions: node.interviewQuestions || [],
          miniChallenges: node.miniChallenges || []
        }
      } as CustomNodeType
    })

    const generatedEdges = roadmapNodes.slice(0, -1).map((node: any, index: number) => {
      const isCompleted = completedNodes.includes(node.nodeId)
      const isNextUnlocked = isCompleted || index === 0
      return {
        id: `e-${node.nodeId}-${roadmapNodes[index + 1].nodeId}`,
        source: node.nodeId,
        target: roadmapNodes[index + 1].nodeId,
        animated: isCompleted,
        style: { 
          stroke: isCompleted ? '#10b981' : isNextUnlocked ? '#3b82f6' : '#1f2937',
          strokeWidth: 2
        }
      } as Edge
    })

    return { flowNodes: generatedNodes, flowEdges: generatedEdges }
  }, [roadmapNodes, completedNodes])

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeType>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Update flow state when dynamic variables change
  useEffect(() => {
    if (flowNodes.length) {
      setNodes(flowNodes)
      setEdges(flowEdges)
    }
  }, [flowNodes, flowEdges])

  const handleNodeClick = (_e: any, node: Node) => {
    const customNode = node as CustomNodeType
    setSelectedNode(customNode)
    setElaboration('')
  }

  // Fetch Groq Elaboration
  const handleElaborate = async (nodeId: string) => {
    setLoadingElab(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`http://localhost:8080/api/roadmap/node/${nodeId}/elaborate`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setElaboration(response.data.elaboration || 'AI was unable to process the node overview.')
    } catch (err) {
      console.error('Elaboration fetch failed', err)
      setElaboration('Error communicating with the AI elaboration matrix. Please check connection.')
    } finally {
      setLoadingElab(false)
    }
  }

  // Node Assistant Message Invocations
  const handleSendNodeQuery = async (messageText: string) => {
    if (!selectedNode || !messageText.trim() || sendingQuery) return
    const nodeId = selectedNode.id
    const currentHistory = chatMessages[nodeId] || []
    
    // Add user message locally
    const updatedHistory = [...currentHistory, { role: 'user', content: messageText } as const]
    setChatMessages(prev => ({ ...prev, [nodeId]: updatedHistory }))
    setQuery('')
    setSendingQuery(true)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(`http://localhost:8080/api/chat/node/${nodeId}/message`,
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const replyText = response.data.reply || 'AI Mentor could not process your query.'
      setChatMessages(prev => ({
        ...prev,
        [nodeId]: [...updatedHistory, { role: 'assistant', content: replyText } as const]
      }))
    } catch (err) {
      console.error('Failed to communicate with AI node chat', err)
      setChatMessages(prev => ({
        ...prev,
        [nodeId]: [...updatedHistory, { role: 'assistant', content: 'Connection offline. Try again.' } as const]
      }))
    } finally {
      setSendingQuery(false)
    }
  }

  const handleCompleteNode = async (nodeId: string, xpReward: number) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `http://localhost:8080/api/roadmap/node/${nodeId}/complete`,
        { xpReward },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      await fetchProfileState()

      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#3B82F6', '#8B5CF6', '#22C55E']
      })
      setSelectedNode(null)
    } catch (err) {
      console.error('Complete node failed', err)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#02050d] text-slate-100 grid-bg font-sans pl-76 pr-6 py-6 h-screen overflow-hidden">
      <Sidebar />

      {/* OS HUD Header */}
      <div className="absolute top-6 left-80 right-6 z-10 flex items-center justify-between glass px-6 py-4 rounded-2xl border border-white/5 pointer-events-auto">
        <div>
          <span className="text-[9px] font-mono tracking-widest text-cyan-400 uppercase">Live Dynamic Roadmap</span>
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2 mt-0.5">
            <Trophy className="h-5 w-5 text-purple-400" />
            AI Career Pathway OS Matrix
          </h2>
          <p className="text-[10px] text-slate-400">Interact with nodes to expand instructions, learn with AI, and track achievements.</p>
        </div>
        <div className="flex gap-4 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded-sm" /> Completed</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500/20 border border-purple-500 rounded-sm" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 rounded-sm opacity-50" /> Locked</span>
        </div>
      </div>

      {/* React Flow Container */}
      <div className="w-full h-full pt-20">
        {nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Background color="rgba(56,189,248,0.03)" gap={24} />
            <Controls className="!bg-[#0b0f19] !border-white/10 !rounded-lg" />
          </ReactFlow>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
            <ShieldAlert className="h-10 w-10 text-cyan-500 animate-pulse mb-3" />
            <h3 className="text-white font-bold">No Active Roadmap Nodes Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm text-center">Complete the onboarding planner flow to generate your personalized AI educational roadmap.</p>
          </div>
        )}
      </div>

      {/* Node Objectives Sliding Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#0b0f19]/95 border-l border-white/10 p-6 z-50 flex flex-col justify-between shadow-2xl backdrop-blur-md overflow-y-auto"
          >
            <div className="space-y-6 pb-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div>
                  <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider font-mono">
                    {selectedNode.data.type === 'boss' ? 'BOSS TARGET LOCK' : 'SKILL LEVEL METRIC'}
                  </span>
                  <h3 className="font-display font-bold text-lg text-white mt-0.5">
                    {selectedNode.data.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Details */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Node Status</span>
                <div className="mt-1.5 flex gap-2">
                  {selectedNode.data.status === 'locked' && (
                    <span className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-[10px] font-bold font-mono">
                      🔒 LOCKED BY DEPENDENCY
                    </span>
                  )}
                  {selectedNode.data.status === 'in_progress' && (
                    <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-[10px] font-bold font-mono animate-pulse">
                      ⚙ ACTIVE PATHWAY
                    </span>
                  )}
                  {selectedNode.data.status === 'completed' && (
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-bold font-mono">
                      ✔ COMPLETED NODE
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-[10px] font-bold font-mono uppercase">
                    {selectedNode.data.difficulty}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Overview Description</span>
                <p className="text-xs text-slate-300 leading-relaxed mt-1.5 bg-white/3 p-3 rounded-xl border border-white/5">
                  {selectedNode.data.description}
                </p>
              </div>

              {/* Dynamic Task Lists */}
              <div className="space-y-4">
                {/* Mini Projects */}
                {selectedNode.data.projects.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                      <Code2 className="h-3.5 w-3.5 text-cyan-400" />
                      Target Projects
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNode.data.projects.map((proj, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-slate-200">
                          {proj}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges */}
                {selectedNode.data.miniChallenges.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                      <Terminal className="h-3.5 w-3.5 text-purple-400" />
                      Mini Challenges
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNode.data.miniChallenges.map((chal, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-slate-200">
                          {chal}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interview Prep */}
                {selectedNode.data.interviewQuestions.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                      <HelpCircle className="h-3.5 w-3.5 text-blue-400" />
                      Interview Questions
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNode.data.interviewQuestions.map((q, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs text-slate-300">
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resources */}
                {selectedNode.data.resources.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 font-mono">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                      Recommended Resources
                    </h4>
                    <div className="space-y-1.5">
                      {selectedNode.data.resources.map((res, idx) => (
                        <a 
                          key={idx} 
                          href={res.startsWith('http') ? res : `https://${res}`}
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-xl p-2.5 text-xs text-emerald-400 flex items-center justify-between transition-colors"
                        >
                          <span className="truncate pr-4">{res}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Concept Elaboration */}
                <div className="border-t border-white/5 pt-4 mt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                    <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                    AI Mentor Concept Elaborator
                  </h4>
                  
                  {!elaboration && !loadingElab && (
                    <button
                      onClick={() => handleElaborate(selectedNode.id)}
                      className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                      Elaborate Concept Guide
                    </button>
                  )}

                  {loadingElab && (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-400 font-mono">
                      <div className="h-4.5 w-4.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <span>Elaborating with Llama-3.3...</span>
                    </div>
                  )}

                  {elaboration && (
                    <div className="bg-[#030d15]/50 border border-cyan-500/10 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                      <MarkdownRenderer content={elaboration} />
                    </div>
                  )}
                </div>

                {/* Node Assistant Chat Console */}
                <div className="border-t border-white/5 pt-4 mt-2 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-purple-400" />
                    AI Node Assistant
                  </h4>

                  <div className="bg-[#030d15] border border-white/5 rounded-xl p-3 h-48 overflow-y-auto space-y-2 flex flex-col shadow-inner">
                    {(chatMessages[selectedNode.id] || []).length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic text-center my-auto px-4">
                        Ask any question about {selectedNode.data.label} (e.g. "What is OOP?", "Explain BFS vs DFS?"). Node-specific context is active.
                      </p>
                    ) : (
                      (chatMessages[selectedNode.id] || []).map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`max-w-[85%] rounded-2xl p-2.5 text-[10px] leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-200 self-end' 
                              : 'bg-purple-500/10 border border-purple-500/20 text-slate-200 self-start'
                          }`}
                        >
                          {msg.role === 'user' ? (
                            <p>{msg.content}</p>
                          ) : (
                            <MarkdownRenderer content={msg.content} />
                          )}
                        </div>
                      ))
                    )}
                    {sendingQuery && (
                      <div className="text-[9px] text-cyan-400 font-mono animate-pulse flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                        AI Mentor is responding...
                      </div>
                    )}
                  </div>

                  {/* Suggestion tags */}
                  <div className="flex flex-wrap gap-1">
                    {quickSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSendNodeQuery(s)}
                        disabled={sendingQuery}
                        className="text-[9px] px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {/* Message Input form */}
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendNodeQuery(query)}
                      placeholder="Type matrix questions..."
                      disabled={sendingQuery}
                      className="flex-1 bg-[#020b12] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-colors shadow-inner"
                    />
                    <button
                      onClick={() => handleSendNodeQuery(query)}
                      disabled={!query.trim() || sendingQuery}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Ask
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Complete Node Button */}
            <div className="border-t border-white/5 pt-4 mt-auto">
              {selectedNode.data.status === 'locked' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-red-400 text-[11px] flex items-start gap-2.5">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>Prerequisite required. Complete the previous node in the career matrix pathway to unlock.</span>
                </div>
              )}

              {selectedNode.data.status === 'in_progress' && (
                <button
                  onClick={() => handleCompleteNode(selectedNode.id, selectedNode.data.xpReward)}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl font-bold text-xs tracking-wider uppercase shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="h-4.5 w-4.5" />
                  Complete Node (Secure {selectedNode.data.xpReward} XP)
                </button>
              )}

              {selectedNode.data.status === 'completed' && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-emerald-400 text-xs font-bold font-mono">
                  ✔ NODE CLEARED AND GRADED
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
