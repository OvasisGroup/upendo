"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useState } from "react"

export function RefreshButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      className="text-white"
      onClick={async () => {
        setLoading(true)
        router.refresh()
        // allow a small delay for UX; router.refresh is sync trigger
        setTimeout(() => setLoading(false), 300)
      }}
      aria-busy={loading}
    >
      <RefreshCw className={loading ? "animate-spin" : ""} />
      Refresh
    </Button>
  )
}
