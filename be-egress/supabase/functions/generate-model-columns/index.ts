// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { prompt, corsHeaders, loadModels } from "../_shared/utils.ts";
import { generateModelColumnsPrompt } from "../_shared/prompts.ts";
import * as YAML from "https://esm.sh/yaml";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { modelName, modelDescription, modelParents } = await req.json();

  const allModels = await loadModels();
  const filteredModels = allModels.filter((m) => modelParents.includes(m.name));

  const modelNamePrompt = generateModelColumnsPrompt(
    modelName,
    modelDescription,
    YAML.stringify(filteredModels)
  );
  const chain = [
    {
      role: "user",
      content: modelNamePrompt,
    },
  ];

  const columnsRaw = await prompt(chain);
  console.log(columnsRaw);
  const columns = JSON.parse(columnsRaw);

  return new Response(JSON.stringify({ columns }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
