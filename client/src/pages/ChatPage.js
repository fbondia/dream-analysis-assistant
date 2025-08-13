import { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { Box, Paper, TextField, Button, CircularProgress, List, Typography, Divider, Stack } from "@mui/material";
import { Send } from "@mui/icons-material";

import Header from './Header';
import MessageBubble from '../components/MessageBubble';
import SidePanel from "./SidePanel";
import ContextViewer from "./Views/ContextViewer";

const STORAGE_KEY = "chat.react.singlepage.messages";
const greetings = "Oi!";

export default function ChatPage() {

  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [
        { id: crypto.randomUUID(), role: "assistant", content: greetings, createdAt: new Date().toISOString() }
      ];
    } catch {
      return [
        { id: crypto.randomUUID(), role: "assistant", content: greetings, createdAt: new Date().toISOString() }
      ];
    }
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [contextData, setContextData] = useState(null); // <-- contexto para a side panel

  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const canSend = input.trim().length > 0 && !isTyping;

  async function handleSend() {

    if (!canSend) return;
    const text = input.trim();
    setInput("");

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);

    setIsTyping(true);
    const reply = await assistantReply(text);
    setIsTyping(false);

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "assistant", content: reply.text, createdAt: new Date().toISOString() }
    ]);

    setContextData(reply.context);

  }

  async function assistantReply(text) {
    const auth = getAuth();
    const idToken = await auth.currentUser.getIdToken();
    const threadId = auth.currentUser.uid;

    const resp = await fetch(`${process.env.REACT_APP_SERVER_URL}/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({ threadId, text })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();

    // A API pode devolver { message: { content }, context: {...} }
    return {
      text: data.message?.content || '(sem resposta)',
      context: data.context || null
    };
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([{ id: crypto.randomUUID(), role: "assistant", content: greetings, createdAt: new Date().toISOString() }]);
    setContextData(null);
    inputRef.current?.focus();
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header onClearChat={clearChat} />

      {/* Layout lado a lado */}
      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
        
        {/* Painel de navegação/contexto */}
        {1===0 && <SidePanel contextData={contextData} />}

        {/* Área do chat */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2 }}>
          <Paper ref={listRef} variant="outlined" sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
            <List>
              
              {messages.map((m,i) => (
                <MessageBubble key={m.id} role={m.role} time={m.createdAt} contextData={contextData} isLastMessage={i+1===messages.length}>
                  {m}
                </MessageBubble>
              ))}

              {isTyping && (
                <MessageBubble role="assistant" time={new Date().toISOString()}>
                  <CircularProgress size={20} />
                </MessageBubble>
              )}
            </List>
          </Paper>

          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={5}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem…"
              variant="outlined"
            />
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!canSend}
              endIcon={<Send />}
            >
              Enviar
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
