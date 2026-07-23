import { Suspense } from "react";
import AdminLoginPage from "./LoginForm";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500">Loading…</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
