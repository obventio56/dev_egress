const axios = require("axios");
const snowflake = require("snowflake-sdk");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");
const {
  generateColDescriptionPrompt,
  generateTableDescriptionPrompt,
  generatePipelineStepsPrompt,
  generateIntermediateModelPrompt,
} = require("./prompts");

const openaiApiKey = "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";

const openAIClient = axios.create({
  baseURL: "https://api.openai.com/v1/",
  timeout: 20000,
  headers: {
    Authorization: `Bearer ${openaiApiKey}`,
    "Content-Type": "application/json",
  },
});

const connection = snowflake.createConnection({
  account: "vzb59948.prod3.us-west-2.aws",
  username: "EGRESS",
  password: "Lopits56$",
  application: "NodeJS",
});

const oneShotPrompt = async (prompt, model = "gpt-3.5-turbo") => {
  try {
    const response = await openAIClient.post("chat/completions", {
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
};

const prompt = async (messages, model = "gpt-3.5-turbo") => {
  try {
    const response = await openAIClient.post("chat/completions", {
      model,
      messages,
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
  }
};

const getSnowflakeConnection = (connection) =>
  new Promise((resolve, reject) => {
    connection.connect((err, conn) => {
      if (err) {
        console.error("Unable to connect: " + err.message);
        reject(err);
      } else {
        console.log("Successfully connected to Snowflake.");
        // Optional: store the connection ID.
        console.log("Connection ID: " + conn.getId() + "\n");
        resolve(conn);
      }
    });
  });

const querySnowflake = (conn, query) =>
  new Promise((resolve, reject) => {
    conn.execute({
      sqlText: query,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error(
            `Failed to execute statement due to the following error: ${err.message}`
          );
          reject(err);
        } else {
          resolve(rows);
        }
      },
    });
  });

const describeTable = async (conn, tableName) => {
  const schema = await querySnowflake(conn, `DESCRIBE TABLE ${tableName}`);
  const examples = await querySnowflake(
    conn,
    `SELECT * FROM ${tableName} SAMPLE (3 ROWS);`
  );

  const labelJobs = schema.map((col, i) => {
    const colExamples = examples.map((row) => row[col.name]);
    const prompt = generateColDescriptionPrompt(
      tableName,
      schema.map((c) => c.name),
      col,
      colExamples
    );

    return new Promise(async (resolve, reject) => {
      oneShotPrompt(prompt).then((description) => {
        resolve({ name: col.name, description });
      });
    });
  });

  const columnResults = await Promise.all(labelJobs);
  const tableDescription = await oneShotPrompt(
    generateTableDescriptionPrompt(tableName, columnResults)
  );

  return {
    name: tableName.split(".")[2], // should not be hardcoded
    description: tableDescription,
    columns: columnResults,
  };
};

const describeSchema = async (conn, schemaName) => {
  const tables = await querySnowflake(conn, `SHOW TABLES IN ${schemaName}`);
  const tableDescriptions = await Promise.all(
    tables.map((table) =>
      describeTable(
        conn,
        `${table.database_name}.${table.schema_name}.${table.name}`
      )
    )
  );

  console.log(tableDescriptions);
  return tableDescriptions;
};

/**
 * What is the most simple example?
 *
 * You have some models created (ex. your staging models) and you want to generate some pipeline. Best
 * case scenario is that they are already documented by hand. From here, you read the model documentation
 * for selected models and feed it to the chain.
 */

// Eventually want to read this from a config file
const ignoreDirs = ["node_modules", ".git", ".vscode", "dbt_project.yml"];

const findYamlFiles = (directoryPath) => {
  const fileList = [];

  const traverseDirectory = (dirPath) => {
    const files = fs
      .readdirSync(dirPath)
      .filter((f) => !ignoreDirs.includes(f));

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const fileStat = fs.statSync(filePath);

      if (fileStat.isDirectory()) {
        traverseDirectory(filePath);
      } else if (
        path.extname(file) === ".yaml" ||
        path.extname(file) === ".yml"
      ) {
        fileList.push(filePath);
      }
    });
  };

  traverseDirectory(directoryPath);

  return fileList;
};

const loadModels = () => {
  const yamlFiles = findYamlFiles(".");

  let models = [];

  for (const file of yamlFiles) {
    const yaml = fs.readFileSync(file, "utf8");
    const config = YAML.parse(yaml);
    if (Array.isArray(config?.models)) {
      models = models.concat(config.models);
    }
  }

  return models;
};

const generateModel = async (sourceModels, destinationColumns, prompt) => {};

const useModels = ["stg_customers", "stg_orders"];
const destinationColumns = [
  "customer_id",
  "name",
  "total_spend",
  "most_recent_order_date",
  "first_order_date",
  "order_count",
];

(async () => {



  // const models = loadModels(".");
  // const queryModels = {
  //   models: models.filter((m) => useModels.includes(m.name)),
  // };

  // const chain = [
  //   {
  //     role: "user",
  //     content: generatePipelineStepsPrompt(
  //       YAML.stringify(queryModels),
  //       destinationColumns
  //     ),
  //   },
  // ];

  // const stepsRaw = await prompt(chain);
  // const steps = JSON.parse(stepsRaw);
  // chain.push({ role: "assistant", content: stepsRaw });

  // for (const step of steps) {
  //   const stepPrompt = generateIntermediateModelPrompt(step.name);
  //   chain.push({ role: "user", content: stepPrompt });
  //   const stepResult = await prompt(chain);
  //   chain.push({ role: "assistant", content: stepResult });
  //   console.log(stepResult);
  // }
  const conn = await getSnowflakeConnection(connection);
  const descriptions = await describeSchema(conn, "pc_dbt_db.dbt_apedersen");

  const yaml = YAML.stringify({
    sources: [
      {
        name: "pc_dbt_db",
        database: "dbt_apedersen",
        schema: "pc_dbt_db",
        tables: descriptions,
      },
    ],
  });

  console.log(yaml);
})();

