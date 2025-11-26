import { create } from 'zustand'

type AnalysisContextState = {
  currentKeyword: string
  currentHistoryId: string
  articleCount: number
  setContext: (ctx: { currentKeyword?: string; currentHistoryId?: string; articleCount?: number }) => void
  clear: () => void
}

export const useAnalysisContextStore = create<AnalysisContextState>((set) => ({
  currentKeyword: '',
  currentHistoryId: '',
  articleCount: 0,
  setContext: (ctx) => set((prev) => ({
    currentKeyword: ctx.currentKeyword ?? prev.currentKeyword,
    currentHistoryId: ctx.currentHistoryId ?? prev.currentHistoryId,
    articleCount: ctx.articleCount ?? prev.articleCount,
  })),
  clear: () => set({ currentKeyword: '', currentHistoryId: '', articleCount: 0 })
}))

