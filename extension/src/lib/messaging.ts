import { MESSAGE_TIMEOUT_MS } from './constants'
import type { ExtensionMessage, ExtensionResponse, MessageType } from './types'
import { createLogger } from './logger'

const log = createLogger('Messaging')

function generateRequestId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export async function sendToBackground<TPayload, TResponse>(
  type: MessageType,
  payload?: TPayload,
): Promise<TResponse> {
  const requestId = generateRequestId()
  const message: ExtensionMessage<TPayload> = { type, payload, requestId }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message timeout: ${type}`))
    }, MESSAGE_TIMEOUT_MS)

    chrome.runtime.sendMessage(message, (response: ExtensionResponse<TResponse>) => {
      clearTimeout(timer)

      if (chrome.runtime.lastError) {
        log.error('sendMessage failed', chrome.runtime.lastError.message)
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response?.success) {
        reject(new Error(response?.error ?? 'Unknown error'))
        return
      }

      resolve(response.data as TResponse)
    })
  })
}

export async function sendToTab<TPayload, TResponse>(
  tabId: number,
  type: MessageType,
  payload?: TPayload,
): Promise<TResponse> {
  const requestId = generateRequestId()
  const message: ExtensionMessage<TPayload> = { type, payload, requestId }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Tab message timeout: ${type}`))
    }, MESSAGE_TIMEOUT_MS)

    chrome.tabs.sendMessage(tabId, message, (response: ExtensionResponse<TResponse>) => {
      clearTimeout(timer)

      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }

      if (!response?.success) {
        reject(new Error(response?.error ?? 'Unknown error'))
        return
      }

      resolve(response.data as TResponse)
    })
  })
}

export async function sendToActiveTab<TPayload, TResponse>(
  type: MessageType,
  payload?: TPayload,
): Promise<TResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id) throw new Error('No active tab')
  return sendToTab(tab.id, type, payload)
}

export function createMessageHandler(
  handlers: Partial<Record<MessageType, (payload: unknown, sender: chrome.runtime.MessageSender) => Promise<unknown>>>,
): (message: ExtensionMessage, sender: chrome.runtime.MessageSender, sendResponse: (r: ExtensionResponse) => void) => boolean {
  return (message, sender, sendResponse) => {
    const handler = handlers[message.type]

    if (!handler) {
      sendResponse({ success: false, error: `Unknown message type: ${message.type}`, requestId: message.requestId })
      return false
    }

    handler(message.payload, sender)
      .then((data) => {
        sendResponse({ success: true, data, requestId: message.requestId })
      })
      .catch((err: Error) => {
        log.error(`Handler error: ${message.type}`, err.message)
        sendResponse({ success: false, error: err.message, requestId: message.requestId })
      })

    return true
  }
}

export function respond<T>(data: T, requestId?: string): ExtensionResponse<T> {
  return { success: true, data, requestId }
}

export function respondError(error: string, requestId?: string): ExtensionResponse {
  return { success: false, error, requestId }
}
