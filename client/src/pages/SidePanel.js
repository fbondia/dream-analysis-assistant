import { useMemo, useState } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import ContextViewer from "./Views/ContextViewer";

export default function SidePanel({ contextData }) {

   if (!contextData) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum conteúdo para exibir ainda.
      </Typography>
    );
  }

  return (
    <Paper
      sx={{
        width: 360, // largura aproximada de tela de celular
        flexShrink: 0,
        overflowY: "auto",
        p: 2,
        borderRight: "1px solid #ddd",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 1,
      }}
    >
      <Typography variant="h6" gutterBottom>
        Navegação / Contexto
      </Typography>
      <Divider sx={{ mb: 1 }} />

      <ContextViewer contextData={contextData} />

    </Paper>
  );
}

