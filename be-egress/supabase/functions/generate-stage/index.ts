// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const openaiApiKey = "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";

const generateIntermediateModelPrompt = (modelName) => `
Please write a dbt query to generate the ${modelName} model. Use dbt references for all tables. Respond with just the query as plain text with no code block. Include nothing else nothing else. 
`;

const prompt = async (messages, model = "gpt-3.5-turbo") => {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { chain, modelName } = await req.json();
  const stepPrompt = generateIntermediateModelPrompt(modelName);
  chain.push({ role: "user", content: stepPrompt });
  const stepResult = await prompt(chain);
  chain.push({ role: "assistant", content: stepResult });

  return new Response(JSON.stringify({ chain, stepResult }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
