import { useState } from "react";
import { ListItem, ListItemAvatar, Avatar, Paper, Typography, IconButton, Tooltip } from "@mui/material";
import { Person, SmartToy, ContentCopy } from "@mui/icons-material";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContextViewer from "../pages/Views/ContextViewer";

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ role, time, contextData, isLastMessage, children }) {

  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(children?.content || children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <ListItem
      sx={{
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        mb: 1
      }}
    >
      <ListItemAvatar sx={{ minWidth: "auto", ml: isUser ? 1 : 0, mr: isUser ? 0 : 1 }}>
        <Avatar
          sx={{
            bgcolor: isUser ? "primary.main" : "grey.300",
            color: isUser ? "primary.contrastText" : "text.primary"
          }}
        >
          {isUser ? <Person /> : <SmartToy />}
        </Avatar>
      </ListItemAvatar>

      <Paper
        elevation={1}
        sx={{
          position: "relative",
          p: 1.5,
          borderRadius: 2,
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
          minWidth: "50%",
          maxWidth: "80%"
        }}
      >
        <Tooltip title={copied ? "Copiado!" : "Copiar"}>
          <IconButton
            size="small"
            onClick={handleCopy}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              color: isUser ? "primary.contrastText" : "text.secondary"
            }}
          >
            <ContentCopy fontSize="inherit" />
          </IconButton>
        </Tooltip>

        <MaybeMarkdown contextData={contextData} isLastMessage={isLastMessage}>{children}</MaybeMarkdown>

        {time &&
          <Typography variant="caption" sx={{ display: "block", textAlign: "right", mt: 0.5 }}>
            {fmtTime(time)}
          </Typography>
        }
      </Paper>
    </ListItem>
  );
}

function MaybeMarkdown({ contextData, isLastMessage, children }) {

  if (isLastMessage && contextData && children.role !== 'user') {
    return <ContextViewer contextData={contextData} />
  }

  if (typeof children === 'string') {
    return (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    )
  }
  
  if (typeof children.content === 'string') {
    return (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children.content}</ReactMarkdown>
    )
  }

  // se vier array de strings, também dá pra aceitar:
  if (Array.isArray(children) && children.every(c => typeof c === 'string' || typeof c === 'number')) {
    return (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{children.join('')}</ReactMarkdown>
    )
  }

  // qualquer outra coisa (elementos React, null, etc.)
  return <>{children}</>;

}
