import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Container, Paper, TextField, Button, CircularProgress, List } from "@mui/material";
import { Send } from "@mui/icons-material";

import MessageBubble from './MessageBubble';
import Header from './Header';

const STORAGE_KEY = "chat.react.singlepage.messages";

export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    const greetings = "Oi!";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [
        { id: crypto.randomUUID(), role: "assistant", content:greetings, createdAt: new Date().toISOString() }
      ];
    } catch {
      return [
        { id: crypto.randomUUID(), role: "assistant", content:greetings, createdAt: new Date().toISOString() }
      ];
    }
  });
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
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
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply, createdAt: new Date().toISOString() }]);
  }

  async function assistantReply(text) {
    const threadId = localStorage.getItem('demo.threadId') || '';
    const resp = await fetch('http://localhost:3031/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        messages: [{ role: 'user', content: text }]
      })
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (data.threadId) localStorage.setItem('demo.threadId', data.threadId);
    return data.message?.content || '(sem resposta)';
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([
      { id: crypto.randomUUID(), role: "assistant", content: "Chat limpo. Podemos recomeçar!", createdAt: new Date().toISOString() }
    ]);
    inputRef.current?.focus();
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Header onClearChat={clearChat} />
      
      <Container maxWidth="md" sx={{ flexGrow: 1, py: 2, display: "flex", flexDirection: "column" }}>
        <Paper ref={listRef} variant="outlined" sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
          <List>
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} time={m.createdAt}>
                {m.content}
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
      </Container>
    </Box>
  );
}
