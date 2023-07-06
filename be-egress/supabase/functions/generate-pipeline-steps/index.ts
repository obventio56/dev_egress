// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as YAML from "https://esm.sh/yaml";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
const openaiApiKey = "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";

const generatePipelineStepsPrompt = (models, destinationCols) => `
You are an expert database administrator and data engineer that is helping me write sql transformations for my data pipeline in dbt.

You have access to sources as described in the following yaml:

${models}

Your goal is to create one end model with the following columns: ${destinationCols.join(
  ", "
)}.

A core pattern of dbt is to do transformation in stages. Imagine what intermediate models you would create for this transformation. Only include intermediate models that are critical to the final result. Please respond with a list of the meaningful names for each of these intermediate models as well as the final model. Include a short description of each model. Please respond with a valid JSON array of objects with the keys "name", and "description". Respond with only this list and nothing else.
`;

const prompt = async (messages, model = "gpt-4") => {
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

// const destinationColumns = [
//   "customer_id",
//   "name",
//   "total_spend",
//   "most_recent_order_date",
//   "first_order_date",
//   "order_count",
// ];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { models: selectedModels, destinationColumns } = await req.json();

  const transformedModels = {
    models: Object.values(selectedModels).map((m) => {
      const transformedModel = {
        ...m,
        columns: Object.values(m.columns),
      };
      delete transformedModel["reviewed"];
      return transformedModel;
    }),
  };

  console.log(transformedModels);

  const chain = [
    {
      role: "user",
      content: generatePipelineStepsPrompt(
        YAML.stringify(transformedModels),
        destinationColumns
      ),
    },
  ];

  console.log(chain);

  const stepsRaw = await prompt(chain);
  const steps = JSON.parse(stepsRaw);
  chain.push({ role: "assistant", content: stepsRaw });

  return new Response(JSON.stringify({ chain, steps }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
