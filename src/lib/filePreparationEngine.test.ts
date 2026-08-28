import { describe, it, expect } from "vitest";
import { verifyFileSignature, validatePdfFile } from "./filePreparationEngine";

describe("File Preparation Engine Unit Tests", () => {
  it("rejects empty files", async () => {
    const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
    const res = await verifyFileSignature(emptyFile);
    expect(res.isValid).toBe(false);
    expect(res.error).toBe("File is empty.");
  });

  it("verifies PDF header magic bytes (%PDF)", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    const pdfFile = new File([pdfBytes], "document.pdf", { type: "application/pdf" });
    
    const sig = await verifyFileSignature(pdfFile);
    expect(sig.isValid).toBe(true);
    expect(sig.mimeType).toBe("application/pdf");

    const val = await validatePdfFile(pdfFile, { max_size_kb: 500 });
    expect(val.isValid).toBe(true);
    expect(val.checklist.formatValid).toBe(true);
    expect(val.checklist.sizeValid).toBe(true);
  });

  it("fails PDF validation if file exceeds size limit", async () => {
    const largePdfBytes = new Uint8Array(100 * 1024); // 100 KB
    largePdfBytes.set([0x25, 0x50, 0x44, 0x46], 0);
    const pdfFile = new File([largePdfBytes], "large.pdf", { type: "application/pdf" });

    const val = await validatePdfFile(pdfFile, { max_size_kb: 50 });
    expect(val.isValid).toBe(false);
    expect(val.checklist.sizeValid).toBe(false);
  });
});
