import { createServiceClient } from "@/lib/supabase/admin";

export type PartnerApplication = {
  id: string;
  company_name: string;
  contact_person_name: string;
  designation: string;
  mobile_number: string;
  email_address: string;
  city: string;
  business_type: string;
  years_in_business: string;
  led_experience: string;
  areas_served: string;
  average_sales_revenue: string;
  why_partner: string;
  additional_comments: string;
  created_at: string;
};

/** Admin inbox — service role (middleware already gates /admin). */
export async function listPartnerApplications(): Promise<PartnerApplication[]> {
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("partner_applications")
    .select(
      "id, company_name, contact_person_name, designation, mobile_number, email_address, city, business_type, years_in_business, led_experience, areas_served, average_sales_revenue, why_partner, additional_comments, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as PartnerApplication[];
}
