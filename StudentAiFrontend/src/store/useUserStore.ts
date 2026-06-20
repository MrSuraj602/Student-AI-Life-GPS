import { create } from 'zustand'
import axios from 'axios'

export interface UserProfile {
  username: string
  email: string
  role: 'STUDENT' | 'ADMIN'
  level: number
  xp: number
  coins: number
  streak: number
  activeMission: string
  strengths: string[]
  weaknesses: string[]
  recommendedDomains: string[]
  diagnosticComplete: boolean
  careerReadyScore: number
}

interface UserState {
  token: string | null
  user: UserProfile | null
  profileState: any | null
  completedNodes: string[]
  badges: string[]
  setToken: (token: string | null) => void
  setUser: (user: UserProfile | null) => void
  fetchProfileState: () => Promise<void>
  logout: () => void
  addXP: (amount: number) => void
  completeNode: (nodeId: string) => void
  unlockBadge: (badge: string) => void
  setDiagnosticResult: (result: any) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  profileState: null,
  completedNodes: JSON.parse(localStorage.getItem('completedNodes') || '[]'),
  badges: JSON.parse(localStorage.getItem('badges') || '[]'),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
    set({ token })
  },

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
    set({ user })
  },

  fetchProfileState: async () => {
    const token = localStorage.getItem('token') || get().token
    if (!token) return
    try {
      const response = await axios.get('http://localhost:8080/api/profile/state', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response.data
      const updatedUser: UserProfile = {
        ...data.basicDetails,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        recommendedDomains: data.recommendedDomains || [],
        careerReadyScore: data.careerReadiness?.score || 0
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      localStorage.setItem('completedNodes', JSON.stringify(data.completedNodes || []))
      localStorage.setItem('badges', JSON.stringify(data.unlockedBadges || []))
      set({
        profileState: data,
        user: updatedUser,
        completedNodes: data.completedNodes || [],
        badges: data.unlockedBadges || []
      })
    } catch (err) {
      console.error('Fetch profile state failed', err)
    }
  },

  logout: () => {
    localStorage.clear()
    sessionStorage.clear()
    set({ token: null, user: null, profileState: null, completedNodes: [], badges: [] })
    // Invalidate axios headers or reload to clear any cache
    window.location.href = '/'
  },

  addXP: (amount) => {
    set((state) => {
      if (!state.user) return {}
      const newXp = state.user.xp + amount
      let newLevel = state.user.level
      let requiredXpForNext = newLevel * 400
      let tempXp = newXp
      
      while (tempXp >= requiredXpForNext) {
        tempXp -= requiredXpForNext
        newLevel += 1
        requiredXpForNext = newLevel * 400
      }

      const updatedUser = {
        ...state.user,
        xp: tempXp,
        level: newLevel,
        coins: state.user.coins + Math.floor(amount / 2),
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { user: updatedUser }
    })
    get().fetchProfileState()
  },

  completeNode: (nodeId) => {
    set((state) => {
      if (state.completedNodes.includes(nodeId)) return {}
      const newCompleted = [...state.completedNodes, nodeId]
      localStorage.setItem('completedNodes', JSON.stringify(newCompleted))
      return { completedNodes: newCompleted }
    })
    get().fetchProfileState()
  },

  unlockBadge: (badge) => {
    set((state) => {
      if (state.badges.includes(badge)) return {}
      const newBadges = [...state.badges, badge]
      localStorage.setItem('badges', JSON.stringify(newBadges))
      return { badges: newBadges }
    })
    get().fetchProfileState()
  },

  setDiagnosticResult: (result) => {
    set((state) => {
      if (!state.user) return {}
      const updatedUser: UserProfile = {
        ...state.user,
        diagnosticComplete: true,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendedDomains: result.recommendedDomains || [],
        careerReadyScore: result.confidence || 0,
      }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return { user: updatedUser }
    })
    get().fetchProfileState()
  },
}))
