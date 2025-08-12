import { useEffect, useRef, useState } from "react";
import { getAuth } from "firebase/auth";
import { Box, Paper, TextField, Button, CircularProgress, List, Typography, Divider, Stack } from "@mui/material";
import { Send } from "@mui/icons-material";

import Header from './Header';
import MessageBubble from '../components/MessageBubble';
import SidePanel from "./SidePanel";
import z from "zod";

const STORAGE_KEY = "chat.react.singlepage.messages";
const greetings = "Oi!";

// 1) Lista com navegação
const listDataContext = {
  type: 'list',
  root: {
    title: 'Clientes',
    items: [
      { id: '1', label: 'Acme S.A.', subtitle: '5 projetos', children: {
          title: 'Acme S.A.',
          items: [
            { id: '1-1', label: 'Projetos', children: {
                title: 'Projetos (Acme)',
                items: [
                  { id: 'p1', label: 'Portal Field Ops', onClick: (it) => console.log('Abrir', it) },
                  { id: 'p2', label: 'Mobile v2', onClick: (it) => console.log('Abrir', it) },
                ]
              }
            },
            { id: '1-2', label: 'Contatos', onClick: (it) => console.log('Contatos', it) },
          ]
        }
      },
      { id: '2', label: 'Globex Ltd.' },
    ]
  },
  onLeafClick: (it) => console.log('Leaf click', it),
};

// 2) Mensagem centralizada
const messageDataContext = {
  type: 'message',
  title: 'Nada por aqui ainda, noob supremo!',
  subtitle: 'Peça algo no chat para preencher o painel.',
  actions: <Button variant="contained">Criar algo</Button>,
};

// 3) Card
const cardDataContext = {
  type: 'card',
  title: 'Resumo do Cliente',
  subheader: 'Atualizado há 2h',
  content: (
    <Stack spacing={1}>
      <Typography variant="body2"><b>Nome:</b> Acme S.A.</Typography>
      <Typography variant="body2"><b>Projetos ativos:</b> 2</Typography>
      <Typography variant="body2"><b>Responsável:</b> Maria Silva</Typography>
    </Stack>
  ),
  actions: (
    <>
      <Button size="small" variant="text">Detalhes</Button>
      <Button size="small" variant="contained">Abrir</Button>
    </>
  )
};

// 4) Formulário
const formDataContext = {
  type: 'form',
  initialValues: { nome: '', status: 'ativo', importante: false },
  schema: z.object({
    nome: z.string().min(2, "Informe ao menos 2 caracteres"),
    status: z.enum(["ativo","inativo"], { message: "Selecione um status" }),
    importante: z.boolean().optional(),
    descricao: z.string().max(200, "Máx. 200 caracteres").optional(),
    idade: z.coerce.number().int().min(0, "Idade inválida").optional(),
  }),
  fields: [
    { name: "nome", label: "Nome", type: "text" },
    { name: "status", label: "Status", type: "select", options: [
        { value: "ativo", label: "Ativo" },
        { value: "inativo", label: "Inativo" },
      ]},
    { name: "importante", label: "Marcar como importante", type: "checkbox" },
    { name: "descricao", label: "Descrição", type: "multiline" },
    { name: "idade", label: "Idade", type: "number" },
  ],
  onSubmit: async (values) => { console.log('Salvar', values); },
  onCancel: () => { console.log('Cancelar'); },
};

export default function ChatPage() {
  const [mode, setMode] = useState("specific");
  const [persona, setPersona] = useState("jung");

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
  const [contextData, setContextData] = useState(formDataContext); // <-- contexto para a side panel

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

    // Atualiza contexto se vier do servidor
    if (reply.context) {
      setContextData(reply.context);
    }
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
      body: JSON.stringify({ threadId, mode, persona, text })
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
      <Header
        onClearChat={clearChat}
        mode={mode}
        persona={persona}
        onChangeMode={setMode}
        onChangePersona={setPersona}
      />

      {/* Layout lado a lado */}
      <Box sx={{ flexGrow: 1, display: "flex", overflow: "hidden" }}>
        {/* Painel de navegação/contexto */}
        <SidePanel contextData={contextData} />

        {/* Área do chat */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", p: 2 }}>
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
        </Box>
      </Box>
    </Box>
  );
}
