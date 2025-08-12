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
 *  2) Mensagem centralizada
 *     - Útil para estados vazios, sucessos/erros, instruções
 * ========================= */
export default function Analysis({ context, icon = <InfoOutlined /> }) {
  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 2,
      }}
    >
      <Stack spacing={2} alignItems="center" maxWidth={280}>
        <Box aria-hidden>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {context.etapa_atual}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Observações:
            {context.observacoes.map(x=>(
              <Typography>{x}</Typography>
            ))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Perguntas:
            {context.perguntas.map(x=>(
              <Typography>{x}</Typography>
            ))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Opções:
            {context.opcoes.map(x=>(
              <Typography>{x.label}</Typography>
            ))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Opções:
            {context.meta.proxima_etapa_sugerida}
          </Typography>
      </Stack>
    </Box>
  );
}
