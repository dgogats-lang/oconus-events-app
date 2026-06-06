import { redirect } from "next/navigation";

// Root → redirect to today (middleware handles auth)
export default function RootPage() {
  redirect("/today");
}
