"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Video from "next/video";
import { ThreeDots } from "react-loader-spinner";

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
  const [nextStageName, setNextStageName] = useState("");
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
      setModelEditor("done");
      setLoading(false);
      return;
    }

    if (currentModelName !== "") {
      newChainState = [...chainState];
      newChainState[newChainState.length - 1].content = modelEditor;
    }

    const nextStage = remainingStages[0];
    setNextStageName(nextStage);

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
    <div className="grid grid-cols-[max-content_auto]">
      <div className="px-10 py-5 border-r border-r-foreground/10 flex flex-col items-center">
        <h3 className="text-lg font-bold mb-2">Data sources</h3>
        <Image
          className="my-2"
          src="/dbt_logo.svg"
          width={80}
          height={100}
          alt="DBT Logo"
        />
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
              <span className="pl-2">{m.name}</span>
            </li>
          ))}
        </ul>
        <Image
          className="mt-10"
          src="/snowflake_logo.png"
          width={120}
          height={100}
          alt="DBT Logo"
        />
        <button className="py-2 px-3 my-5 border-2 border-black  rounded-md font-black text-sm ">
          Link Snowflake
        </button>
      </div>
      <div>
        {loading ? (
          <div className="col-span-2 flex w-full h-full items-center justify-center bg-black/20">
            <ThreeDots
              height="80"
              width="80"
              radius="9"
              color="black"
              ariaLabel="three-dots-loading"
              wrapperStyle={{}}
              wrapperClassName=""
              visible={true}
            />
          </div>
        ) : (
          <>
            <div className="px-10 py-5 grid grid-cols-[min-content_auto] w-2/3 auto-rows-min gap-x-5">
              {!!modelsToReview && !!reviewingModelName && (
                <>
                  <h3 className="font-black text-3xl mb-3 col-span-2">
                    Confirm model documentation
                  </h3>
                  <span className="font-bold mr-1 py-1">Model name: </span>
                  <span className="self-center">{reviewingModelName}</span>
                  <span className="font-bold mr-1">Description:</span>
                  <input
                    className="border  px-1 border-black rounded "
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
                  <div className="font-bold mr-1 text-xl mt-7 col-span-2 mb-3">
                    Columns:{" "}
                  </div>
                  {Object.values(
                    modelsToReview[reviewingModelName].columns
                  ).map((c, idx) => (
                    <>
                      <span
                        key={`column-span-${idx}`}
                        className="font-bold mr-1 my-1"
                      >
                        {c.name}:
                      </span>
                      <input
                        key={`column-input-${idx}`}
                        className="border px-1 border-black rounded self-center"
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
                    </>
                  ))}
                  {Object.values(modelsToReview).filter((m) => !m.reviewed)
                    .length > 0 && (
                    <button
                      className="py-2 px-3 my-5 border-2 border-black  rounded-md font-black text-sm "
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
              {Object.values(modelsToReview).filter((m) => !m.reviewed)
                .length === 0 &&
                Object.values(modelsToReview).length > 0 &&
                Object.values(pipelineStages).length === 0 && (
                  <>
                    <h4 className="font-black text-3xl mb-3 col-span-2">
                      Destination schema columns
                    </h4>
                    {Object.entries(destinationColumns).map(([k, v], idx) => (
                      <div key={`column-${idx}`} className="col-span-2">
                        <input
                          className="border px-1 border-black rounded self-center w-1/3 my-1"
                          placeholder={`Column ${idx + 1}`}
                          type="text"
                          value={v}
                          onChange={(e) =>
                            setDestinationColumns({
                              ...destinationColumns,
                              [k]: e.target.value,
                            })
                          }
                        />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <button
                        onClick={() => {
                          setDestinationColumns({
                            ...destinationColumns,
                            [`column${
                              Object.keys(destinationColumns).length + 1
                            }`]: "",
                          });
                        }}
                        className="py-2 px-3 my-5 border-2 bg-black text-white  rounded-md font-black text-sm "
                      >
                        Add Column
                      </button>
                      <button
                        onClick={submitModels}
                        className="py-2 px-3 my-5 border-2 border-black  rounded-md font-black text-sm ml-2"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                )}
              {Object.values(pipelineStages).length > 0 &&
                Object.values(generatedModels).length === 0 && (
                  <>
                    <h4 className="font-black text-3xl mb-3 col-span-2">
                      Review pipeline stages
                    </h4>
                    <div className="font-bold mr-1">Name</div>
                    <div className="font-bold mr-1 ">Description</div>
                    {Object.values(pipelineStages).map((s, idx) => (
                      <>
                        <input
                          type="text"
                          className="border px-1 border-black rounded self-center my-1"
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

                        <input
                          type="text"
                          className="border px-1 border-black rounded self-center w-full my-1"
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
                      </>
                    ))}
                    <div className="col-span-2">
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
                        className="py-2 px-3 my-5 border-2 bg-black text-white  rounded-md font-black text-sm "
                      >
                        Add Stage
                      </button>
                      <button
                        className="py-2 px-3 my-5 border-2 border-black  rounded-md font-black text-sm ml-2"
                        onClick={submitStageReview}
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              {Object.values(generatedModels).length > 0 &&
                modelEditor !== "done" && (
                  <>
                    <h4 className="font-black text-3xl mb-3 col-span-2">
                      {nextStageName}
                    </h4>
                    <textarea
                      className="col-span-2 h-96 p-2 border-2 border-black rounded-md"
                      value={modelEditor}
                      onChange={(e) => setModelEditor(e.target.value)}
                    />
                    <button
                      className="py-2 px-3 my-5 border-2 border-black  rounded-md font-black text-sm"
                      onClick={submitStages}
                    >
                      Next
                    </button>
                  </>
                )}
              {Object.values(generatedModels).length > 0 &&
                modelEditor === "done" && (
                  <>
                    <h4 className="font-black text-3xl mb-3 col-span-2">
                      Pipeline complete
                    </h4>
                    <button
                      className="py-2 px-3 my-5 border-2 border-black rounded-md font-black text-sm min-w-[max-content_auto]"
                      onClick={submitStages}
                    >
                      Start over
                    </button>
                  </>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
