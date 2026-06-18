import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token?: string): Socket {
  if (socket?.connected) return socket

  socket = io(import.meta.env.VITE_WS_URL || '/ws', {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: Infinity,
  })

  socket.on('connect', () => console.log('[WS] connected'))
  socket.on('disconnect', () => console.log('[WS] disconnected'))
  socket.on('error', (err) => console.error('[WS] error', err))

  return socket
}

export function disconnectSocket(): void {
  socket?.disconnect()
  socket = null
}

export function subscribeToWaybill(
  trackingNumber: string,
  callback: (data: any) => void,
): () => void {
  const s = socket || connectSocket()
  s.emit('subscribe', { trackingNumber })
  s.on(`waybill:${trackingNumber}`, callback)
  return () => s.off(`waybill:${trackingNumber}`)
}

export { socket }