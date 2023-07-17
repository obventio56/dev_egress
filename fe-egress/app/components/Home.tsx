"use client";
import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Oval } from "react-loader-spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAdd,
  faCube,
  faSnowflake,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

export default function Home({ models: { models: dbtModels, sources } }) {
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const [loadingParentModels, setLoadingParentModels] = useState(false);
  const [loadingModelColumns, setLoadingModelColumns] = useState(false);
  const [loadingModelDescription, setLoadingModelDescription] = useState(false);
  const [loadingModelSql, setLoadingModelSql] = useState(false);
  const [loadingPreview, setLoadingPreivew] = useState(false);
  const [specifyingModel, setSpecifyingModel] = useState(false);
  const [editingModel, setEditingModel] = useState(false);

  const [newColumnName, setNewColumnName] = useState("");
  const [modelSearchString, setModelSearchString] = useState("");

  const [modelName, setModelName] = useState("");
  const [modelDescription, setModelDescription] = useState("");
  const [modelParents, setModelParents] = useState([]);
  const [modelColumns, setModelColumns] = useState({});
  const [modelSql, setModelSql] = useState("");
  const [previewResults, setPreviewResults] = useState([]);

  const [previewError, setPreviewError] = useState(null);

  const [editorMode, setEditorMode] = useState("sql");

  const models = useMemo(() => {
    console.log(dbtModels, sources);
    return { models: [...dbtModels, ...sources] };
  }, []);

  console.log(models);

  const filteredModelList = useMemo(() => {
    if (!models.models || !modelSearchString) return [];

    return models.models
      .filter((model) =>
        model.name.toLowerCase().includes(modelSearchString.toLowerCase())
      )
      .slice(0, 4);
  }, [modelSearchString]);

  const submitModelName = async (modelNameValue: string) => {
    setLoadingModelDescription(true);
    setLoadingParentModels(true);
    setLoadingModelColumns(true);
    setSpecifyingModel(true);
    console.log(modelNameValue);

    const {
      data: { description },
    } = await supabaseClient.functions.invoke("generate-model-description", {
      body: { modelName: modelNameValue },
    });
    setModelDescription(description);
    setLoadingModelDescription(false);

    const {
      data: { parents },
    } = await supabaseClient.functions.invoke("generate-model-parents", {
      body: { modelName: modelNameValue, modelDescription: description },
    });
    console.log(parents);
    setModelParents(parents);
    setLoadingParentModels(false);
    const {
      data: { columns },
    } = await supabaseClient.functions.invoke("generate-model-columns", {
      body: {
        modelName: modelNameValue,
        modelDescription: description,
        modelParents: parents,
      },
    });
    console.log(columns);
    const transformedColumns = Object.fromEntries(columns.map((c) => [c, c]));
    setModelColumns(transformedColumns);
    setLoadingModelColumns(false);
  };

  const submitModelGeneration = async (
    modelNameValue: string,
    modelDescriptionValue: string,
    modelParentsValue: string[],
    modelColumnsDict: Record<string, string>
  ) => {
    setLoadingModelSql(true);
    setEditingModel(true);
    const modelColumnsValue = Object.values(modelColumnsDict);
    const {
      data: { sql },
    } = await supabaseClient.functions.invoke("generate-model-sql", {
      body: {
        modelName: modelNameValue,
        modelDescription: modelDescriptionValue,
        modelParents: modelParentsValue,
        modelColumns: modelColumnsValue,
      },
    });
    console.log(sql);
    setModelSql(sql);
    setLoadingModelSql(false);
  };

  const getModelPreview = async () => {
    setLoadingPreivew(true);
    setPreviewError(null);
    setEditorMode("preview");

    if (!modelSql) return;
    console.log(modelSql);
    const {
      data: { preview, error },
    } = await supabaseClient.functions.invoke("generate-model-preview", {
      body: {
        query: modelSql,
      },
    });

    if (preview.error) {
      setPreviewError(preview.error);
      setLoadingPreivew(false);
      console.log(preview.error);
      return;
    }

    console.log(preview);
    setPreviewResults(preview);
    setLoadingPreivew(false);
  };

  return (
    <div className="grid grid-cols-auto grid-rows-[30px_auto]">
      <div className="text-xs flex px-7 py-1 font-mono items-center justify-between grid-col-1 grid-row-1">
        <div className="flex gap-4">
          <span>
            <span className="font-bold">connected:</span>{" "}
            <FontAwesomeIcon icon={faSnowflake} /> prod-snowflake
          </span>
          <span>
            <span className="font-bold">user:</span> egress
          </span>
        </div>
        <div className="flex gap-4">
          <span>
            <span className="font-bold">dbt version:</span> 1.5
          </span>
          <span>
            <span className="font-bold">branch:</span> main
          </span>
          <span>
            <span className="font-bold">last commit:</span> e740b8e
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[max-content_auto_max-content] grid-rows-[auto_100px] grid-col-1 grid-row-1 row-start-2">
        {!editingModel && !specifyingModel && (
          <div className="col-start-2 col-span-1 row-start-1 row-span-1 w-2/5 h-[500px] overflow-y-scroll justify-self-center mt-5">
            <div className="flex items-center justify-start gap-2 ">
              <h1 className="font-bold">Catalog</h1>{" "}
              <span className="text-sm text-gray-700">
                - models and sources in the demo project you can interact with.
              </span>
            </div>
            <ul className=" text-xs w-fit  max-w-full ">
              {models.models.map((model) => (
                <li className="grid grid-cols-1 grid-rows-[auto_auto] px-2 py-3 border-b-2 border-b-black   last:border-b-0">
                  <span>{model.name}.sql</span>
                  <span className=" text-gray-500">{model.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {editingModel && (
          <div className="grid-col-2 col-span-1 grid-row-1 row-span-1 py-5 flex justify-center">
            {loadingModelSql ? (
              <div className="w-full h-56 flex items-center justify-center">
                <Oval
                  height={40}
                  width={40}
                  color="#000000"
                  wrapperStyle={{}}
                  wrapperClass=""
                  visible={true}
                  ariaLabel="oval-loading"
                  secondaryColor="rgb(249, 250, 251)"
                  strokeWidth={5}
                  strokeWidthSecondary={5}
                />
              </div>
            ) : (
              <div className="w-3/4 grid grid-cols-1 grid-rows-[40px_auto]">
                <div className="flex justify-between grid-row-1 row-span-1">
                  <div className="flex gap-1 items-start">
                    <button
                      className={`text-sm  border-black border-2  rounded-md py-1 px-2 ${
                        editorMode === "sql" ? "bg-black text-white" : ""
                      }`}
                      onClick={() => setEditorMode("sql")}
                    >
                      sql editor
                    </button>
                    <button
                      className={`text-sm  border-black border-2  rounded-md py-1 px-2 ${
                        editorMode === "preview" ? "bg-black text-white" : ""
                      }`}
                      onClick={getModelPreview}
                    >
                      query preview
                    </button>
                    <button
                      disabled
                      className="text-sm  border-black border-2  rounded-md py-1 px-2"
                    >
                      tests (coming soon)
                    </button>
                    <button
                      disabled
                      className="text-sm  border-black border-2  rounded-md py-1 px-2"
                    >
                      docs (coming soon)
                    </button>
                  </div>
                  <div className="flex gap-1 items-start">
                    <button
                      disabled
                      className="text-sm border-2 border-black rounded-md py-1 px-2"
                    >
                      commit model
                    </button>
                  </div>
                </div>
                {editorMode === "sql" && (
                  <textarea
                    className="w-full h-full font-mono text-sm border-2 border-black rounded-md px-5 py-3 grid-row-2 row-span-1"
                    value={modelSql}
                    onChange={(e) => setModelSql(e.target.value)}
                  />
                )}
                {editorMode === "preview" && (
                  <div className="w-full h-full">
                    {loadingPreview ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Oval
                          height={40}
                          width={40}
                          color="#000000"
                          wrapperStyle={{}}
                          wrapperClass=""
                          visible={true}
                          ariaLabel="oval-loading"
                          secondaryColor="rgb(249, 250, 251)"
                          strokeWidth={5}
                          strokeWidthSecondary={5}
                        />
                      </div>
                    ) : (
                      <>
                        {previewError ? (
                          <div className="max-w-full overflow-x-scroll my-3">
                            <span className=" text-red-400">
                              There was an error:
                            </span>
                            <pre className="text-xs font-mono max-w-full">
                              {previewError}
                            </pre>
                          </div>
                        ) : (
                          <div
                            className={`grid grid-cols-[${Object.keys(
                              previewResults[0]
                            )
                              .map((_) => "min-content")
                              .join(
                                "_"
                              )}] grid-rows-[auto] border border-black rounded-md`}
                          >
                            {Object.keys(previewResults[0]).map(
                              (columnHeader, idx) => (
                                <div
                                  className={`p-1 border border-black font-bold row-start-1 row-span-1 col-span-1 col-start-${
                                    idx + 1
                                  }`}
                                >
                                  {columnHeader.toLocaleLowerCase()}
                                </div>
                              )
                            )}
                            {previewResults.map((row, rowIdx) => (
                              <>
                                {Object.values(row).map(
                                  (columnValue, colIdx) => (
                                    <div
                                      className={`row-start-${
                                        rowIdx + 2
                                      } p-1 border border-black row-span-1 text-gray-700 col-span-1 col-start-${
                                        colIdx + 1
                                      }`}
                                    >
                                      {columnValue}
                                    </div>
                                  )
                                )}
                              </>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="col-start-1 col-span-1 row-start-1 row-span-1 px-7 py-5 ">
          {specifyingModel && (
            <>
              <h2 className="text-lg font-bold">Parent Models</h2>
              {loadingParentModels ? (
                <div className="w-full h-56 flex items-center justify-center">
                  <Oval
                    height={40}
                    width={40}
                    color="#000000"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel="oval-loading"
                    secondaryColor="rgb(249, 250, 251)"
                    strokeWidth={5}
                    strokeWidthSecondary={5}
                  />
                </div>
              ) : (
                <>
                  <ul className="pt-1 flex flex-col gap-1 flex-wrap ml-3">
                    {modelParents.map((parent) => (
                      <li className="text-sm flex gap-2 items-center">
                        <FontAwesomeIcon icon={faCube} />{" "}
                        <span>{parent}.sql</span>
                        <button
                          className="flex items-center"
                          onClick={() => {
                            const newModelParents = modelParents.filter(
                              (p) => p !== parent
                            );
                            setModelParents(newModelParents);
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-1 grid-rows-[auto_auto] gap-2 w-fit items-center">
                    <input
                      className="mt-5 rounded-md px-2 py-1 border-2 border-black text-sm "
                      type="text"
                      placeholder="search models"
                      value={modelSearchString}
                      onChange={(e) => setModelSearchString(e.target.value)}
                    />
                    {filteredModelList.length > 0 && (
                      <ul className="border-2 border-black rounded-md text-xs w-fit">
                        {filteredModelList.map((model) => (
                          <li
                            className="grid grid-cols-1 grid-rows-2 px-2 py-1 border-b-2 border-b-black hover:bg-gray-200 cursor-pointer last:border-b-0"
                            onClick={() => {
                              if (modelParents.includes(model.name)) return;
                              const newModelParents = [
                                ...modelParents,
                                model.name,
                              ];
                              setModelParents(newModelParents);
                            }}
                          >
                            <span>{model.name}.sql</span>
                            <span className=" text-gray-500">
                              {model.description.slice(0, 30)}...
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <div className="col-start-3 col-span-1 row-start-1 row-span-1 px-7 py-5">
          {specifyingModel && (
            <>
              <h2 className="text-lg font-bold">Output Columns</h2>
              {loadingModelColumns ? (
                <div className="w-full h-56 flex items-center justify-center">
                  <Oval
                    height={40}
                    width={40}
                    color="#000000"
                    wrapperStyle={{}}
                    wrapperClass=""
                    visible={true}
                    ariaLabel="oval-loading"
                    secondaryColor="rgb(249, 250, 251)"
                    strokeWidth={5}
                    strokeWidthSecondary={5}
                  />
                </div>
              ) : (
                <>
                  <ul className="pt-1 flex flex-col gap-1 flex-wrap mr-3">
                    {Object.keys(modelColumns).map((column) => (
                      <li className="text-sm flex gap-2 items-center">
                        <input
                          className="rounded-md px-2 py-1 border-2 border-black "
                          type="text"
                          value={modelColumns[column]}
                          onChange={(e) =>
                            setModelColumns({
                              ...modelColumns,
                              [column]: e.target.value,
                            })
                          }
                        />
                        <button
                          className="flex items-center"
                          onClick={() => {
                            const newModelColumns = { ...modelColumns };
                            delete newModelColumns[column];
                            setModelColumns(newModelColumns);
                          }}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-white rounded-md border-2 border-black mt-5 flex text-sm">
                    <input
                      className="mx-2 my-1"
                      type="text"
                      placeholder="add column"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                    />
                    <button
                      className="flex items-center border-l-2 border-l-black px-2"
                      onClick={() => {
                        setModelColumns({
                          ...modelColumns,
                          [newColumnName]: newColumnName,
                        });
                        setNewColumnName("");
                      }}
                    >
                      <FontAwesomeIcon icon={faAdd} />
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="col-start-2 col-span-1 row-start-2 row-span-1">
          {specifyingModel ? (
            <>
              <div className="flex justify-center items-center mb-2">
                <div className="text-sm font-mono w-3xl justify-self-center">
                  <span className="font-bold">generating: </span> {modelName}
                </div>
              </div>
              <div className="flex justify-center items-center">
                <div
                  className={`max-w-3xl w-full grid grid-cols-[auto_max-content] rounded-md  border-2 border-black ${
                    loadingModelDescription ? "bg-gray-200" : "bg-white"
                  }`}
                >
                  <input
                    disabled={loadingModelDescription}
                    className="col-start-1 col-span-1 mx-5 my-3 bg-inherit"
                    type="text"
                    placeholder="What model would you like to generate? ex. int_payments_pivoted_by_order.sql"
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                  />
                  <button
                    disabled={loadingModelDescription}
                    className="col-start-2 col-span-1 w-fit border-l-2 border-l-black px-5"
                    onClick={() =>
                      submitModelGeneration(
                        modelName,
                        modelDescription,
                        modelParents,
                        modelColumns
                      )
                    }
                  >
                    generate
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center">
              <div
                className={`max-w-3xl w-full grid grid-cols-[auto_max-content] rounded-md  border-2 border-black ${
                  loadingModelDescription ? "bg-gray-200" : "bg-white"
                }`}
              >
                <input
                  disabled={loadingModelDescription}
                  className="col-start-1 col-span-1 mx-5 my-3 bg-inherit"
                  type="text"
                  placeholder="What model would you like to generate? ex. int_payments_pivoted_by_order.sql"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
                <button
                  disabled={loadingModelDescription}
                  className="col-start-2 col-span-1 w-fit border-l-2 border-l-black px-5"
                  onClick={() => submitModelName(modelName)}
                >
                  submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
