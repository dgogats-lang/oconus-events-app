import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TabBar from "@/components/TabBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-surface-page">
      <main className="tab-content">{children}</main>
      <TabBar />
    </div>
  );
}
