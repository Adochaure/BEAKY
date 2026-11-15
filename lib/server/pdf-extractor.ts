import zlib from "node:zlib";

/**
 * Robust pure Node.js text extractor for PDF documents.
 * Extracts text from PDF streams (handling /FlateDecode decompression,
 * text blocks BT...ET, strings (text) Tj, [(text)] TJ, and hex <hex> Tj).
 */
export function extractTextFromPdf(pdfBuffer: Buffer): string {
  const textPieces: string[] = [];
  const bufferString = pdfBuffer.toString("latin1");

  // Regex to capture all stream ... endstream blocks
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(bufferString)) !== null) {
    let streamData = Buffer.from(match[1], "latin1");

    // Check if the stream before it specifies /FlateDecode or /Fl
    const streamStart = match.index;
    const headerSlice = bufferString.slice(Math.max(0, streamStart - 400), streamStart);

    if (headerSlice.includes("/FlateDecode") || headerSlice.includes("/Fl")) {
      try {
        streamData = zlib.inflateSync(streamData);
      } catch {
        try {
          streamData = zlib.inflateRawSync(streamData);
        } catch {
          // Keep raw stream data if uncompressed or partially corrupted
        }
      }
    }

    const content = streamData.toString("latin1");

    // Match text blocks: BT ... ET
    const btRegex = /BT\s+([\s\S]*?)\s+ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(content)) !== null) {
      const block = btMatch[1];

      // 1. Literal strings: (text) Tj or ' or "
      const tjRegex = /\(((?:\\\(|\\\)|[^()])*)\)\s*(?:Tj|'|")/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const clean = cleanPdfString(tjMatch[1]);
        if (clean) textPieces.push(clean);
      }

      // 2. Text arrays: [(t) 10 (e) 20 (x) (t)] TJ
      const arrayRegex = /\[((?:[^[\]]|\\[[\]])*)\]\s*TJ/g;
      let arrayMatch: RegExpExecArray | null;
      while ((arrayMatch = arrayRegex.exec(block)) !== null) {
        const arrayContent = arrayMatch[1];
        const innerStrings = /\(((?:\\\(|\\\)|[^()])*)\)/g;
        let strMatch: RegExpExecArray | null;
        let line = "";
        while ((strMatch = innerStrings.exec(arrayContent)) !== null) {
          line += cleanPdfString(strMatch[1]);
        }
        if (line.trim()) textPieces.push(line.trim());

        // Hex strings inside array: <00480065006c006c006f>
        const innerHex = /<([0-9a-fA-F]+)>/g;
        let hexMatch: RegExpExecArray | null;
        while ((hexMatch = innerHex.exec(arrayContent)) !== null) {
          const decoded = decodeHexPdf(hexMatch[1]);
          if (decoded.trim()) textPieces.push(decoded.trim());
        }
      }

      // 3. Standalone hex string: <48656c6c6f> Tj
      const hexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
      let standaloneHex: RegExpExecArray | null;
      while ((standaloneHex = hexTjRegex.exec(block)) !== null) {
        const decoded = decodeHexPdf(standaloneHex[1]);
        if (decoded.trim()) textPieces.push(decoded.trim());
      }
    }
  }

  // Fallback: If no text was found in streams, try finding literal strings across the document
  if (textPieces.length === 0) {
    const directRegex = /\(((?:\\\(|\\\)|[^\r\n()]{3,}))\)\s*Tj/g;
    let directMatch: RegExpExecArray | null;
    while ((directMatch = directRegex.exec(bufferString)) !== null) {
      const clean = cleanPdfString(directMatch[1]);
      if (clean) textPieces.push(clean);
    }
  }

  return textPieces.join(" ").replace(/\s+/g, " ").trim();
}

function cleanPdfString(str: string): string {
  return str
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\r/g, " ")
    .replace(/\\n/g, " ")
    .replace(/\\t/g, " ")
    .replace(/\\b/g, "")
    .replace(/\\f/g, "")
    .trim();
}

function decodeHexPdf(hex: string): string {
  let result = "";
  // Check if UTF-16BE (even length with null bytes e.g. 0048 0065)
  if (hex.length >= 4 && hex.length % 4 === 0 && hex.startsWith("00")) {
    for (let i = 0; i < hex.length; i += 4) {
      const code = Number.parseInt(hex.slice(i, i + 4), 16);
      if (code >= 32 && code <= 126) {
        result += String.fromCharCode(code);
      }
    }
    return result;
  }
  // Standard ASCII hex
  for (let i = 0; i < hex.length; i += 2) {
    const code = Number.parseInt(hex.slice(i, i + 2), 16);
    if (code >= 32 && code <= 126) {
      result += String.fromCharCode(code);
    }
  }
  return result;
}
