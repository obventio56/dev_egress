// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/utils.ts";

const dbtServerUrl = Deno.env.get("DBT_SERVER_URL")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { headers: corsHeaders });
  }

  const { query } = await req.json();

  console.log(query)

  const res = await fetch(dbtServerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const preview = await res.json();
  console.log(preview)

  return new Response(JSON.stringify({ preview }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
