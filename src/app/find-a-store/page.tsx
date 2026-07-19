import { redirect } from "next/navigation";

/** Alias for /stores */
export default function FindAStoreRedirect() {
  redirect("/stores");
}
