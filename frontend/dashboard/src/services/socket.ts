const RECONNECT_DELAY_MS = 1000

let socket: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let activeToken: string | undefined
const subscribedTrackingNumbers = new Set<string>()
const callbacks = new Map<string, Set<(data: unknown) => void>>()

function buildWebSocketUrl(token?: string): string {
  let base = import.meta.env.VITE_WS_URL as string | undefined
  if (!base) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    base = `${protocol}//${window.location.host}/ws`
  }
  if (!token) return base
  const separator = base.includes('?') ? '&' : '?'
  return `${base}${separator}token=${encodeURIComponent(token)}`
}

function sendMessage(payload: unknown) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload))
  }
}

function reconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectSocket(activeToken)
  }, RECONNECT_DELAY_MS)
}

export function connectSocket(token?: string): WebSocket {
  activeToken = token
  if (socket?.readyState === WebSocket.OPEN) return socket

  const ws = new WebSocket(buildWebSocketUrl(token))
  socket = ws

  ws.onopen = () => {
    console.log('[WS] connected')
    subscribedTrackingNumbers.forEach((tn) => {
      sendMessage({ action: 'subscribe', trackingNumber: tn })
    })
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === 'waybill_update' && msg.trackingNumber) {
        const cbs = callbacks.get(msg.trackingNumber)
        cbs?.forEach((cb) => cb(msg.data))
      }
    } catch (err) {
      console.error('[WS] failed to parse message', err)
    }
  }

  ws.onerror = (err) => {
    console.error('[WS] error', err)
  }

  ws.onclose = () => {
    console.log('[WS] disconnected')
    reconnect()
  }

  return ws
}

export function disconnectSocket(): void {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  socket?.close()
  socket = null
  subscribedTrackingNumbers.clear()
  callbacks.clear()
}

export function subscribeToWaybill(
  trackingNumber: string,
  callback: (data: unknown) => void,
): () => void {
  const s = connectSocket(activeToken)

  if (!subscribedTrackingNumbers.has(trackingNumber)) {
    subscribedTrackingNumbers.add(trackingNumber)
    callbacks.set(trackingNumber, new Set())
    if (s.readyState === WebSocket.OPEN) {
      sendMessage({ action: 'subscribe', trackingNumber })
    }
  }

  callbacks.get(trackingNumber)!.add(callback)

  return () => {
    const cbs = callbacks.get(trackingNumber)
    if (!cbs) return
    cbs.delete(callback)
    if (cbs.size === 0) {
      callbacks.delete(trackingNumber)
      subscribedTrackingNumbers.delete(trackingNumber)
      sendMessage({ action: 'unsubscribe', trackingNumber })
    }
  }
}

export { socket }