import { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Button,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Stack,
  Toolbar,
  AppBar,
  Slide
} from "@mui/material";
import {
  ArrowBack,
  ChevronRight,
  InfoOutlined,
  Save,
  Close,
} from "@mui/icons-material";


/** =========================
 *  1) Lista com navegação “horizontal” (drill-down de sublistas)
 *     - Parecido com navegação mobile: título, botão de voltar e transição lateral
 *     - Data-driven via estrutura { title, items: [{ id, label, subtitle?, onClick?, children? }] }
 * ========================= */
export default function HorizontalList({ root, onLeafClick }) {
  const [stack, setStack] = useState([root]); // pilha de níveis

  const current = stack[stack.length - 1];
  const canGoBack = stack.length > 1;

  function enter(node) {
    setStack((s) => [...s, node]);
  }
  function goBack() {
    if (canGoBack) setStack((s) => s.slice(0, -1));
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{ borderRadius: 1, mb: 1 }}
      >
        <Toolbar sx={{ minHeight: 48 }}>
          {canGoBack ? (
            <IconButton size="small" onClick={goBack} edge="start" sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
          ) : (
            <Box sx={{ width: 40, mr: 1 }} /> // espaçador
          )}
          <Typography variant="subtitle1" noWrap sx={{ flex: 1 }}>
            {current.title}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ position: "relative", flex: 1, overflow: "hidden" }}>
        {/* Transição simples de slide à direita/esquerda */}
        <Slide in direction="left" mountOnEnter unmountOnExit>
          <Box sx={{ position: "absolute", inset: 0, overflowY: "auto" }}>
            <List disablePadding>
              {current.items?.map((it) => {
                const hasChildren = !!it.children?.items?.length;
                return (
                  <ListItemButton
                    key={it.id}
                    onClick={() =>
                      hasChildren ? enter(it.children) : (it.onClick?.(it), onLeafClick?.(it))
                    }
                  >
                    <ListItemText
                      primary={it.label}
                      secondary={it.subtitle}
                      primaryTypographyProps={{ variant: "body1" }}
                    />
                    <ChevronRight />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        </Slide>
      </Box>
    </Box>
  );
}
