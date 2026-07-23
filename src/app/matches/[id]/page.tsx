'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useSupabase } from '@/components/SupabaseProvider';
import { getMatches } from '@/lib/matching';
import type { MatchWithUsers, Message } from '@/lib/types';
import {
  ArrowLeft,
  Send,
  Phone,
  MessageCircle,
  MapPin,
  Loader2,
  Heart,
} from 'lucide-react';

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { user, loading: authLoading } = useSupabase();
  const router = useRouter();
  const supabase = createClient();

  const [matchData, setMatchData] = useState<MatchWithUsers | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch match data and messages
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const matches = await getMatches(user.id, supabase);
      const match = matches.find((m) => m.id === id);
      if (!match) {
        router.replace('/matches');
        return;
      }
      setMatchData(match);

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
    } catch (err) {
      console.error('Error fetching chat:', err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase, id, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetchData();
    }
  }, [user, authLoading, router, fetchData]);

  // Subscribe to Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${id}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newMsg = payload.new as unknown as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, id]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || !user || sending) return;
    setSending(true);
    try {
      await supabase.from('messages').insert({
        match_id: id,
        sender_id: user.id,
        content: content.trim(),
      });
      setInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const sharePhone = async () => {
    if (!user) return;
    await supabase.from('messages').insert({
      match_id: id,
      sender_id: user.id,
      content: null,
      phone_shared: true,
    });
  };

  const shareWhatsApp = async () => {
    if (!user) return;
    await supabase.from('messages').insert({
      match_id: id,
      sender_id: user.id,
      content: null,
      whatsapp_shared: true,
    });
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      await supabase.from('messages').insert({
        match_id: id,
        sender_id: user!.id,
        content: null,
        location: { lat: latitude, lng: longitude },
      });
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-black mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando conversación...</p>
        </div>
      </div>
    );
  }

  if (!matchData) return null;

  const otherUser = matchData.otherUser;
  const otherVehicle = otherUser.vehicle;
  const photo = otherVehicle?.photos?.[0] || null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => router.push('/matches')}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 shrink-0">
            {photo ? (
              <img
                src={photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-gray-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-gray-900 truncate">
              {otherUser.name}
            </h2>
            <p className="text-xs text-gray-400 truncate">
              {otherVehicle?.brand} {otherVehicle?.model}
              {otherVehicle?.year ? ` · ${otherVehicle.year}` : ''}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isSent = msg.sender_id === user!.id;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      isSent
                        ? 'bg-black text-white rounded-br-md'
                        : 'bg-white border border-gray-100 text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    {msg.content && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    {msg.phone_shared && (
                      <p className="text-sm leading-relaxed">
                        📞 {isSent ? 'Compartiste tu teléfono' : 'Compartió su teléfono'}
                      </p>
                    )}
                    {msg.whatsapp_shared && (
                      <p className="text-sm leading-relaxed">
                        💬 {isSent ? 'Compartiste tu WhatsApp' : 'Compartió su WhatsApp'}
                      </p>
                    )}
                    {msg.location && (
                      <div>
                        <p className="text-sm leading-relaxed">
                          📍 {isSent ? 'Compartiste tu ubicación' : 'Compartió su ubicación'}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${msg.location.lat},${msg.location.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`text-xs underline mt-1 inline-block ${
                            isSent ? 'text-white/70' : 'text-blue-500'
                          }`}
                        >
                          Ver en mapa
                        </a>
                      </div>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        isSent ? 'text-white/50' : 'text-gray-400'
                      }`}
                    >
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Share buttons */}
      <div className="max-w-lg mx-auto w-full px-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={sharePhone}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Teléfono
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp
          </button>
          <button
            onClick={shareLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Ubicación
          </button>
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3">
        <form
          onSubmit={handleSend}
          className="max-w-lg mx-auto flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
