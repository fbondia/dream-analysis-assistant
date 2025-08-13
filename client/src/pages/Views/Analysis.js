import {
  Box,
  Stack,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
} from "@mui/material";
import { InfoOutlined, ChevronRight } from "@mui/icons-material";

/**
 * Componente compacto para uso dentro de um MessageBubble.
 * - Mostra etapa, observações e perguntas em listas densas.
 * - Opções como botões; a "proxima_etapa_sugerida" ganha destaque.
 *
 * Props:
 *  - context: {
 *      etapa_atual: string,
 *      observacoes: string[],
 *      perguntas: string[],
 *      opcoes: { label: string, value?: string, id?: string }[],
 *      meta?: { proxima_etapa_sugerida?: string }
 *    }
 *  - onSelectOption?: (option) => void
 */
export default function Analysis({ context = {}, onSelectOption = () => {} }) {
  const {
    etapa_atual = "Etapa",
    observacoes = [],
    perguntas = [],
    opcoes = [],
    meta = {},
  } = context || {};

  const sugerida = meta?.proxima_etapa_sugerida;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={1.5}>
        {/* Cabeçalho da etapa */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" color="text.secondary">
            O que estamos analisando agora:
          </Typography>
          <Chip size="small" label={etapa_atual} />
        </Stack>

        {/* Observações */}
        {!!observacoes.length && (
          <>
            <Typography variant="subtitle2">O que pude perceber:</Typography>
            <List dense disablePadding>
              {observacoes.map((txt, i) => (
                <ListItem key={`obs-${i}`}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <InfoOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={txt} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Perguntas */}
        {!!perguntas.length && (
          <>
            <Typography variant="subtitle2">Alguns questionamentos que poderiam enriquecer a análise:</Typography>
            <List dense disablePadding>
              {perguntas.map((q, i) => (
                <ListItem key={`q-${i}`} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 24 }}>
                    <ChevronRight fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={`${i + 1}. ${q}`} />
                </ListItem>
              ))}
            </List>
          </>
        )}

        {/* Opções como botões */}
        {!!opcoes.length && (
          <>
            <Divider />
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {opcoes.map((opt, i) => {
                const isPrimary =
                  opt.label === sugerida ||
                  opt.value === sugerida ||
                  opt.id === sugerida;
                return (
                  <Button
                    key={`opt-${i}`}
                    size="small"
                    variant={isPrimary ? "contained" : "outlined"}
                    endIcon={<ChevronRight />}
                    onClick={() => onSelectOption(opt)}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </Stack>
            {sugerida && (
              <Typography variant="caption" color="text.secondary">
                Sugestão do assistente: <strong>{sugerida}</strong>
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
