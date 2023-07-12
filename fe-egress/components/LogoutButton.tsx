'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  // Create a Supabase client configured to use cookies
  const supabase = createClientComponentClient()

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <button
      className="py-2 px-3 my-5 border-2 border-black  rounded-md text-sm"
      onClick={signOut}
    >
      logout
    </button>
  )
}
