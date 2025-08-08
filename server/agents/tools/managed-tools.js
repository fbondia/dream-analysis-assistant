import dayjs from "dayjs";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

const wrapErrors = async(fn) => {
  try {
      return await fn()
  }
  catch(err) {
    console.error(err)
    return "⚠️ Ocorreu um erro ao executar a operação. Verifique os parâmetros ou tente novamente.";
  }
}

export const createManagedTool = ({name, description, friendly_name, should_confirm, schema_name, schema_fields, fn}) => {

  const execFn = new DynamicStructuredTool({
    name:`${name}`,
    description,
    metadata: { type:"exec", should_confirm, schema_name, friendly_name },
    schema: schema_fields,
    func: async (data, runManager, config) => {
      return await wrapErrors(async()=>{
        const parsed = schema_fields.parse(data)
        return await fn(parsed, config.metadata)
      })
    },
  });

  const evalFn = new DynamicStructuredTool({
    name:`${name}_eval`,
    description,
    metadata: { type:"eval", should_confirm, schema_name, friendly_name },
    schema: schema_fields,
    func: async ({ data }) => {
      return await wrapErrors(async()=>{
        return schema_fields.parse(data)
      })
    },
  });

  return [execFn, evalFn]

}
