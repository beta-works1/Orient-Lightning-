import { SITE } from "@/lib/types";

export function AnnouncementBar() {
  return (
    <div className="bg-brand text-white text-center text-xs sm:text-sm py-2 px-3">
      {SITE.announcement}
    </div>
  );
}
