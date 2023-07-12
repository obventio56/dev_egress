import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import LogoutButton from "../components/LogoutButton";
import Home from "./components/Home";

export default async function Index() {
  const supabase = createServerComponentClient({ cookies });


  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: models } = await supabase.functions.invoke("list-tables");

  return (
    <div className="w-full grid grid-rows-[min-content_auto]">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full flex justify-between items-center p-3 text-foreground">
          <div className=" text-black font-black text-lg ml-4">Egress </div>          

          <div>
            {user ? (
              <div className="flex items-right gap-4 items-center justify-center">
                Hey, {user.email}!
                <LogoutButton />
              </div>
            ) : (
              <Link
                href="/login"
                className="py-2 px-3 my-5 border-2 border-black  rounded-md text-sm"
              >
                login
              </Link>
            )}
          </div>
        </div>
      </nav>
      <Home models={models}  />
    </div>
  );
}
