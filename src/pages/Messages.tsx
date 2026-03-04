import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Send, Search, MoreVertical, Phone, Video, Image, Paperclip, Smile, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/SEO";

interface Message {
  id: number;
  content: string;
  sender: "me" | "other";
  time: string;
  status: "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  name: string;
  username: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

const mockChats: Chat[] = [
  { id: "rahul_k_2024", name: "Rahul K.", username: "rahul_k_2024", lastMessage: "Hey, did you complete the assignment?", time: "2m", unread: 2, online: true },
  { id: "prof_sharma_cs", name: "Prof. Sharma", username: "prof_sharma_cs", lastMessage: "The deadline is extended", time: "1h", unread: 0, online: false },
  { id: "priya_m_tech", name: "Priya M.", username: "priya_m_tech", lastMessage: "Thanks for the notes!", time: "3h", unread: 0, online: true },
  { id: "amit_bits", name: "Amit S.", username: "amit_bits", lastMessage: "Let's study together tomorrow", time: "1d", unread: 0, online: false },
  { id: "vikram_r_24", name: "Vikram R.", username: "vikram_r_24", lastMessage: "Check out this video", time: "2d", unread: 1, online: false },
];

const mockMessages: Record<string, Message[]> = {
  rahul_k_2024: [
    { id: 1, content: "Hey! How's it going?", sender: "other", time: "10:00 AM", status: "read" },
    { id: 2, content: "Good! Working on the DBMS project", sender: "me", time: "10:02 AM", status: "read" },
    { id: 3, content: "Nice! Need any help?", sender: "other", time: "10:03 AM", status: "read" },
    { id: 4, content: "Actually yes, can you explain normalization?", sender: "me", time: "10:05 AM", status: "read" },
    { id: 5, content: "Sure! Let me send you some notes", sender: "other", time: "10:06 AM", status: "read" },
    { id: 6, content: "Hey, did you complete the assignment?", sender: "other", time: "10:30 AM", status: "delivered" },
  ],
  prof_sharma_cs: [
    { id: 1, content: "Sir, regarding the assignment deadline", sender: "me", time: "9:00 AM", status: "read" },
    { id: 2, content: "Yes, what about it?", sender: "other", time: "9:30 AM", status: "read" },
    { id: 3, content: "Can we get an extension?", sender: "me", time: "9:31 AM", status: "read" },
    { id: 4, content: "The deadline is extended", sender: "other", time: "9:45 AM", status: "read" },
  ],
  priya_m_tech: [
    { id: 1, content: "Hi! Do you have the OS notes?", sender: "other", time: "Yesterday", status: "read" },
    { id: 2, content: "Yes, I'll share them", sender: "me", time: "Yesterday", status: "read" },
    { id: 3, content: "Thanks for the notes!", sender: "other", time: "Yesterday", status: "read" },
  ],
};

const Messages = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentChat = mockChats.find(c => c.username === username);

  useEffect(() => {
    if (username && mockMessages[username]) {
      setMessages(mockMessages[username]);
    }
  }, [username]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: messages.length + 1,
      content: newMessage,
      sender: "me",
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: "sent"
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage("");
  };

  // Chat List View
  if (!username) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO
          title="Messages"
          description="Direct messages in StudyShare."
          noIndex
        />
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/study")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Messages</h1>
              <p className="text-sm text-muted-foreground">Chat with friends & teachers</p>
            </div>
          </div>
        </header>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => navigate(`/messages/${encodeURIComponent(chat.username)}`)}
                className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {chat.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground">{chat.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium">
                    {chat.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Chat Conversation View
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title={currentChat?.name ? `Chat with ${currentChat.name}` : "Messages"}
        description="Conversation view in StudyShare."
        noIndex
      />
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/messages")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div 
            className="flex items-center gap-3 flex-1 cursor-pointer"
            onClick={() => {
              if (username) {
                navigate(`/profile/${encodeURIComponent(username)}`);
              }
            }}
          >
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {currentChat?.name[0] || "?"}
                </AvatarFallback>
              </Avatar>
              {currentChat?.online && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
              )}
            </div>
            <div>
              <h1 className="font-semibold text-foreground">{currentChat?.name}</h1>
              <p className="text-xs text-muted-foreground">
                {currentChat?.online ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-3 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.sender === "me" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  message.sender === "me"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <div className={cn(
                  "flex items-center gap-1 mt-1",
                  message.sender === "me" ? "justify-end" : "justify-start"
                )}>
                  <span className="text-xs opacity-70">{message.time}</span>
                  {message.sender === "me" && (
                    message.status === "read" ? (
                      <CheckCheck className="w-3 h-3 text-blue-400" />
                    ) : (
                      <Check className="w-3 h-3 opacity-70" />
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="flex items-center gap-2 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="shrink-0">
            <Smile className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" className="shrink-0">
            <Image className="w-5 h-5" />
          </Button>
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
