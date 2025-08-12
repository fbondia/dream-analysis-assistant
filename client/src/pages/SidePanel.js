import { useMemo, useState } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";
import HorizontalList from "./Views/HorizontalList";
import CenteredMessage from "./Views/CenteredMessage";
import InfoCard from "./Views/InfoCard";
import EditForm from "./Views/EditForm";
import Analysis from "./Views/Analysis";

/** =========================
 *  SidePanel com “Conteúdo” plugável
 *  contextData = { type: 'list'|'message'|'card'|'form', ...payload }
 * ========================= */
export default function SidePanel({ contextData }) {
  function renderContent() {
    if (!contextData) {
      return (
        <Typography variant="body2" color="text.secondary">
          Nenhum conteúdo para exibir ainda.
        </Typography>
      );
    }

    switch (contextData.type) {

      case "analysis": {
        return <Analysis context={contextData} />
      }

      case "list": {
        // payload esperado:
        // { root: { title, items: [{ id, label, subtitle?, onClick?, children? }] }, onLeafClick? }
        const { root, onLeafClick } = contextData;
        return <HorizontalList root={root} onLeafClick={onLeafClick} />;
      }

      case "message": {
        // payload esperado: { title, subtitle, icon?, actions? }
        const { title, subtitle, icon, actions } = contextData;
        return (
          <CenteredMessage
            title={title}
            subtitle={subtitle}
            icon={icon}
            actions={actions}
          />
        );
      }

      case "card": {
        // payload esperado: { title, subheader, content, actions }
        const { title, subheader, content, actions } = contextData;
        return <InfoCard title={title} subheader={subheader} content={content} actions={actions} />;
      }

      case "form": {
        // payload esperado: { initialValues, schema, onSubmit, onCancel }
        const { initialValues, schema, fields, onSubmit, onCancel } = contextData;
        return (
          <EditForm
            initialValues={initialValues}
            schema={schema}
            fields={fields}
            onSubmit={onSubmit}
            onCancel={onCancel}
          />
        );
      }

      default:
        return (
          <Typography variant="body2" color="text.secondary">
            Tipo de conteúdo não suportado: {String(contextData.type)}
          </Typography>
        );
    }
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

      {/* Conteúdo */}
      {renderContent()}
    </Paper>
  );
}

