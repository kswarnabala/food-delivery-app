import React, { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../utils/api';
import { useAuth } from '../context/AppContext';

interface ChatMessage {
  id: number;
  user_id: number;
  is_admin: boolean;
  message: string;
  created_at: string;
}

interface ChatBotProps {
  isAdmin?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState({ message: '', hours: '', admin_available: false });
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [localBotMessages, setLocalBotMessages] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(isAdmin);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLength = useRef(0);

  // Request notification permission and reset unread on open
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Reset prev length tracker if the active user changes
  useEffect(() => {
    prevMessagesLength.current = 0;
  }, [selectedUserId]);

  // Track incoming messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current !== 0) {
      const newMsg = messages[messages.length - 1];
      const isFromOther = isAdmin ? !newMsg.is_admin : newMsg.is_admin;
      const isSystem = (newMsg as any).is_system;

      if (isFromOther && !isSystem) {
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(isAdmin ? `New Customer Message (#${newMsg.user_id})` : 'Admin Support', {
            body: newMsg.message
          });
        }
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isAdmin, isOpen]);

  useEffect(() => {
    if (!isAdmin && isOpen && messages.length === 0 && localBotMessages.length === 0) {
      setLocalBotMessages([
        { id: 'bot-' + Date.now(), is_admin: true, message: 'Hi! I am the automated assistant. How can I help you today?', is_system: true, created_at: new Date().toISOString() }
      ]);
    }
  }, [isOpen, messages.length, isAdmin]);

  const handleQuickReply = (type: string) => {
    const time = new Date().toISOString();
    let msg = '';
    let userQuery = '';
    if (type === 'availability') {
      userQuery = 'Is admin available right now?';
      msg = availability.admin_available
        ? `✅ Admin is currently online! Send your message and we'll connect you shortly.`
        : `❌ Admin is currently offline. Working hours: ${availability.hours || '09:00 AM to 08:00 PM'}. Your message will be seen when admin is back.`;
    } else if (type === 'order') {
      userQuery = 'Check Order Status';
      msg = `To check your recent orders and their current status, please visit the 'My Orders' section from the top menu.`;
    }

    setLocalBotMessages(prev => [
      ...prev,
      { id: 'usr-' + Date.now(), is_admin: false, message: userQuery, is_system: true, created_at: time },
      { id: 'bot-' + Date.now() + 1, is_admin: true, message: msg, is_system: true, created_at: new Date(Date.now() + 500).toISOString() }
    ]);
  };

  const loadAvailability = async () => {
    try {
      const res = await chatAPI.availability();
      setAvailability(res.data);
    } catch (error) {
      console.error('Failed to fetch availability', error);
    }
  };

  const loadMessages = async (userId?: number) => {
    try {
      const res = await chatAPI.getMessages(userId);
      setMessages(res.data || []);
      if (isAdmin && res.data?.length > 0) {
        const firstCustomerId = res.data[0].user_id;
        if (!selectedUserId) setSelectedUserId(firstCustomerId);
      }
    } catch (error) {
      console.error('Failed to load chat messages', error);
    }
  };

  useEffect(() => {
    loadAvailability();
    if (isAdmin) {
      loadMessages(selectedUserId || undefined);
    } else {
      loadMessages();
    }
    const interval = setInterval(() => {
      if (isAdmin) {
        loadMessages(selectedUserId || undefined);
      } else {
        loadMessages();
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isAdmin, selectedUserId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!user) return;
    setLoading(true);
    try {
      if (isAdmin) {
        if (!selectedUserId) {
          return;
        }
        await chatAPI.sendMessage(text, selectedUserId);
      } else {
        await chatAPI.sendMessage(text);
      }
      setText('');
      if (isAdmin) {
        await loadMessages(selectedUserId || undefined);
      } else {
        await loadMessages();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const customers = Array.from(new Set(messages.map((m) => m.user_id)));

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this message?")) {
      try { await chatAPI.deleteMessage(id); loadMessages(selectedUserId || undefined); }
      catch (error) { console.error('Failed to delete message:', error); }
    }
  };

  const handleEditSubmit = async (id: number) => {
    if (!editText.trim()) return;
    try {
      await chatAPI.editMessage(id, editText);
      setEditingMessageId(null);
      loadMessages(selectedUserId || undefined);
    } catch (error) { console.error('Failed to edit message:', error); }
  };

  const allMessages = isAdmin
    ? messages
    : [...localBotMessages, ...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return (
    <>
      {!isOpen && (
        <div
          className="position-fixed d-flex justify-content-center align-items-center bg-primary text-white rounded-circle shadow-lg cursor-pointer"
          style={{ bottom: '30px', right: '30px', width: '65px', height: '65px', zIndex: 1050, transition: 'transform 0.3s' }}
          onClick={() => setIsOpen(true)}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-chat-dots-fill fs-3"></i>
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-light" style={{ fontSize: '0.65rem' }}>
              {unreadCount}
              <span className="visually-hidden">unread messages</span>
            </span>
          )}
        </div>
      )}

      {isOpen && (
        <div
          className="position-fixed shadow-lg rounded-4 d-flex flex-column"
          style={{ bottom: '90px', right: '30px', width: '350px', height: '520px', zIndex: 1050, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', background: '#fff' }}
        >
          <div className="bg-primary text-white p-3 d-flex flex-column rounded-top-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                  <i className="bi bi-robot fs-4"></i>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{isAdmin ? 'Admin Support Console' : 'Chatbot Online'}</h6>
                  <small className="opacity-75" style={{ fontSize: '0.75rem' }}>{isAdmin ? 'Select User Below' : 'Automated Support Agent'}</small>
                </div>
              </div>
              <i className="bi bi-x-lg cursor-pointer fs-5 opacity-75 hover-opacity-100 transition" onClick={() => setIsOpen(false)}></i>
            </div>
            {isAdmin && (
              <div className="mt-2 d-flex align-items-center gap-2">
                <span className="small fw-600">Active Chat:</span>
                <select
                  className="form-select form-select-sm bg-white text-dark rounded-pill px-3 py-1 flex-grow-1"
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                >
                  {customers.length === 0 ? (
                    <option value="">No Active Chats</option>
                  ) : (
                    customers.map((id) => (
                      <option key={id} value={id}>Customer #{id}</option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="p-2 border-bottom text-center" style={{ background: availability.admin_available ? '#e8f5e9' : '#fff3e0' }}>
            <small style={{ fontSize: '0.75rem', color: availability.admin_available ? '#2e7d32' : '#e65100' }}>
              {availability.admin_available ? '🟢 Admin is online' : '🔴 Admin is offline'} · {availability.hours || '09:00 AM – 08:00 PM'}
            </small>
          </div>

          <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', background: '#f8f9fa' }}>
            {allMessages.length === 0 ? (
              <div className="text-center small text-muted py-3">Loading secure chat...</div>
            ) : (
              allMessages.map((msg) => {
                const isOwner = isAdmin ? msg.is_admin : !msg.is_admin;
                const isSystem = (msg as any).is_system;

                return (
                  <div key={msg.id} className={`d-flex mb-3 ${isOwner ? 'justify-content-end' : 'justify-content-start'}`}>
                    {!isOwner && (
                      <div className="bg-light text-primary rounded-circle d-flex align-items-center justify-content-center me-2 shadow-sm border border-white" style={{ width: '35px', height: '35px', minWidth: '35px' }}>
                        {isSystem ? <i className="bi bi-robot fs-5"></i> : <i className="bi bi-person-fill fs-5"></i>}
                      </div>
                    )}
                    <div className={`p-3 rounded-4 shadow-sm position-relative ${isOwner ? 'bg-primary text-white ms-auto text-end rounded-top-right-0' : 'bg-white border text-dark ms-0 text-start rounded-top-left-0'}`} style={{ maxWidth: '80%' }}>

                      {editingMessageId === msg.id ? (
                        <div className="d-flex flex-column gap-2 mt-1">
                          <input type="text" className="form-control form-control-sm text-dark px-2" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus style={{ fontSize: '0.8rem' }} />
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="btn btn-sm btn-light py-0 text-dark fw-bold shadow-sm" style={{ fontSize: '0.7rem' }} onClick={() => handleEditSubmit(msg.id)}>Save</button>
                            <button className="btn btn-sm btn-light py-0 text-dark opacity-75 shadow-sm" style={{ fontSize: '0.7rem' }} onClick={() => setEditingMessageId(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.message}</div>
                          <div className={`small opacity-75 mt-2 d-flex ${isOwner && !isSystem ? 'justify-content-between gap-3' : 'justify-content-end'} align-items-center`} style={{ fontSize: '0.65rem' }}>
                            {isOwner && !isSystem && (
                              <span>
                                <i className="bi bi-pencil-fill me-2 cursor-pointer transition hover-opacity-100" onClick={() => { setEditingMessageId(msg.id); setEditText(msg.message); }}></i>
                                <i className="bi bi-trash-fill cursor-pointer text-white transition hover-opacity-100" onClick={() => handleDelete(msg.id)}></i>
                              </span>
                            )}
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.is_admin && isSystem && <span className="ms-1"><i className="bi bi-lightning-charge-fill text-warning"></i></span>}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {!isAdmin && (
              <div className="d-flex flex-column gap-2 mt-4 pt-3 border-top pb-1">
                <span className="small text-muted fw-bold mb-1 ps-1" style={{ fontSize: '0.7rem' }}><i className="bi bi-stars text-warning me-1"></i>Suggested Queries</span>
                <div className="d-flex flex-column gap-2">
                  <button onClick={() => handleQuickReply('availability')} className="btn btn-outline-primary rounded-pill bg-white text-start shadow-sm border px-3 py-2 d-flex justify-content-between align-items-center">
                    <span className="fw-600" style={{ fontSize: '0.85rem' }}>Admin Availability</span>
                    <i className="bi bi-clock-history"></i>
                  </button>
                  <button onClick={() => handleQuickReply('order')} className="btn btn-outline-primary rounded-pill bg-white text-start shadow-sm border px-3 py-2 d-flex justify-content-between align-items-center">
                    <span className="fw-600" style={{ fontSize: '0.85rem' }}>Check My Orders</span>
                    <i className="bi bi-box-seam-fill"></i>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 border-top bg-white d-flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="form-control rounded-pill px-3"
              placeholder="Type message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend} disabled={loading || !text.trim()} className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
