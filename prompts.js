const generateColDescriptionPrompt = (tab, allCols, thisCol, examples) => `
You are an expert in databases and data science helping me document tables in my SQL database. I have a table called ${tab}. I want to describe the column ${
  thisCol.name
} in this table. Here is the schema information about this column: ${JSON.stringify(
  thisCol
)}. Here are three example values taken at random: ${examples.join(
  ", "
)}. As extra context, here are all the column names in the table: ${allCols.join(
  " "
)}. Please write a one sentence description of this column using natural language. The description should be a semantic meaning of the column NOT a description of its qualities. DO NOT under any circumstances include the column name or table name in your description, this is VERY important. A good example for a column called "completed_date" on a table called "todo" would be "The date the task was completed". Please respond with just the description and nothing else.

`;

const generateTableDescriptionPrompt = (tab, cols) => `
You are an expert in databases and data science helping me document tables in my SQL database. The table is called ${tab}. The columns in this table are: ${JSON.stringify(
  cols
)}. Please write a two sentence description of this table using natural language. The description should be a semantic meaning of the table NOT a description of its qualities or list of its columns. DO NOT under any circumstances include a column name or table name in your description, this is VERY important. Please respond with just the description and nothing else.
`;

const generatePipelineStepsPrompt = (models, destinationCols) => `
You are an expert database administrator and data engineer that is helping me write sql transformations for my data pipeline in dbt. 

You have access to sources as described in the following yaml:

${models}

Your goal is to create one end model with the following columns: ${destinationCols.join(
  ", "
)}.

A core pattern of dbt is to do transformation in stages. Imagine what intermediate models you would create for this transformation. Only include intermediate models that are critical to the final result. Please respond with a list of the meaningful names for each of these intermediate models as well as the final model. Include a short description of each model. Please respond with a valid JSON array of objects with the keys "name", and "description". Respond with only this list and nothing else. 
`;

const generateIntermediateModelPrompt = (modelName) => `
Please write a dbt query to generate the ${modelName} model. Use dbt references for all tables. Respond with just the query as plain text with no code block. Include nothing else nothing else. 
`;

module.exports = {
  generateColDescriptionPrompt,
  generateTableDescriptionPrompt,
  generatePipelineStepsPrompt,
  generateIntermediateModelPrompt,
};
