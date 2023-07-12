// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { prompt, corsHeaders } from "../_shared/utils.ts";
import { generateModelNamePrompt } from "../_shared/prompts.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { modelName } = await req.json();
  const modelNamePrompt = generateModelNamePrompt(modelName);
  const chain = [
    {
      role: "user",
      content: modelNamePrompt,
    },
  ];

  const description = await prompt(chain);

  return new Response(JSON.stringify({ description }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
