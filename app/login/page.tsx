import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/today");

  return (
    <div className="min-h-screen bg-[#0C2340] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-2xl font-semibold text-center mb-2">
          Ops
        </h1>
        <p className="text-white/60 text-sm text-center mb-10">
          Travel operations
        </p>

        <div className="bg-white rounded-2xl p-6">
          <p className="text-gray-800 text-sm font-medium mb-1">Sign in</p>
          <p className="text-gray-500 text-xs mb-5">
            Enter your email and we&apos;ll send you a sign-in link.
          </p>

          <form
            action={async (formData: FormData) => {
              "use server";
              await signIn("resend", {
                email: formData.get("email") as string,
                redirectTo: "/today",
              });
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#0C2340]"
            />
            <button
              type="submit"
              className="w-full bg-[#0C2340] text-white rounded-xl py-3 text-sm font-medium active:opacity-80 transition-opacity"
            >
              Send sign-in link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
