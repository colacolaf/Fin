import { redirect } from "next/navigation"

export const metadata = { title: "Memory — Finance OS" }

export default function MemoryPage() {
  redirect("/memory-graph")
}
