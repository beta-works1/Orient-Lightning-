import {
  listPartnerApplications,
  type PartnerApplication,
} from "@/lib/partnerApplications";

export const dynamic = "force-dynamic";

function formatReceived(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    timeZone: "Asia/Karachi",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const DETAIL_FIELDS: { key: keyof PartnerApplication; label: string }[] = [
  { key: "company_name", label: "Company" },
  { key: "contact_person_name", label: "Contact" },
  { key: "designation", label: "Designation" },
  { key: "mobile_number", label: "Mobile" },
  { key: "email_address", label: "Email" },
  { key: "city", label: "City" },
  { key: "business_type", label: "Business type" },
  { key: "years_in_business", label: "Years in business" },
  { key: "led_experience", label: "LED experience" },
  { key: "areas_served", label: "Areas served" },
  { key: "average_sales_revenue", label: "Average sales revenue" },
  { key: "why_partner", label: "Why partner" },
  { key: "additional_comments", label: "Additional comments" },
];

export default async function AdminPartnersPage() {
  let rows: PartnerApplication[] = [];
  let loadError: string | null = null;
  try {
    rows = await listPartnerApplications();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load applications.";
  }

  return (
    <div>
      <div className="rounded-2xl border border-white/30 bg-white/90 p-4 shadow-xl shadow-black/10 backdrop-blur-sm sm:p-5">
        <h1 className="text-2xl font-bold text-slate-900">Partner applications</h1>
        <p className="mt-1 text-sm text-slate-500">
          Leads from the storefront “Become Our Partner” form. Newest first.
        </p>
      </div>

      {loadError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      ) : null}

      <p className="mt-4 text-sm text-white/85">
        {rows.length} application{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-3 overflow-x-auto rounded-xl border border-white/40 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-sm">
        {rows.length === 0 && !loadError ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No partner applications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-1 px-4 py-3 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{row.company_name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {row.contact_person_name} · {row.email_address} · {row.city}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-slate-500">{formatReceived(row.created_at)}</p>
                  </summary>
                  <dl className="grid gap-3 border-t border-slate-100 bg-slate-50/80 px-4 py-4 text-sm sm:grid-cols-2">
                    {DETAIL_FIELDS.map((field) => {
                      const value = String(row[field.key] || "").trim() || "—";
                      return (
                        <div
                          key={field.key}
                          className={
                            field.key === "why_partner" ||
                            field.key === "led_experience" ||
                            field.key === "areas_served" ||
                            field.key === "additional_comments"
                              ? "sm:col-span-2"
                              : undefined
                          }
                        >
                          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {field.label}
                          </dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-slate-900">{value}</dd>
                        </div>
                      );
                    })}
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Received (PKT)
                      </dt>
                      <dd className="mt-0.5 text-slate-900">{formatReceived(row.created_at)}</dd>
                    </div>
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
