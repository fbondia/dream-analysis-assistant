
// 1) Lista com navegação
export const listDataContext = {
  type: 'list',
  root: {
    title: 'Clientes',
    items: [
      { id: '1', label: 'Acme S.A.', subtitle: '5 projetos', children: {
          title: 'Acme S.A.',
          items: [
            { id: '1-1', label: 'Projetos', children: {
                title: 'Projetos (Acme)',
                items: [
                  { id: 'p1', label: 'Portal Field Ops', onClick: (it) => console.log('Abrir', it) },
                  { id: 'p2', label: 'Mobile v2', onClick: (it) => console.log('Abrir', it) },
                ]
              }
            },
            { id: '1-2', label: 'Contatos', onClick: (it) => console.log('Contatos', it) },
          ]
        }
      },
      { id: '2', label: 'Globex Ltd.' },
    ]
  },
  onLeafClick: (it) => console.log('Leaf click', it),
};

// 2) Mensagem centralizada
export const messageDataContext = {
  type: 'message',
  title: 'Nada por aqui ainda, noob supremo!',
  subtitle: 'Peça algo no chat para preencher o painel.',
  actions: <Button variant="contained">Criar algo</Button>,
};

// 3) Card
export const cardDataContext = {
  type: 'card',
  title: 'Resumo do Cliente',
  subheader: 'Atualizado há 2h',
  content: (
    <Stack spacing={1}>
      <Typography variant="body2"><b>Nome:</b> Acme S.A.</Typography>
      <Typography variant="body2"><b>Projetos ativos:</b> 2</Typography>
      <Typography variant="body2"><b>Responsável:</b> Maria Silva</Typography>
    </Stack>
  ),
  actions: (
    <>
      <Button size="small" variant="text">Detalhes</Button>
      <Button size="small" variant="contained">Abrir</Button>
    </>
  )
};

// 4) Formulário
export const formDataContext = {
  type: 'form',
  initialValues: { nome: '', status: 'ativo', importante: false },
  schema: z.object({
    nome: z.string().min(2, "Informe ao menos 2 caracteres"),
    status: z.enum(["ativo","inativo"], { message: "Selecione um status" }),
    importante: z.boolean().optional(),
    descricao: z.string().max(200, "Máx. 200 caracteres").optional(),
    idade: z.coerce.number().int().min(0, "Idade inválida").optional(),
  }),
  fields: [
    { name: "nome", label: "Nome", type: "text" },
    { name: "status", label: "Status", type: "select", options: [
        { value: "ativo", label: "Ativo" },
        { value: "inativo", label: "Inativo" },
      ]},
    { name: "importante", label: "Marcar como importante", type: "checkbox" },
    { name: "descricao", label: "Descrição", type: "multiline" },
    { name: "idade", label: "Idade", type: "number" },
  ],
  onSubmit: async (values) => { console.log('Salvar', values); },
  onCancel: () => { console.log('Cancelar'); },
};
