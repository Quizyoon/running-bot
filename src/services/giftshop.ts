export interface GiftProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
}

const MAX_PRODUCTS = 10;

// 인기 스타벅스 상품 (폴백, 가격순 정렬)
const STARBUCKS_PRODUCTS: GiftProduct[] = [
  { id: "322423131", name: "155元 星享飲料券", price: 145, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hIuqhcLA5FlpMEQkTymhpDR1MGit_YBJSJWkLZ2gSGwxlZQJXF3QmYA5MNGgVZypTDH8JYxkSMzUBKTp-G3c4WR5RNxwGfQJlEyklSQpSNB8RfQFpcTE/f300" },
  { id: "322423134", name: "175元 星享飲料券", price: 160, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hAR1T291HHn0MLQE0iuRhKlxwEgw_XBp1ZVUDQCguPzRRHyZwQxMuGG8tEwZBQQtgMAsDbkFxFTghRyJ0VEMtfXcsKytzHAkoeQAtGVZyPD9KXDhOQA/f300" },
  { id: "322423902", name: "你最可愛組合", price: 175, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hvl4I8YNVKUMJMDeMMklWFFhtJTI6QS1LYEg0fi0xHxVfSBJzcBMaQ2VqJAUsRhVKSV42elwzDCxECAVnXlYHQFtxC3BiRj1zcx8ObkgzCwZUXD5wNBA/f300" },
  { id: "322460139", name: "甜在你星組合", price: 199, imageUrl: "https://lcp-prod-obs.line-scdn.net/0h1_BLQouqbnB_NXGbXYQRJy5oYgFMRGp4Fk1zTVtwZTUmTkF5Oxt0cAg2TxwMBFJ5P1txSSo2Sx8yDUJUKFNAcy11YhwmTXlAOBhxXSV-WwsiWXlDQhU/f300" },
  { id: "322460146", name: "為你星動組合", price: 219, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hO5aIQOMYEBpcMA_xYIJvTQ1tHGtvQRQSNUgNJ3h1G3UaWD8THw0hGjh0G3UOASwTHF4PIwkzNXURCDw-C1Y-GQ5wHHYFATxPaFcjCR5rJWEBXAcpYRA/f300" },
  { id: "322451049", name: "經典出擊組合", price: 228, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hlxftNDCrM1dbDSxEOItMAAtQPyZofDdfMnUuan5GBQIRdCFoBCwAMwFTOAIGYSZKZysuRBZROBJ2Zw9eA2MAVz9PBmQkex8CADADRCxLERUdfBVkFw/f300" },
  { id: "322423964", name: "一路綠燈 順順利利組合", price: 240, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hpeIQdIqDL0p0KD5P6qBQHSV1IztHWStCHVAyd1BtInkuXzofERUycAgoGhMqRhNDNEYwcyErCiU5EANuI04BSSZ0ITE9XhdAIxUIZzEpGjEpRDh5SQg/f300" },
  { id: "322451048", name: "熱血入魂組合", price: 249, imageUrl: "https://lcp-prod-obs.line-scdn.net/0h3WTkhc50bHhpEnNrCLMTLzhPYAlaY2hwAGpxRU1ZTksveH5LKilzHDNbTDEzflBxKXxzQTwRSRckKkBcPnRCeztSYT4Rf1RyCDZcayxZWQM0fntLVDI/f300" },
  { id: "322423859", name: "感謝你組合", price: 250, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hSNXG0-_nDGFlPh1k775zNjZjABBWTwhpDEYRXEF7LSdATh5oPlk9cj89LDQ0RTVVMhMiYQF4LQkjDypROQQWYkF3OQ0KDxs0PhkWYTw_LScaSDBrA1A_dw/f300" },
  { id: "322423912", name: "生日快樂雙人分享組合", price: 380, imageUrl: "https://lcp-prod-obs.line-scdn.net/0hx49STVCnJxsEKjnUOfBYTFV3K2o3WyMTbVI6JiAoK3BwUTM7OBAWCFpyLF1NGxsSREQ4IlEpAnRJEgs_U0wJGFZrBShsUh8RMUwUCEJjEmBZRjAoOQo/f300" },
];

// 캐시 (1시간)
let cache: { brandId: string; products: GiftProduct[]; fetchedAt: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000;

export async function fetchBrandProducts(brandId: string = "10000340"): Promise<GiftProduct[]> {
  // 캐시 확인
  if (cache && cache.brandId === brandId && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.products;
  }

  try {
    const products = await fetchFromPage(brandId);
    if (products.length > 0) {
      cache = { brandId, products, fetchedAt: Date.now() };
      return products;
    }
  } catch (e) {
    console.error("Gift shop fetch error:", e);
  }

  // 스타벅스 폴백
  if (brandId === "10000340") {
    return STARBUCKS_PRODUCTS;
  }
  return [];
}

async function fetchFromPage(brandId: string): Promise<GiftProduct[]> {
  const url = `https://giftshop-tw.line.me/brand/${brandId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
      "Accept": "text/html",
      "Accept-Language": "zh-TW,zh;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  return parseNuxtProducts(html);
}

function parseNuxtProducts(html: string): GiftProduct[] {
  // window.__NUXT__ 함수에서 파라미터 값과 리턴 객체 추출
  const nuxtMatch = html.match(/window\.__NUXT__=\(function\(([^)]*)\)\{return\s*([\s\S]*?)\}\(([^]*)\)\)/);
  if (!nuxtMatch) return [];

  const paramNames = nuxtMatch[1].split(",").map((s) => s.trim());
  const rawValues = splitTopLevel(nuxtMatch[3]);

  // 파라미터 이름 → 값 매핑
  const vars: Record<string, any> = {};
  for (let i = 0; i < paramNames.length && i < rawValues.length; i++) {
    vars[paramNames[i]] = parseValue(rawValues[i]);
  }

  const body = nuxtMatch[2];

  // 상품 블록 패턴: productName이 포함된 객체 블록 찾기
  const products: GiftProduct[] = [];
  const blockRegex = /\{[^{}]*productName:[a-zA-Z]+[^{}]*\}/g;
  let m;

  while ((m = blockRegex.exec(body)) !== null) {
    const block = m[0];
    const idVar = block.match(/\bid:([a-zA-Z]+)/);
    const nameVar = block.match(/productName:([a-zA-Z]+)/);
    const priceVar = block.match(/salePrice:([a-zA-Z0-9]+)/);
    const imgVar = block.match(/representativeImageUrl:([a-zA-Z]+)/);

    if (idVar && nameVar && priceVar) {
      const id = resolve(vars, idVar[1]);
      const name = resolve(vars, nameVar[1]);
      const price = resolve(vars, priceVar[1]);
      const img = imgVar ? resolve(vars, imgVar[1]) : null;

      if (id && name && price !== undefined) {
        products.push({
          id: String(id),
          name: String(name),
          price: Number(price) || 0,
          imageUrl: img ? String(img) : null,
        });
      }
    }
  }

  // 중복 제거 + 10개 제한
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  }).slice(0, MAX_PRODUCTS);
}

function resolve(vars: Record<string, any>, key: string): any {
  if (key in vars) return vars[key];
  // 숫자 리터럴
  if (/^\d+$/.test(key)) return Number(key);
  return key;
}

function parseValue(raw: string): any {
  const s = raw.trim();
  if (s === "true") return true;
  if (s === "false") return false;
  if (s === "null" || s === "void 0") return null;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  return s;
}

function splitTopLevel(str: string): string[] {
  const results: string[] = [];
  let depth = 0;
  let current = "";
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const prev = i > 0 ? str[i - 1] : "";

    if (inString) {
      current += ch;
      if (ch === stringChar && prev !== "\\") inString = false;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      current += ch;
    } else if (ch === "(" || ch === "[" || ch === "{") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      results.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) results.push(current.trim());
  return results;
}
