import { useEffect, useMemo, useRef, useState } from "react";
import { Send, SmartToy, Person, Delete, Brightness4, Brightness7 } from "@mui/icons-material";
import { Box, AppBar, Toolbar, Typography, IconButton, Container, Paper, List, ListItem, ListItemAvatar, Avatar, ListItemText, TextField, Button, CircularProgress } from "@mui/material";

// Message shape
function nowISO() {
  return new Date().toISOString();
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STORAGE_KEY = "chat.react.singlepage.messages";

export default function ChatPage() {
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [
        { id: crypto.randomUUID(), role: "assistant", content: "Oi! Eu sou seu chat local. Sem servidores, só front-end. Manda uma mensagem pra começar.", createdAt: nowISO() }
      ];
    } catch {
      return [
        { id: crypto.randomUUID(), role: "assistant", content: "Oi! Eu sou seu chat local. Sem servidores, só front-end. Manda uma mensagem pra começar.", createdAt: nowISO() }
      ];
    }
  });
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    // Scroll to bottom when messages change
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const canSend = input.trim().length > 0 && !isTyping;

  async function handleSend() {
    if (!canSend) return;
    const text = input.trim();
    setInput("");

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text, createdAt: nowISO() };
    setMessages((m) => [...m, userMsg]);

    // Fake assistant thinking
    setIsTyping(true);
    const reply = await assistantReply(text);
    setIsTyping(false);
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: reply, createdAt: nowISO() }]);
  }

  async function assistantReply(text) {
    const threadId = localStorage.getItem('demo.threadId') || '';
    const resp = await fetch('http://localhost:3031/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId,
        messages: [
          // opcional: você pode enviar o histórico completo "messages" daqui do front
          { role: 'user', content: text }
        ]
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


  // Simple local assistant — replace with your API call
  function fakeAssistantReply(text) {
    return new Promise((resolve) => {
      const delay = Math.min(1800 + Math.random() * 1200, 3200);
      setTimeout(() => {
        // Toy logic: answer with a tiny helpful vibe
        let answer = "";
        const lower = text.toLowerCase();
        if (/^\s*(oi|ol[aá]|hey|eai|fala|bom\s*dia|boa\s*tarde|boa\s*noite)\b/.test(lower)) {
          answer = "Olá! Como posso te ajudar hoje?";
        } else if (/\?$/.test(text)) {
          answer = "Boa pergunta! Aqui é só um demo local, mas posso te responder de forma genérica: experimente detalhar mais o contexto que eu tento ajudar.";
        } else if (lower.includes("limpar")) {
          answer = "Se quiser limpar o histórico, clique no ícone de lixeira no topo à direita.";
        } else {
          // Slightly transform the input so it's not a raw echo
          const trimmed = text.length > 280 ? text.slice(0, 280) + "…" : text;
          answer = `Entendi: "${trimmed}". (Dica: conecte este componente a uma API para respostas reais.)`;
        }
        resolve(answer);
      }, delay);
    });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearChat() {
    setMessages([
      { id: crypto.randomUUID(), role: "assistant", content: "Chat limpo. Podemos recomeçar!", createdAt: nowISO() }
    ]);
    inputRef.current?.focus();
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <AppBar position="static">
        <Toolbar>
          <SmartToy sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chat (página única)
          </Typography>
          <IconButton color="inherit" onClick={clearChat} title="Limpar chat">
            <Delete />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, py: 2, display: "flex", flexDirection: "column" }}>
        <Paper ref={listRef} variant="outlined" sx={{ flexGrow: 1, overflowY: "auto", p: 2 }}>
          <List>
            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} time={m.createdAt}>
                {m.content}
              </MessageBubble>
            ))}
            {isTyping && (
              <MessageBubble role="assistant" time={nowISO()}>
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

function MessageBubble({ role, time, children }) {
  const isUser = role === "user";
  return (
    <ListItem sx={{ flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-start", mb: 1 }}>
      <ListItemAvatar sx={{ minWidth: "auto", ml: isUser ? 1 : 0, mr: isUser ? 0 : 1 }}>
        <Avatar sx={{ bgcolor: isUser ? "primary.main" : "grey.300", color: isUser ? "primary.contrastText" : "text.primary" }}>
          {isUser ? <Person /> : <SmartToy />}
        </Avatar>
      </ListItemAvatar>
      <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: isUser ? "primary.main" : "background.paper", color: isUser ? "primary.contrastText" : "text.primary", maxWidth: "80%" }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>{children}</Typography>
        <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5 }}>{fmtTime(time)}</Typography>
      </Paper>
    </ListItem>
  );
}