/** The follow-up conversation the user can have with the model after the
 *  structured AI 風味分析 is generated. The turn shape lives in calculator/types
 *  (it is persisted as part of RecipeAiAnalysis); this module adds the transport
 *  limits shared by the client and /api/analyze-recipe/chat. */
export type { AnalysisChatTurn } from '@/lib/calculator/types'

/** Keep the follow-up thread (and its resent context) bounded. */
export const MAX_CHAT_TURNS = 40
export const MAX_CHAT_MESSAGE_CHARS = 4000
