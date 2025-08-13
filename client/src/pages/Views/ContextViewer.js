import { useMemo, useState } from "react";
import { Box, Paper, Typography, Divider } from "@mui/material";

import HorizontalList from "./HorizontalList";
import CenteredMessage from "./CenteredMessage";
import InfoCard from "./InfoCard";
import EditForm from "./EditForm";
import Analysis from "./Analysis";

export default function ContextViewer({ contextData }) {
  
  if (!contextData) {
    return <></>
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
          Tipo de conteúdo não suportado: {JSON.stringify(contextData, "", 2)}
        </Typography>
      );
  }
}
