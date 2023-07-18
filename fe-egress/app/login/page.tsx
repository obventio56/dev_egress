"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    "http://localhost:3000/";
  // Make sure to include `https://` when not localhost.
  url = url.includes("http") ? url : `https://${url}`;
  // Make sure to include a trailing `/`.
  url = url.charAt(url.length - 1) === "/" ? url : `${url}/`;
  return url;
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [view, setView] = useState("sign-in");
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    (async () => {
      const session = await supabase.auth.getSession();
      console.log(session);
    })();
  }, []);

  // const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: {
  //       emailRedirectTo: `${location.origin}/auth/callback`,
  //     },
  //   });
  //   setView("check-email");
  // };

  // const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   await supabase.auth.signInWithPassword({
  //     email,
  //     password,
  //   });
  //   router.push("/");
  //   router.refresh();
  // };

  async function signInWithGitHub() {

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${getURL()}auth/callback`
      }
    });
    router.push("/");
    router.refresh();
    console.log(data, error);
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 justify-center gap-2 items-center">
      <h1 className="font-bold text-xl mb-5">Sign in </h1>
      <button
        className="rounded-md border-2 border-black py-2 px-10 bg-black text-white"
        onClick={signInWithGitHub}
      >
        {" "}
        <FontAwesomeIcon icon={faGithub} /> Continue with GitHub
      </button>
    </div>
  );
}
