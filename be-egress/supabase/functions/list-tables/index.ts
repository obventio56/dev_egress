// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as path from "https://deno.land/std/path/mod.ts";
import * as YAML from "https://esm.sh/yaml";

const supabaseClient = createClient(
  // Supabase API URL - env var exported by default.
  Deno.env.get("SUPABASE_URL")!,
  // Supabase API ANON KEY - env var exported by default.
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

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
  let sources = [];
  for (const file of yamlFiles) {
    const { data: fileBlob } = await supabaseClient.storage
      .from("dbt-projects")
      .download(file);

    const yaml = await fileBlob.text();
    const config = YAML.parse(yaml);

    if (Array.isArray(config?.models)) {
      models = models.concat(config.models);
    }

    if (Array.isArray(config?.sources)) {
      console.log(config.sources);
      const newSources = config.sources[0].tables.map((t) => {
        return {
          ...t,
          database: config.sources.database,
          schema: config.sources.schema,
          type: "source",
        };
      });
      sources = sources.concat(newSources);
    }
  }

  return { sources, models };
};

serve(async (_req) => {
  const { models, sources } = await loadModels();
  console.log(models, sources);

  const data = {
    models,
    sources,
  };

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
