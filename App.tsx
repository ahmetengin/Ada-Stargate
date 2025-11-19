import React, { useState, useEffect, useRef } from 'react';
import { Message, MessageRole, ModelType } from './types';
import { Sidebar } from './components/Sidebar';
import { InputArea } from './components/InputArea';
import { MessageBubble } from './components/MessageBubble';
import { streamChatResponse, generateImage } from './services/geminiService';
import { Menu } from 'lucide-react';
import { VoiceModal } from './components/VoiceModal';

const INITIAL_MESSAGE: Message = {
  id: 'init-1',
  role: MessageRole.Model,
  text: "**System Initialization Sequence**\n\n`[SUCCESS]` Tenant Loaded: **wim.ada.network** (West Istanbul Marina)\n`[SUCCESS]` Node Discovery: 9 Nodes Active\n`[SUCCESS]` Distributed Memory: Synced\n\n---\n\n**Ada Orchestrator Online.**\n\nGreetings, Captain. I am connected to the WIM autonomous cluster.\nNodes `ada.sea.wim`, `ada.finance.wim`, and `ada.marina.wim` are standing by. \n\nHow can we assist your operations today?",
  timestamp: Date.now()
};

function App() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.Flash);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendRefined = async (text: string, files: File[]) => {
    const userMsgId = Date.now().toString();
    const fileAttachments = await Promise.all(files.map(async (file) => {
      return new Promise<{mimeType: string, data: string, name: string}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64 = (reader.result as string).split(',')[1];
           resolve({ mimeType: file.type, data: base64, name: file.name });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }));

    const userMessage: Message = {
      id: userMsgId,
      role: MessageRole.User,
      text,
      attachments: fileAttachments,
      timestamp: Date.now()
    };

    // Optimistic update
    const currentHistory = [...messages];
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (selectedModel === ModelType.Image) {
        // Image Gen Mode
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: MessageRole.Model, text: '', timestamp: Date.now() }]);
        
        const imageBase64 = await generateImage(text);
        
        setMessages(prev => prev.map(m => {
           if (m.id === botMsgId) return { ...m, generatedImage: imageBase64, text: `Generated image for: "${text}"` };
           return m;
        }));

      } else {
        // Chat Mode
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: MessageRole.Model, text: '', timestamp: Date.now() }]);
        
        let accumulatedText = "";
        
        await streamChatResponse(
          currentHistory, // Pass history excluding the new message
          text, // The new message text
          fileAttachments, // The new message attachments
          selectedModel,
          useSearch,
          useThinking,
          (chunk, grounding) => {
            accumulatedText += chunk;
            setMessages(prev => prev.map(m => {
              if (m.id === botMsgId) {
                return {
                  ...m,
                  text: accumulatedText,
                  groundingSources: grounding || m.groundingSources
                };
              }
              return m;
            }));
          }
        );
      }
    } catch (e) {
      console.error(e);
       setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: MessageRole.Model,
        text: "System Alert: Connection to node cluster interrupted. Please retry.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-inter overflow-hidden">
      {/* Voice Modal (VHF Radio) */}
      <VoiceModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} />

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar (Desktop) */}
      <Sidebar onClear={() => setMessages([INITIAL_MESSAGE])} />
      
      {/* Mobile Menu (Slide-in) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 transform transition-transform md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
           <span className="font-bold text-lg">Ada Maritime</span>
           <button onClick={() => setMobileMenuOpen(false)}><Menu /></button>
        </div>
        <div className="p-4">
           <button onClick={() => { setMessages([INITIAL_MESSAGE]); setMobileMenuOpen(false); }} className="w-full py-2 bg-indigo-600 rounded-lg">New Session</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full max-w-[100vw]">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-zinc-800 bg-zinc-950">
          <button onClick={() => setMobileMenuOpen(true)} className="mr-3"><Menu /></button>
          <span className="font-semibold">Ada Orchestrator</span>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
          <div className="max-w-4xl mx-auto pt-4 pb-24">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom visually, but flex layout handles it */}
        <div className="bg-zinc-950 border-t border-zinc-800/50">
          <InputArea 
            onSend={handleSendRefined} 
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            useSearch={useSearch}
            onToggleSearch={() => setUseSearch(!useSearch)}
            useThinking={useThinking}
            onToggleThinking={() => setUseThinking(!useThinking)}
            onStartVoice={() => setIsVoiceModalOpen(true)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;