// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { prompt, corsHeaders, loadModels } from "../_shared/utils.ts";
import {
  generateModelColumnsPrompt,
  generateModelSqlPrompt,
} from "../_shared/prompts.ts";
import * as YAML from "https://esm.sh/yaml";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { modelName, modelDescription, modelParents, modelColumns } =
    await req.json();

  const allModels = await loadModels();
  const filteredModels = allModels.filter((m) => modelParents.includes(m.name));

  const modelSqlPrompt = generateModelSqlPrompt(
    modelName,
    modelDescription,
    YAML.stringify(filteredModels),
    modelColumns.join(", ")
  );
  const chain = [
    {
      role: "user",
      content: modelSqlPrompt,
    },
  ];

  const sql = await prompt(chain, "gpt-4");

  return new Response(JSON.stringify({ sql }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
