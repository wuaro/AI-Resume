/**
 * 对话类型
 * @typedef {Object} AIDialogue
 * @property {string} role - 角色
 * @property {string} content - 对话内容
 * @example
 */
export interface AIDialogue {
  /**
   * 角色
   * "user" 表示用户
   * "assistant" 表示 AI
   * "system" 表示系统角色
   */
  role: "user" | "assistant" | "system";

  /**
   * 对话内容
   */
  content: string;
}

// 对话历史（多轮对话）
export type DialogueHistory = AIDialogue[];
