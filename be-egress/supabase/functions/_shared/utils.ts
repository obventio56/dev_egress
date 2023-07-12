import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as path from "https://deno.land/std/path/mod.ts";
import * as YAML from "https://esm.sh/yaml";

const openaiApiKey = "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";

const supabaseClient = createClient(
  // Supabase API URL - env var exported by default.
  Deno.env.get("SUPABASE_URL")!,
  // Supabase API ANON KEY - env var exported by default.
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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

    console.log(data);

    return data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ignoreDirs = ["node_modules", ".git", ".vscode", "dbt_project.yml"];

const findYamlFiles = async (directoryPath: string) => {
  const fileList = [];
  const folderQueue = new Set();
  folderQueue.add(directoryPath);

  while (folderQueue.size > 0) {
    const folder = folderQueue.values().next().value;
    const { data: bucketData } = await supabaseClient.storage
      .from("dbt-projects")
      .list(folder);
    const files = bucketData.filter((f) => !ignoreDirs.includes(f.name));

    for (const file of files) {
      const filePath = path.join(folder, file.name);

      if (!file.metadata) {
        folderQueue.add(filePath);
        continue;
      }
      if (
        path.extname(file.name) === ".yaml" ||
        path.extname(file.name) === ".yml"
      ) {
        fileList.push(filePath);
      }
    }
    folderQueue.delete(folder);
  }

  return fileList;
};

const loadModels = async () => {
  const yamlFiles = await findYamlFiles("");

  let models = [];

  for (const file of yamlFiles) {
    const { data: fileBlob } = await supabaseClient.storage
      .from("dbt-projects")
      .download(file);

    const yaml = await fileBlob.text();
    const config = YAML.parse(yaml);

    if (Array.isArray(config?.models)) {
      models = models.concat(config.models);
    }
  }

  return models;
};

export { prompt, corsHeaders, supabaseClient, loadModels };
