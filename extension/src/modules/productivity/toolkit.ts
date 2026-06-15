import { storage } from '../../lib/storage'

export interface Snippet {
  id: string
  trigger: string
  content: string
  createdAt: string
}

export interface Task {
  id: string
  text: string
  completed: boolean
  dueDate?: string
  createdAt: string
}

export interface ProductivityData {
  snippets: Snippet[]
  tasks: Task[]
  pomodoroMinutes: number
  pomodoroActive: boolean
  pomodoroEndTime?: number
}

export async function getProductivity(): Promise<ProductivityData> {
  const data = await storage.getProductivity()
  return {
    snippets: (data.snippets as Snippet[]) ?? [],
    tasks: (data.tasks as Task[]) ?? [],
    pomodoroMinutes: (data.pomodoroMinutes as number) ?? 25,
    pomodoroActive: (data.pomodoroActive as boolean) ?? false,
    pomodoroEndTime: data.pomodoroEndTime as number | undefined,
  }
}

export async function saveSnippet(trigger: string, content: string): Promise<Snippet> {
  const data = await getProductivity()
  const snippet: Snippet = {
    id: `snip_${Date.now()}`,
    trigger: trigger.startsWith(';;') ? trigger : `;;${trigger}`,
    content,
    createdAt: new Date().toISOString(),
  }
  data.snippets.unshift(snippet)
  await storage.setProductivity(data as unknown as Record<string, unknown>)
  return snippet
}

export async function deleteSnippet(id: string): Promise<void> {
  const data = await getProductivity()
  data.snippets = data.snippets.filter((s) => s.id !== id)
  await storage.setProductivity(data as unknown as Record<string, unknown>)
}

export async function addTask(text: string, dueDate?: string): Promise<Task> {
  const data = await getProductivity()
  const task: Task = {
    id: `task_${Date.now()}`,
    text,
    completed: false,
    dueDate,
    createdAt: new Date().toISOString(),
  }
  data.tasks.unshift(task)
  await storage.setProductivity(data as unknown as Record<string, unknown>)
  return task
}

export async function toggleTask(id: string): Promise<Task | null> {
  const data = await getProductivity()
  const task = data.tasks.find((t) => t.id === id)
  if (!task) return null
  task.completed = !task.completed
  await storage.setProductivity(data as unknown as Record<string, unknown>)
  return task
}

export async function startPomodoro(minutes?: number): Promise<ProductivityData> {
  const data = await getProductivity()
  const mins = minutes ?? data.pomodoroMinutes
  data.pomodoroActive = true
  data.pomodoroEndTime = Date.now() + mins * 60 * 1000
  data.pomodoroMinutes = mins
  await storage.setProductivity(data as unknown as Record<string, unknown>)

  chrome.alarms.create('pomodoro_end', { when: data.pomodoroEndTime })

  return data
}

export async function stopPomodoro(): Promise<ProductivityData> {
  const data = await getProductivity()
  data.pomodoroActive = false
  data.pomodoroEndTime = undefined
  await storage.setProductivity(data as unknown as Record<string, unknown>)
  chrome.alarms.clear('pomodoro_end')
  return data
}
