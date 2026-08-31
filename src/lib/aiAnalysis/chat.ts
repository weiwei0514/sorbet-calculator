/** One turn of the follow-up conversation the user can have with the model
 *  after the structured AI 風味分析 is generated. The seeded recipe prompt and
 *  the analysis itself are reconstructed server-side, so only these follow-up
 *  turns travel between the client and /api/analyze-recipe/chat. */
export interface AnalysisChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** Keep the follow-up thread (and its resent context) bounded. */
export const MAX_CHAT_TURNS = 40
export const MAX_CHAT_MESSAGE_CHARS = 4000
