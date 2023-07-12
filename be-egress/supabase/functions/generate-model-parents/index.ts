// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { prompt, corsHeaders, loadModels } from "../_shared/utils.ts";
import { generateModelParentsPrompt } from "../_shared/prompts.ts";
import * as YAML from "https://esm.sh/yaml";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const allModels = await loadModels();

  const { modelName, modelDescription } = await req.json();
  const modelNamePrompt = generateModelParentsPrompt(
    modelName,
    modelDescription,
    YAML.stringify(allModels)
  );
  const chain = [
    {
      role: "user",
      content: modelNamePrompt,
    },
  ];

  const parentsRaw = await prompt(chain);
  console.log(parentsRaw);
  const parents = JSON.parse(parentsRaw);

  return new Response(JSON.stringify({ parents }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
