const generateModelNamePrompt = (modelName: string) => `
You are an expert analytics engineer that is helping me write sql transformations for my data pipeline in dbt.
I want to create a new model called ${modelName}. 
Your job is to write clear, plain-english description of this model from its name.
Keep in mind conventions for naming in models in dbt. For example, "stg" is a common prefix for staging models, "int" is a common prefix for intermediate models, and "dim" is a common prefix for dimension models.
Model names will often also contain useful information such as the entity type, the grain of the model, and the type of transformation that is applied.

For example, a good description for a model called int_payments_pivoted_to_orders.sql would be: An intermediate model that aggregates payments to the order level

Using all these clues please write your best one sentence description of the model called ${modelName}. Please respond with just the description and nothing else. 

`;

const generateModelParentsPrompt = (
  modelName: string,
  description: string,
  modelChoices: string
) => `
You are an expert analytics engineer that is helping me write sql transformations for my data pipeline in dbt.
I want to create a new model called ${modelName} which is described as: ${description}.
Your job is to suggest which existing models in my dbt project I should use as sources/parents for this new model. 
The yaml of these existing models is as follows:
${modelChoices}

You should choose which parent models to suggest based on the name of the new model and its description. You should suggest the fewest number of parents necessary to complete the job.
Please respond with a valid JSON array of strings with the names of the chosen parents models. Respond with only this list and nothing else.
For example, for a model called int_orders_pivoted_to_customers.sql you might respond with: ["stg_customers.sql", "stg_orders.sql"]
`;

const generateModelColumnsPrompt = (
  modelName: string,
  description: string,
  parentModels: string
) => `
  You are an expert analytics engineer that is helping me write sql transformations for my data pipeline in dbt.
  I want to create a new model called ${modelName} which is described as: ${description}.
  The yaml of the parent models I will use to create this new model is as follows:
  ${parentModels}
  Your job is to suggest columns that I would want to include in this new model. You should try to assume these columns from the model name, description, and parent models.
  
  Many columns will be carried over directly from the parent models. Try to infer how these names might be normalized or aliased in the new model if it is appropriate.

  Also consider any new aggregations or calculated fields that the new model's specification might indicate.
  
  Please respond with a valid JSON array of strings with the names of the chosen columns. Respond with only this list and nothing else.
  For example, for a model called int_orders_pivoted_to_customers.sql you might respond with: ["customer_id", "order_count", "most_recent_order_date", "first_order_date"]
  `;

const generateModelSqlPrompt = (
  modelName: string,
  description: string,
  parentModels: string,
  modelColumns: string
) => `
    You are an expert analytics engineer that is helping me write sql transformations for my data pipeline in dbt.
    I want to create a new model called ${modelName} which is described as: ${description}.
    The yaml of the parent models I will use to create this new model is as follows:
    ${parentModels}
    The columns I want to include in this new model are: ${modelColumns}

    Your job is to write a dbt style sql query that will create this new model. You should infer the sql query from the model name, description, parent models, and columns.

    Your query should follow best dbt practices such as being dry, including comments, using CTEs and aliases, etc. You should always use ref() and source() to reference other models in the project.

    Do not optimize the query prematurely. Prefer simplicity and readability.

    Please respond with just the sql query and nothing else. Return the query as plain text and do not wrap it in an code block. 
    `;

export {
  generateModelNamePrompt,
  generateModelParentsPrompt,
  generateModelColumnsPrompt,
  generateModelSqlPrompt,
};
