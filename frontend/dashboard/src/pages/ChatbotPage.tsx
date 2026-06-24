import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { chatbotService } from '@/services/api'
import {
  MessageSquare, Bot, Send, ThumbsUp, Clock, CheckCircle, Users,
  XCircle, Zap,
} from 'lucide-react'
import BackButton from '@/components/BackButton'

function ago(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const hrs = Math.floor(diff / 3600000)
  if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const INTENT_COLORS: Record<string, string> = {
  tracking_status: 'var(--status-blue)',
  change_address: 'var(--status-amber)',
  pricing: 'var(--status-green)',
  delay_reason: 'var(--status-red)',
  eta_query: 'var(--status-purple)',
  pod_request: 'var(--status-orange)',
  tracking_link: 'var(--status-cyan)',
}

export default function ChatbotPage() {
  const [input, setInput] = useState('')
  const [chat, setChat] = useState<{ role: string; content: string }[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['chatbot'],
    queryFn: () => chatbotService.getDashboard().then(r => r.data),
  })

  const chatMutation = useMutation({
    mutationFn: (message: string) => chatbotService.chat(message),
    onSuccess: (res) => {
      setChat(prev => [...prev, { role: 'bot', content: res.data.reply }])
    },
    onError: () => {
      setChat(prev => [...prev, { role: 'bot', content: 'Sorry, I am unable to respond right now. Please try again later.' }])
    },
  })

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return
    const message = input.trim()
    setChat(prev => [...prev, { role: 'user', content: message }])
    chatMutation.mutate(message)
    setInput('')
  }

  if (isLoading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>AI Chatbot</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--color-surface)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { summary, recentConversations, sampleConversation, quickReplies } = data

  return (
    <div style={{ padding: '2rem', maxWidth: 1400 }}>
      <BackButton fallback="/dashboard" />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>AI Chatbot for Shipment Inquiries</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: MessageSquare, label: 'Conversations', value: summary.totalConversations.toLocaleString(), color: 'var(--status-blue)' },
          { icon: Bot, label: 'Total Messages', value: summary.totalMessages.toLocaleString(), color: 'var(--status-purple)' },
          { icon: CheckCircle, label: 'Resolved w/o Agent', value: summary.resolvedWithoutAgent + '%', color: 'var(--status-green)' },
          { icon: ThumbsUp, label: 'Avg Satisfaction', value: summary.avgSatisfaction.toFixed(1) + ' / 5', color: 'var(--status-amber)' },
          { icon: Zap, label: 'Active Now', value: String(summary.activeNow), color: 'var(--status-cyan)' },
        ].map((card, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={card.color} />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{card.label}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Chatbot UI */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bot size={20} color="var(--color-primary)" />
            <span style={{ fontWeight: 600 }}>Shipment Assistant</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--status-green)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-green)', display: 'inline-block' }} /> Online
            </span>
          </div>
          <div style={{ flex: 1, padding: '1rem', height: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {sampleConversation.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '0.625rem 0.875rem', borderRadius: 12, fontSize: '0.8125rem', lineHeight: 1.5,
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'bot' ? 4 : 12,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chat.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '0.625rem 0.875rem', borderRadius: 12, fontSize: '0.8125rem', lineHeight: 1.5,
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                  borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                  borderBottomLeftRadius: msg.role === 'bot' ? 4 : 12,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ maxWidth: '85%', padding: '0.625rem 0.875rem', borderRadius: 12, fontSize: '0.8125rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-text-muted)', animation: 'pulse 1s infinite' }} />
                    Shipment Assistant is typing...
                  </span>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your shipment..."
              style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontSize: '0.8125rem', outline: 'none' }}
            />
            <button onClick={handleSend} disabled={chatMutation.isPending} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: 'none', background: 'var(--color-primary)', color: '#fff', cursor: chatMutation.isPending ? 'not-allowed' : 'pointer', opacity: chatMutation.isPending ? 0.6 : 1 }}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Recent Conversations */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="var(--color-primary)" /> Recent Conversations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentConversations.map(c => (
              <div key={c.id} style={{ padding: '0.625rem 0.75rem', background: 'var(--color-bg)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{c.customerName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {c.resolved ? <CheckCircle size={12} color="var(--status-green)" /> : <XCircle size={12} color="var(--status-red)" />}
                    <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>{c.messages} msgs</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  "{c.query}"
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    padding: '0.125rem 0.375rem', borderRadius: 4, fontSize: '0.625rem', fontWeight: 600,
                    background: (INTENT_COLORS[c.intent] || 'var(--status-gray)') + '20',
                    color: INTENT_COLORS[c.intent] || 'var(--status-gray)',
                  }}>{c.intent.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={10} /> {ago(c.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Replies */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 10, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap size={18} color="var(--color-primary)" /> Quick Reply Templates
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          {quickReplies.map((qr, i) => (
            <div key={i} style={{ padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: '0.25rem' }}>{qr.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{qr.response}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}