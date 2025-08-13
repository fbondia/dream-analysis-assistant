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
 * - Mostra etapa, observações e questions em listas densas.
 * - Opções como botões; a "proxima_etapa_sugerida" ganha destaque.
 *
 * Props:
 *  - context: {
 *      current_step: string,
 *      next_step: string,
 *      insights: string[],
 *      questions: string[],
 *      options: { label: string, value?: string, id?: string }[]
 *    }
 *  - onSelectOption?: (option) => void
 */
export default function Analysis({ context = {}, onSelectOption = () => {} }) {
  const {
    current_step = "Etapa",
    next_step = "",
    insights = [],
    questions = [],
    options = []
  } = context || {};

  const sugerida = next_step;

  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={1.5}>
        {/* Cabeçalho da etapa */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="overline" color="text.secondary">
            O que estamos analisando agora:
          </Typography>
          <Chip size="small" label={current_step} />
        </Stack>

        {/* Observações */}
        {!!insights.length && (
          <>
            <Typography variant="subtitle2">O que pude perceber:</Typography>
            <List dense disablePadding>
              {insights.map((txt, i) => (
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

        {/* questions */}
        {(questions?.length>0 && (!(questions.length===1 && questions[0]===""))) && (
          <>
            <Typography variant="subtitle2">Alguns questionamentos que poderiam enriquecer a análise:</Typography>
            <List dense disablePadding>
              {questions.map((q, i) => (
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
        {!!options.length && (
          <>
            <Divider />
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {options.map((opt, i) => {
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
