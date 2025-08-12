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
 *  3) Card de apresentação
 *     - Cabeçalho, conteúdo e ações
 * ========================= */
export default function InfoCard({ title, subheader, content, actions }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader title={title} subheader={subheader} />
      <CardContent>{content}</CardContent>
      {actions && <CardActions sx={{ justifyContent: "flex-end" }}>{actions}</CardActions>}
    </Card>
  );
}
