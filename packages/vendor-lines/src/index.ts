export interface VendorLineCandidate {
  raw_description: string;
  normalized_description?: string;
  uom?: string;
  unit_price?: number;
  confidence: number;
}

export function normalizeBasicPipeLine(raw: string): VendorLineCandidate {
  const upper = raw.toUpperCase();
  const isPvc = upper.includes("PVC");
  const isDip = upper.includes("DIP");
  const eightIn = upper.includes("8") || upper.includes("8IN") || upper.includes("8 IN");

  if (isPvc && eightIn) {
    return { raw_description: raw, normalized_description: "8 inch PVC C900 DR18 pipe", uom: "LF", confidence: 0.7 };
  }

  if (isDip && eightIn) {
    return { raw_description: raw, normalized_description: "8 inch DIP P401 Class 350 pipe", uom: "LF", confidence: 0.7 };
  }

  return { raw_description: raw, confidence: 0.1 };
}
