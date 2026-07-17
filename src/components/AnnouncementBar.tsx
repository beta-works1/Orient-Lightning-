import { SITE } from "@/lib/types";
import { whatsappGeneralUrl } from "@/lib/format";

export function AnnouncementBar() {
  return (
    <div className="bg-brand text-white text-center text-xs sm:text-sm py-2 px-3">
      <a
        href={whatsappGeneralUrl(
          "Hi Orient Lighting, I saw that online orders are currently not available. I have a query.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        {SITE.announcement}
      </a>
    </div>
  );
}
