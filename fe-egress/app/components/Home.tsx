"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
export default function Home({ models }) {
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const [selectedModels, setSelectedModels] = useState(
    models.models.reduce((acc, m) => ({ ...acc, [m.name]: false }), {})
  );
  const [reviewingModelName, setReviewingModelName] = useState("");
  const [modelsToReview, setModelsToReview] = useState({});
  const [destinationColumns, setDestinationColumns] = useState({ column1: "" });
  const [loading, setLoading] = useState(false);
  const [pipelineStages, setPipelineStages] = useState({});
  const [chainState, setChainState] = useState([]);
  const [generatedModels, setGeneratedModels] = useState({});
  const [currentModelName, setCurrentModelName] = useState("");
  const [modelEditor, setModelEditor] = useState("");
  useEffect(() => {
    const selectedModelsNames = Object.entries(selectedModels)
      .filter(([_, selected]) => selected)
      .map((m) => m[0]);

    const filteredModels = models.models
      .filter((m) => selectedModelsNames.includes(m.name))
      .reduce(
        (acc, m) => ({
          ...acc,
          [m.name]: {
            ...m,
            reviewed: false,
            columns: Object.fromEntries(m.columns.map((c) => [c.name, c])),
          },
        }),
        {}
      );

    setModelsToReview(filteredModels);

    if (!filteredModels || Object.values(filteredModels).length == 0) {
      setReviewingModelName("");
      return;
    }

    setReviewingModelName(
      Object.values(filteredModels).filter((m) => !m.reviewed)[0].name
    );
  }, [selectedModels]);

  const submitModels = async () => {
    setLoading(true);
    const {
      data: { steps, chain },
    } = await supabaseClient.functions.invoke("generate-pipeline-steps", {
      body: {
        models: modelsToReview,
        destinationColumns: Object.values(destinationColumns),
      },
    });
    setPipelineStages(
      Object.fromEntries(
        steps.map((s) => [s.name, { ...s, originalName: s.name }])
      )
    );
    setChainState(chain);
    setLoading(false);

    return;
  };

  const submitStages = async () => {
    setLoading(true);
    const remainingStages = Object.values(pipelineStages)
      .map((s) => s.name)
      .filter((s) => !Object.keys(generatedModels).includes(s));

    if (remainingStages.length == 0) {
      console.log("All done!");
      return;
    }

    if (currentModelName !== "") {
      newChainState = [...chainState];
      newChainState[newChainState.length - 1].content = modelEditor;
    }

    const nextStage = remainingStages[0];

    const {
      data: { chain, stepResult: generatedModel },
    } = await supabaseClient.functions.invoke("generate-stage", {
      body: {
        chain: chainState,
        modelName: nextStage,
      },
    });
    setChainState(chain);
    setGeneratedModels({ ...generatedModels, [nextStage]: generatedModel });
    setModelEditor(generatedModel);
    setLoading(false);
  };

  // Confirm stage changes and generate _first_ stage
  const submitStageReview = async () => {
    const newChainState = [...chainState];

    // Convert stages back into the JSON array we originally specified in the prompt
    const transformedPipelineStages = Object.values(pipelineStages).map((s) => {
      const transformedStage = { ...s };
      delete transformedStage.originalName;
      return transformedStage;
    });

    // Update chain context with edited stages and descriptions
    newChainState[newChainState.length - 1].content = JSON.stringify(
      transformedPipelineStages
    );
    setChainState(newChainState);
    submitStages();
  };

  return (
    <div className="w-full flex">
      <div className="p-5 border-r-2 border-black">
        <h3>Select source models</h3>
        <ul>
          {models.models.map((m, idx) => (
            <li key={`model-${idx}`}>
              <input
                className="w-auto"
                checked={selectedModels[m.name] || false}
                onChange={(e) =>
                  setSelectedModels({
                    ...selectedModels,
                    [m.name]: e.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>{m.name}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {!!modelsToReview && !!reviewingModelName && (
              <>
                <h3>Review models</h3>
                <div>Name: {reviewingModelName}</div>
                <div>
                  Description:{" "}
                  <input
                    type="text"
                    value={modelsToReview[reviewingModelName].description}
                    onChange={(e) =>
                      setModelsToReview({
                        ...modelsToReview,
                        [reviewingModelName]: {
                          ...modelsToReview[reviewingModelName],
                          description: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>Columns: </div>
                <ul>
                  {Object.values(
                    modelsToReview[reviewingModelName].columns
                  ).map((c, idx) => (
                    <li key={`column-${idx}`}>
                      {c.name}:{" "}
                      <input
                        type="text"
                        value={c.description}
                        onChange={(e) =>
                          setModelsToReview({
                            ...modelsToReview,
                            [reviewingModelName]: {
                              ...modelsToReview[reviewingModelName],
                              columns: {
                                ...modelsToReview[reviewingModelName].columns,
                                [c.name]: {
                                  ...c,
                                  description: e.target.value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </li>
                  ))}
                </ul>
                {Object.values(modelsToReview).filter((m) => !m.reviewed)
                  .length > 0 && (
                  <button
                    className="border-2 p-2 border-black rounded-md"
                    onClick={() => {
                      setModelsToReview({
                        ...modelsToReview,
                        [reviewingModelName]: {
                          ...modelsToReview[reviewingModelName],
                          reviewed: true,
                        },
                      });
                      const remainingModels = Object.values(
                        modelsToReview
                      ).filter(
                        (m) => !m.reviewed && m.name != reviewingModelName
                      );
                      if (remainingModels.length == 0) {
                        setReviewingModelName("");
                        return;
                      }
                      setReviewingModelName(remainingModels[0].name);
                    }}
                  >
                    Next
                  </button>
                )}
              </>
            )}
            {Object.values(modelsToReview).filter((m) => !m.reviewed).length ===
              0 &&
              Object.values(modelsToReview).length > 0 &&
              Object.values(pipelineStages).length === 0 && (
                <>
                  <h4>Destination column names</h4>
                  <ul>
                    {Object.entries(destinationColumns).map(([k, v], idx) => (
                      <li key={`column-${idx}`}>
                        <input
                          type="text"
                          value={v}
                          onChange={(e) =>
                            setDestinationColumns({
                              ...destinationColumns,
                              [k]: e.target.value,
                            })
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setDestinationColumns({
                        ...destinationColumns,
                        [`column${Object.keys(destinationColumns).length + 1}`]:
                          "",
                      });
                    }}
                    className="border-2 p-2 border-black rounded-md"
                  >
                    Add Column
                  </button>
                  <button
                    onClick={submitModels}
                    className="border-2 p-2 border-black rounded-md"
                  >
                    Submit
                  </button>
                </>
              )}
            {Object.values(pipelineStages).length > 0 &&
              Object.values(generatedModels).length === 0 && (
                <>
                  <h4>Review models to create</h4>
                  <ul>
                    {Object.values(pipelineStages).map((s, idx) => (
                      <li key={`stage-${idx}`}>
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => {
                            setPipelineStages({
                              ...pipelineStages,
                              [s.originalName]: {
                                ...s,
                                name: e.target.value,
                              },
                            });
                          }}
                        />
                        :
                        <input
                          type="text"
                          value={s.description}
                          onChange={(e) => {
                            setPipelineStages({
                              ...pipelineStages,
                              [s.originalName]: {
                                ...s,
                                description: e.target.value,
                              },
                            });
                          }}
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      const stageName = `new_stage_${
                        Object.keys(pipelineStages).length + 1
                      }`;
                      setPipelineStages({
                        ...pipelineStages,
                        [stageName]: {
                          originalName: stageName,
                          name: "",
                          description: "",
                        },
                      });
                    }}
                    className="border-2 p-2 border-black rounded-md"
                  >
                    Add Stage
                  </button>
                  <button
                    className="border-2 p-2 border-black rounded-md"
                    onClick={submitStageReview}
                  >
                    Next
                  </button>
                </>
              )}
            {Object.values(generatedModels).length > 0 && (
              <>
                <textarea
                  value={modelEditor}
                  onChange={(e) => setModelEditor(e.target.value)}
                />
                <button
                  className="border-2 p-2 border-black rounded-md"
                  onClick={submitStages}
                >
                  Next
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
