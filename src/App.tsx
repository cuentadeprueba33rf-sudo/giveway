import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Sword, Coins, Users, ExternalLink, ShieldCheck, Sparkles, MessageSquare, Send, X, Circle, Heart, MessageCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { supabase } from "./lib/supabase";

interface Message {
  id: number;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

// ... existing GiveawayCard component ...

const ChatSystem = ({ ownerData }: { ownerData: any }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputText, setInputText] = React.useState("");
  const socketRef = React.useRef<Socket | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    socketRef.current = io();

    socketRef.current.on("previous_messages", (prevMessages: Message[]) => {
      setMessages(prevMessages);
    });

    socketRef.current.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socketRef.current?.emit("send_message", {
      user: ownerData?.displayName || "Visitante",
      avatar: ownerData?.avatarUrl || "",
      text: inputText
    });
    setInputText("");
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-emerald-500 text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]"
      >
        <MessageSquare size={24} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-28 right-8 z-50 w-80 md:w-96 h-[500px] glass rounded-3xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                <span className="font-display font-bold text-sm tracking-wider">CHAT EN VIVO</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {messages.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-zinc-500 text-sm">No hay mensajes aún. ¡Sé el primero!</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0 overflow-hidden border border-white/10">
                    {msg.avatar ? (
                      <img src={msg.avatar} alt={msg.user} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                        {msg.user[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-emerald-400">{msg.user}</span>
                      <span className="text-[10px] text-zinc-600">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-emerald-500 text-black rounded-lg flex items-center justify-center hover:bg-emerald-400 transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

interface GiveawayCardProps {
  key?: React.Key;
  title: string;
  type: 'MM2' | 'Robux';
  image: string;
  endsIn: string;
  participants: number;
  rarity?: string;
}

const GiveawayCard = ({ title, type, image, endsIn, participants, rarity, ownerData }: GiveawayCardProps & { ownerData: any }) => {
  const [likes, setLikes] = React.useState(0);
  const [showComments, setShowComments] = React.useState(false);
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const giveawayId = title.toLowerCase().replace(/\s+/g, '-');

  React.useEffect(() => {
    fetchLikes();
    fetchComments();
  }, []);

  const fetchLikes = async () => {
    const { data, error } = await supabase
      .from('giveaway_likes')
      .select('likes_count')
      .eq('giveaway_id', giveawayId)
      .single();
    
    if (data) setLikes(data.likes_count);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('giveaway_id', giveawayId)
      .order('created_at', { ascending: false });
    
    if (data) setComments(data);
  };

  const handleLike = async () => {
    const { data: existing } = await supabase
      .from('giveaway_likes')
      .select('likes_count')
      .eq('giveaway_id', giveawayId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('giveaway_likes')
        .update({ likes_count: existing.likes_count + 1 })
        .eq('giveaway_id', giveawayId);
      if (!error) setLikes(prev => prev + 1);
    } else {
      const { error } = await supabase
        .from('giveaway_likes')
        .insert({ giveaway_id: giveawayId, likes_count: 1 });
      if (!error) setLikes(1);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const commentData = {
      giveaway_id: giveawayId,
      user_name: ownerData?.displayName || "Visitante",
      avatar_url: ownerData?.avatarUrl || "",
      content: newComment
    };

    const { error } = await supabase.from('comments').insert(commentData);
    if (!error) {
      setNewComment("");
      fetchComments();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="glass glass-hover rounded-2xl overflow-hidden group flex flex-col"
    >
      <div className="relative h-48 overflow-hidden">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-60" />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            type === 'MM2' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            {type}
          </span>
          {rarity && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {rarity}
            </span>
          )}
        </div>
        
        {/* Quick Actions Overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          <button 
            onClick={handleLike}
            className="p-2 rounded-full glass hover:bg-red-500/20 transition-colors group/like"
          >
            <Heart size={16} className={likes > 0 ? "fill-red-500 text-red-500" : "text-white"} />
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="p-2 rounded-full glass hover:bg-emerald-500/20 transition-colors"
          >
            <MessageCircle size={16} className="text-white" />
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-display font-bold mb-2 group-hover:text-emerald-400 transition-colors">{title}</h3>
        
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4 uppercase tracking-widest">
          <div className="flex items-center gap-1">
            <Heart size={10} className="text-red-500 fill-red-500" />
            <span>{likes} Likes</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={10} />
            <span>{participants} Participantes</span>
          </div>
        </div>

        <AnimatePresence>
          {showComments && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4 border-t border-white/5 pt-4"
            >
              <div className="max-h-32 overflow-y-auto scrollbar-hide space-y-2 mb-3">
                {comments.map((c, i) => (
                  <div key={i} className="text-[11px] bg-white/5 p-2 rounded-lg">
                    <span className="font-bold text-emerald-400 mr-1">{c.user_name}:</span>
                    <span className="text-zinc-300">{c.content}</span>
                  </div>
                ))}
                {comments.length === 0 && <p className="text-[10px] text-zinc-600 text-center">Sin comentarios</p>}
              </div>
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Comentar..."
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-emerald-500/50"
                />
                <button type="submit" className="p-1.5 bg-emerald-500 text-black rounded-lg">
                  <Send size={12} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="text-xs">
            <p className="text-zinc-500 uppercase tracking-widest">Finaliza en</p>
            <p className="font-mono text-emerald-400 font-bold">{endsIn}</p>
          </div>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors"
          >
            Participar
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [ownerData, setOwnerData] = React.useState<any>(null);

  React.useEffect(() => {
    fetch("/api/roblox/user/NARU_SAM68")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => setOwnerData(data))
      .catch(err => console.error("Error fetching owner:", err));
  }, []);

  const giveaways: GiveawayCardProps[] = [
    {
      title: "Harvester (Ancient)",
      type: "MM2",
      image: "https://picsum.photos/seed/mm2-1/600/400",
      endsIn: "02d 14h 30m",
      participants: 1240,
      rarity: "Ancient"
    },
    {
      title: "5,000 Robux Pack",
      type: "Robux",
      image: "https://picsum.photos/seed/robux-1/600/400",
      endsIn: "05h 12m 00s",
      participants: 3500
    },
    {
      title: "Icebreaker Set",
      type: "MM2",
      image: "https://picsum.photos/seed/mm2-2/600/400",
      endsIn: "01d 08h 15m",
      participants: 890,
      rarity: "Godly"
    },
    {
      title: "Batwing Scythe",
      type: "MM2",
      image: "https://picsum.photos/seed/mm2-3/600/400",
      endsIn: "12h 45m 10s",
      participants: 2100,
      rarity: "Ancient"
    }
  ];

  return (
    <div className="min-h-screen selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center glass rounded-2xl px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Trophy className="text-black" size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter">NARU<span className="text-emerald-500">GIVEAWAYS</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Sorteos</a>
            <a href="#" className="hover:text-white transition-colors">Ganadores</a>
            <a href="#" className="hover:text-white transition-colors">MM2 Shop</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 hidden sm:inline">Owner: <span className="text-zinc-200 font-bold">NARU_SAM68</span></span>
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all">
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Los mejores sorteos de MM2 y Robux</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-display font-bold mb-6 tracking-tight leading-[0.9]"
          >
            <span className="text-gradient">DOMINA EL JUEGO</span><br />
            <span className="text-emerald-500">CON NARU_SAM68</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-2xl mx-auto text-zinc-400 text-lg mb-10 leading-relaxed"
          >
            Participa en los sorteos más exclusivos de Murder Mystery 2 y Robux. 
            Armas Ancient, Godly y miles de Robux te esperan cada semana.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <button className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              Ver Sorteos Activos <Sword size={20} />
            </button>
            <button className="glass hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2">
              Unirse al Grupo <Users size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Sorteos Realizados", value: "1,200+", icon: Trophy },
            { label: "Robux Entregados", value: "500K+", icon: Coins },
            { label: "Usuarios Activos", value: "25K+", icon: Users },
            { label: "Armas Godly", value: "850+", icon: Sword },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-2xl text-center"
            >
              <stat.icon className="mx-auto mb-4 text-emerald-500" size={24} />
              <p className="text-3xl font-display font-bold mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Active Giveaways */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-display font-bold mb-2">SORTEOS <span className="text-emerald-500">ACTIVOS</span></h2>
              <p className="text-zinc-500">No pierdas tu oportunidad de ganar ítems legendarios.</p>
            </div>
            <button className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-2">
              Ver todos <ExternalLink size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {giveaways.map((giveaway, i) => (
              <GiveawayCard 
                key={i} 
                title={giveaway.title}
                type={giveaway.type}
                image={giveaway.image}
                endsIn={giveaway.endsIn}
                participants={giveaway.participants}
                rarity={giveaway.rarity}
                ownerData={ownerData}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto glass rounded-[32px] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/5 blur-[100px] -z-10" />
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold mb-6">¿POR QUÉ CONFIAR EN <span className="text-emerald-500">NOSOTROS?</span></h2>
              <div className="space-y-6">
                {[
                  { title: "Transparencia Total", desc: "Todos nuestros sorteos se realizan en vivo a través de nuestras redes sociales." },
                  { title: "Entrega Inmediata", desc: "Una vez anunciado el ganador, el ítem se entrega en menos de 24 horas." },
                  { title: "Comunidad Verificada", desc: "Más de 25,000 usuarios avalan nuestra legitimidad en Roblox." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="text-emerald-500" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="glass rounded-2xl p-8 relative z-10"
              >
                <div className="flex items-center gap-4 mb-6">
                  {ownerData?.avatarUrl ? (
                    <img src={ownerData.avatarUrl} alt="NARU_SAM68" className="w-16 h-16 rounded-full border-2 border-emerald-500 bg-zinc-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-zinc-800 animate-pulse" />
                  )}
                  <div>
                    <p className="font-bold text-xl">{ownerData?.displayName || "NARU_SAM68"}</p>
                    <p className="text-xs text-zinc-500">@{ownerData?.username || "NARU_SAM68"}</p>
                  </div>
                </div>
                <p className="text-zinc-300 italic mb-6">
                  {ownerData?.description || "Cargando biografía de Roblox..."}
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold">ID: {ownerData?.id || "..."}</div>
                  <div className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">Owner Verificado</div>
                </div>
              </motion.div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Trophy className="text-black" size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tighter">NARU<span className="text-emerald-500">GIVEAWAYS</span></span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 NARU_SAM68. Todos los derechos reservados. No afiliado oficialmente con Roblox Corp.</p>
          <div className="flex gap-6">
            <a href="#" className="text-zinc-400 hover:text-emerald-400 transition-colors">Discord</a>
            <a href="#" className="text-zinc-400 hover:text-emerald-400 transition-colors">TikTok</a>
            <a href="#" className="text-zinc-400 hover:text-emerald-400 transition-colors">Roblox</a>
          </div>
        </div>
      </footer>
      
      <ChatSystem ownerData={ownerData} />
    </div>
  );
}
