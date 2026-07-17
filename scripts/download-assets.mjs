import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const categories = [
  ["bulbs-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/2-1-1674110215694_80x.png"],
  ["downlights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/panels-1674209454797_80x.png"],
  ["panels-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/6-1674110129043_80x.png"],
  ["track-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/4-1674110129038_80x.png"],
  ["flood-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/5-1674110129040_80x.png"],
  ["spot-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/7-1674110129045_80x.png"],
  ["street-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/8-1674110129048_80x.png"],
  ["lamps-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/9-1674110129050_80x.png"],
  ["battens-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/10-1674110129056_80x.png"],
  ["highbay-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/11-1674110129059_80x.png"],
  ["fixtures-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/12-1674110129061_80x.png"],
  ["wall-lights-icon.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/1-1674110129032_80x.png"],
];

const promo = [
  ["residential-1.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/res1-1674470287461_270x.jpg"],
  ["residential-2.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/res2-1674209454813_270x.jpg"],
  ["commercial-1.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/com1-1674209454755_270x.jpg"],
  ["commercial-2.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/com2-1674209454773_270x.jpg"],
  ["industrial-1.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/ind1-1674209454782_270x.jpg"],
  ["industrial-2.jpg", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/ind2-1674209454790_270x.jpg"],
];

const clients = [
  ["client-bahria-town.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/bahria-town-1674723351102_52x.png"],
  ["client-city-govt-lahore.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/city-govt-lahore-1674723351106_52x.png"],
  ["client-cocacola.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/cocacola-1674723351108_52x.png"],
  ["client-dha-lhr.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/dha-lhr-1674723351109_52x.png"],
  ["client-hbl.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/hbl-1674723351111_52x.png"],
  ["client-hyperstar.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/hyperstar-1674723351113_52x.png"],
  ["client-jinnah-hospital.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/jinnah-hospital-1674723351115_52x.png"],
  ["client-kashf.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/kashf-1674723351121_52x.png"],
  ["client-knn.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/knn-1674723351124_52x.png"],
  ["client-lda.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/lda-1674723351126_52x.png"],
  ["client-leads-uni.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/leads-uni-1674723351127_52x.png"],
  ["client-lhr-gymkhana.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/lhr-gymkhana-1674723351129_52x.png"],
  ["client-metro.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/metro-1674723351131_52x.png"],
  ["client-mobilink.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/mobilink-1674723351135_52x.png"],
  ["client-pak-army.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/pak-army-1674723351137_52x.png"],
  ["client-pc.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/pc-1674723351139_52x.png"],
  ["client-punjab-college.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/punjab-college-1674723351141_52x.png"],
  ["client-sa-gardens.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/sa-gardens-1674723351143_52x.png"],
  ["client-saif-care.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/saif-care-1674723351145_52x.png"],
  ["client-serena.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/serena-1674723351147_52x.png"],
  ["client-sialkot-int-airport.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/sialkot-int-airport-1674723351152_52x.png"],
  ["client-ucp.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/ucp-1674723351155_52x.png"],
  ["client-umt.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/umt-1674723351158_52x.png"],
  ["client-warid.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/warid-1674723351160_52x.png"],
  ["client-wateen.png", "https://cdn.shopify.com/s/files/1/0333/6745/7925/t/24/assets/wateen-1674723351162_52x.png"],
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log("ok", path.relative(root, dest), buf.length);
}

async function run(dir, list) {
  const out = path.join(root, "public", "images", dir);
  await mkdir(out, { recursive: true });
  for (const [name, url] of list) {
    await download(url, path.join(out, name));
  }
}

await run("categories", categories);
await run("promo", promo);
await run("clients", clients);
console.log("done");
