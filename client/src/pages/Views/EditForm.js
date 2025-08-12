import { useState } from "react";
import { z } from "zod";
import {
  Box,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Stack,
  Button,
} from "@mui/material";
import { Save, Close } from "@mui/icons-material";

/** =========================
 *  4) Formulário de edição/preenchimento
 *     - Controlado externamente via onSubmit/onCancel
 *     - Campos comuns: texto, select, checkbox
 *     - `schema` simples: [{ name, label, type, options? }]
 * ========================= */

/**
 * EditForm
 * - Validação com Zod (onBlur por campo + onSubmit no form)
 *
 * Props:
 *  - schema: z.ZodObject<any>          // schema do formulário
 *  - fields: Array<{
 *      name: string,
 *      label: string,
 *      type?: 'text'|'number'|'select'|'checkbox'|'multiline',
 *      options?: Array<{ value: string, label: string }>
 *    }>
 *  - initialValues?: Record<string, any>
 *  - onSubmit?: (valuesValidados) => Promise<void> | void
 *  - onCancel?: (valuesAtuais) => void
 */
export default function EditForm({
  schema,
  fields = [],
  initialValues = {},
  onSubmit,
  onCancel,
}) {
  const [values, setValues] = useState(() => ({
    ...Object.fromEntries(fields.map((f) => [f.name, defaultValueFor(f)])),
    ...initialValues,
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function defaultValueFor(field) {
    if (field.type === "checkbox") return false;
    if (field.type === "select") return "";
    if (field.type === "number") return "";
    return "";
  }

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
    // limpa erro ao digitar
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  // Valida apenas um campo usando pick do schema
  function validateField(name, value) {
    try {
      const single = z.object({ [name]: schema.shape[name] });
      const res = single.safeParse({ [name]: value });
      setErrors((prev) => ({
        ...prev,
        [name]: res.success ? undefined : res.error.issues[0]?.message,
      }));
      return res.success;
    } catch {
      // se não houver shape/não for z.object, cai no full-parse
      const res = schema.safeParse({ ...values, [name]: value });
      if (!res.success) {
        const fieldErr = res.error.issues.find((i) => i.path[0] === name);
        setErrors((prev) => ({ ...prev, [name]: fieldErr?.message }));
        return !fieldErr;
      }
      setErrors((prev) => ({ ...prev, [name]: undefined }));
      return true;
    }
  }

  function collectErrorsFromZod(zodError) {
    const map = {};
    for (const issue of zodError.issues) {
      const key = issue.path[0];
      if (map[key] == null) map[key] = issue.message;
    }
    return map;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(collectErrorsFromZod(parsed.error));
      return;
    }
    try {
      setSaving(true);
      await onSubmit?.(parsed.data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        {fields.map((field) => {
          const { name, label, type = "text", options = [] } = field;
          const val = values[name];

          if (type === "checkbox") {
            return (
              <FormControlLabel
                key={name}
                control={
                  <Checkbox
                    checked={!!val}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setField(name, v);
                      validateField(name, v);
                    }}
                    onBlur={() => validateField(name, !!val)}
                  />
                }
                label={label}
              />
            );
          }

          if (type === "select") {
            return (
              <TextField
                key={name}
                select
                fullWidth
                size="small"
                label={label}
                value={val ?? ""}
                onChange={(e) => setField(name, e.target.value)}
                onBlur={() => validateField(name, values[name])}
                error={!!errors[name]}
                helperText={errors[name] || " "}
              >
                {options.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            );
          }

          return (
            <TextField
              key={name}
              fullWidth
              size="small"
              label={label}
              type={type === "number" ? "number" : "text"}
              multiline={type === "multiline"}
              minRows={type === "multiline" ? 3 : undefined}
              value={val ?? ""}
              onChange={(e) => {
                const raw = e.target.value;
                const v =
                  type === "number" ? (raw === "" ? "" : Number(raw)) : raw;
                setField(name, v);
              }}
              onBlur={() => validateField(name, values[name])}
              error={!!errors[name]}
              helperText={errors[name] || " "}
            />
          );
        })}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="text"
            startIcon={<Close />}
            onClick={() => onCancel?.(values)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<Save />}
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

/* =========================
Exemplo rápido de schema e fields:

import { z } from "zod";
const schema = z.object({
  nome: z.string().min(2, "Informe ao menos 2 caracteres"),
  status: z.enum(["ativo","inativo"], { message: "Selecione um status" }),
  importante: z.boolean().optional(),
  descricao: z.string().max(200, "Máx. 200 caracteres").optional(),
  idade: z.coerce.number().int().min(0, "Idade inválida").optional(),
});

const fields = [
  { name: "nome", label: "Nome", type: "text" },
  { name: "status", label: "Status", type: "select", options: [
      { value: "ativo", label: "Ativo" },
      { value: "inativo", label: "Inativo" },
    ]},
  { name: "importante", label: "Marcar como importante", type: "checkbox" },
  { name: "descricao", label: "Descrição", type: "multiline" },
  { name: "idade", label: "Idade", type: "number" },
];

<EditForm
  schema={schema}
  fields={fields}
  initialValues={{ nome: "", status: "ativo", importante: false }}
  onSubmit={(v) => console.log("submit ok", v)}
  onCancel={(v) => console.log("cancel", v)}
/>
========================= */
