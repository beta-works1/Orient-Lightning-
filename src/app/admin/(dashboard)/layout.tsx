export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Nav lives in AdminShell so it always ships with the client bundle.
  return <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>;
}
