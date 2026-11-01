import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-6">
      <div className="space-y-2 max-w-md">
        <h1 className="text-3xl font-extrabold tracking-tight">
          School Management System
        </h1>
        <p className="text-sm text-gray-500">
          Supabase connection:{" "}
          <span className={error ? "text-red-500 font-semibold" : "text-emerald-600 font-semibold"}>
            {error ? "Not ready" : "Connected"}
          </span>
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow hover:opacity-90 transition-all inline-flex items-center gap-2"
        >
          <span>Go to Login</span>
          <span>→</span>
        </Link>
      </div>
    </main>
  );
}