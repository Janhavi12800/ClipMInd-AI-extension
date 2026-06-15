import { PROMPT_TEMPLATES } from './templates'
import type { PromptEntry, PromptTemplate } from '../../lib/types'
import { sanitizeText, redactPii, detectPii } from '../../lib/security'
import { storage } from '../../lib/storage'

export function getTemplates(category?: string): PromptTemplate[] {
  if (!category || category === 'All') return PROMPT_TEMPLATES
  return PROMPT_TEMPLATES.filter((t) => t.category === category)
}

export function generatePrompt(
  template: PromptTemplate,
  variables: Record<string, string>,
  redact: boolean,
): { output: string; piiDetected: boolean } {
  let output = template.template

  for (const variable of template.variables) {
    const value = variables[variable] ?? `[${variable}]`
    output = output.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value)
  }

  const pii = detectPii(output)
  const piiDetected = pii.length > 0

  if (redact && piiDetected) {
    output = redactPii(output)
  }

  return { output: sanitizeText(output), piiDetected }
}

export function enhancePrompt(
  input: string,
  options: { tone?: string; audience?: string; length?: string },
  redact: boolean,
): { output: string; piiDetected: boolean } {
  const tone = options.tone ?? 'professional'
  const audience = options.audience ?? 'general audience'
  const length = options.length ?? 'detailed'

  const enhanced = `You are an expert AI assistant. Respond in a ${tone} tone for ${audience}.

Provide a ${length} response to the following request. Structure your response with clear sections, specific instructions, and expected output format.

Original request:
${sanitizeText(input)}

Enhanced instructions:
1. Clarify the objective and desired outcome
2. Specify the target audience and context
3. Define the output format and constraints
4. Include relevant domain expertise and best practices
5. Add evaluation criteria for response quality`

  const pii = detectPii(enhanced)
  const piiDetected = pii.length > 0

  return {
    output: redact && piiDetected ? redactPii(enhanced) : enhanced,
    piiDetected,
  }
}

export async function getLibrary(): Promise<PromptEntry[]> {
  return storage.getPromptLibrary()
}

export async function saveToLibrary(entry: Omit<PromptEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptEntry> {
  const now = new Date().toISOString()
  const prompt: PromptEntry = {
    ...entry,
    id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  }
  await storage.savePrompt(prompt)
  return prompt
}

export async function deleteFromLibrary(id: string): Promise<void> {
  await storage.deletePrompt(id)
}

export async function toggleFavorite(id: string): Promise<PromptEntry | null> {
  const library = await storage.getPromptLibrary()
  const prompt = library.find((p) => p.id === id)
  if (!prompt) return null
  prompt.isFavorite = !prompt.isFavorite
  prompt.updatedAt = new Date().toISOString()
  await storage.savePrompt(prompt)
  return prompt
}
