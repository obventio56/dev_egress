"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import Video from "next/video";
import { ThreeDots } from "react-loader-spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd, faCube, faXmark } from "@fortawesome/free-solid-svg-icons";

export default function Home({ models }) {
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <div className="grid grid-cols-[max-content_auto_max-content] grid-rows-[auto_100px]">
      <div className="col-start-1 col-span-1 row-start-1 row-span-1 px-7 py-5">
        <h2 className="text-lg font-bold">Parent Models</h2>
        <ul className="pt-1 flex flex-col gap-1 flex-wrap ml-3">
          <li className="text-sm flex gap-2 items-center">
            <FontAwesomeIcon icon={faCube} /> <span>stg_model_1.sql</span>
            <button className="flex items-center">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </li>
          <li className="text-sm flex gap-2 items-center">
            <FontAwesomeIcon icon={faCube} /> <span>stg_model_2.sql</span>
            <button className="flex items-center">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </li>
        </ul>
        <input
          className="mt-5 rounded-md px-2 py-1 border-2 border-black text-sm "
          type="text"
          placeholder="search models"
        />
      </div>
      <div className="col-start-3 col-span-1 row-start-1 row-span-1 px-7 py-5">
        <h2 className="text-lg font-bold">Output Columns</h2>
        <ul className="pt-1 flex flex-col gap-1 flex-wrap mr-3">
          <li className="text-sm flex gap-2 items-center">
            <input
              className="rounded-md px-2 py-1 border-2 border-black "
              type="text"
              value="Column A"
            />
            <button className="flex items-center">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </li>
          <li className="text-sm flex gap-2 items-center">
            <input
              className="rounded-md px-2 py-1 border-2 border-black "
              type="text"
              value="Column B"
            />
            <button className="flex items-center">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </li>
          <li className="text-sm flex gap-2 items-center">
            <input
              className="rounded-md px-2 py-1 border-2 border-black "
              type="text"
              value="Column C"
            />
            <button className="flex items-center">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </li>
        </ul>
        <div className="bg-white rounded-md border-2 border-black mt-5 flex text-sm">
          <input className="mx-2 my-1" type="text" placeholder="add column" />
          <button className="flex items-center border-l-2 border-l-black px-2">
            <FontAwesomeIcon icon={faAdd} />
          </button>
        </div>
      </div>
      <div className="col-start-2 col-span-1 row-start-2 row-span-1 flex justify-center items-center">
        <div className="max-w-3xl w-full grid grid-cols-[auto_max-content] rounded-md bg-white border-2 border-black ">
          <input
            className="col-start-1 col-span-1 mx-5 my-3"
            type="text"
            placeholder="What model would you like to generate? ex. int_payments_pivoted_by_order.sql"
          />
          <button className="col-start-2 col-span-1 w-fit border-l-2 border-l-black px-5">
            submit
          </button>
        </div>
      </div>
    </div>
  );
}
