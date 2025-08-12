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
export default function CenteredMessage({ title, subtitle, icon = <InfoOutlined />, actions }) {
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
        {title && (
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {actions}
      </Stack>
    </Box>
  );
}
