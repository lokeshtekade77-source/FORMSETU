// Client-Side Canvas File Preparation & Magic Byte Engine for FormSetu
import { DocumentRequirementOut } from './api';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  mimeType: string;
}

export interface PreparedFileResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  processedSize: number;
  originalWidth?: number;
  originalHeight?: number;
  processedWidth?: number;
  processedHeight?: number;
  originalFormat: string;
  processedFormat: string;
  reductionPercentage: number;
  checklist: {
    formatValid: boolean;
    dimensionsValid: boolean;
    sizeValid: boolean;
    aspectRatioValid: boolean;
  };
  warning?: string;
}

export async function verifyFileSignature(file: File): Promise<FileValidationResult> {
  const mimeType = file.type;
  const size = file.size;

  if (size === 0) {
    return { isValid: false, error: 'File is empty.', mimeType };
  }

  const buffer = await file.slice(0, 4).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let hex = '';
  bytes.forEach((b) => {
    hex += b.toString(16).toUpperCase().padStart(2, '0');
  });

  if (hex.startsWith('FFD8FF')) {
    return { isValid: true, mimeType: 'image/jpeg' };
  } else if (hex.startsWith('89504E47')) {
    return { isValid: true, mimeType: 'image/png' };
  } else if (hex.startsWith('25504446')) {
    return { isValid: true, mimeType: 'application/pdf' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg' || mimeType === 'image/jpeg') {
    return { isValid: true, mimeType: 'image/jpeg' };
  } else if (ext === 'png' || mimeType === 'image/png') {
    return { isValid: true, mimeType: 'image/png' };
  } else if (ext === 'pdf' || mimeType === 'application/pdf') {
    return { isValid: true, mimeType: 'application/pdf' };
  }

  return { 
    isValid: false, 
    error: 'Unsupported file signature. Please upload a valid JPG, PNG, or PDF file.', 
    mimeType 
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

export async function prepareImage(
  file: File,
  requirement: Partial<DocumentRequirementOut> & { max_size_kb: number },
  onProgress?: (message: string) => void
): Promise<PreparedFileResult> {
  const logProgress = (msg: string) => {
    if (onProgress) onProgress(msg);
  };

  logProgress('Reading image locally...');
  const objectUrl = URL.createObjectURL(file);
  const img = await loadImage(objectUrl);
  URL.revokeObjectURL(objectUrl);

  const originalWidth = img.width;
  const originalHeight = img.height;
  const maxSizeBytes = requirement.max_size_kb * 1024;
  
  const allowedFormat = requirement.allowed_formats && requirement.allowed_formats.length > 0 
    ? requirement.allowed_formats[0].toUpperCase() 
    : 'JPEG';
  const mimeTarget = allowedFormat === 'PNG' ? 'image/png' : 'image/jpeg';

  logProgress('Analyzing dimensions and aspect ratio...');
  
  let targetRatioNum = 0;
  if (requirement.required_width && requirement.required_height) {
    targetRatioNum = requirement.required_width / requirement.required_height;
  }

  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = originalWidth;
  let sourceHeight = originalHeight;

  if (targetRatioNum > 0) {
    const currentRatio = originalWidth / originalHeight;
    if (currentRatio > targetRatioNum) {
      sourceWidth = originalHeight * targetRatioNum;
      sourceX = (originalWidth - sourceWidth) / 2;
    } else if (currentRatio < targetRatioNum) {
      sourceHeight = originalWidth / targetRatioNum;
      sourceY = (originalHeight - sourceHeight) / 2;
    }
  }

  let finalWidth = requirement.required_width || Math.round(sourceWidth);
  let finalHeight = requirement.required_height || Math.round(sourceHeight);

  if (!requirement.required_width && !requirement.required_height) {
    const MAX_DIM = 1200;
    if (sourceWidth > MAX_DIM || sourceHeight > MAX_DIM) {
      const scale = Math.min(MAX_DIM / sourceWidth, MAX_DIM / sourceHeight);
      finalWidth = Math.round(sourceWidth * scale);
      finalHeight = Math.round(sourceHeight * scale);
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context could not be created.');

  canvas.width = finalWidth;
  canvas.height = finalHeight;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, finalWidth, finalHeight);

  logProgress('Compressing image iteratively to satisfy portal rules...');
  
  let quality = 0.95;
  let scaleFactor = 1.0;
  let blob: Blob | null = null;
  let iteration = 0;
  let isUnusuallyRestrictive = false;
  let warningMessage = '';

  while (iteration < 12) {
    iteration++;
    const currentWidth = Math.round(finalWidth * scaleFactor);
    const currentHeight = Math.round(finalHeight * scaleFactor);

    canvas.width = currentWidth;
    canvas.height = currentHeight;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, currentWidth, currentHeight);

    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), mimeTarget, quality);
    });

    if (!blob) break;

    logProgress(`Compression iteration ${iteration}: ${(blob.size / 1024).toFixed(1)} KB (quality: ${quality.toFixed(2)}, ${currentWidth}x${currentHeight})`);

    if (blob.size <= maxSizeBytes) {
      break;
    }

    if (quality > 0.4) {
      quality -= 0.15;
    } else if (quality > 0.15) {
      quality -= 0.08;
    } else {
      scaleFactor *= 0.85;
      quality = 0.7;
    }

    if (scaleFactor < 0.25 || (currentWidth < 120 || currentHeight < 120)) {
      isUnusuallyRestrictive = true;
      warningMessage = 'This size limit is unusually restrictive. Prepared smallest readable output.';
      break;
    }
  }

  if (!blob) {
    throw new Error('Failed to encode compressed image.');
  }

  const fileExt = allowedFormat.toLowerCase() === 'png' ? 'png' : 'jpg';
  const processedFileName = `prepared_${file.name.split('.')[0]}_${canvas.width}x${canvas.height}.${fileExt}`;
  const finalFile = new File([blob], processedFileName, { type: mimeTarget });
  const finalDataUrl = canvas.toDataURL(mimeTarget, quality);

  return {
    file: finalFile,
    dataUrl: finalDataUrl,
    originalSize: file.size,
    processedSize: finalFile.size,
    originalWidth,
    originalHeight,
    processedWidth: canvas.width,
    processedHeight: canvas.height,
    originalFormat: file.type.split('/')[1]?.toUpperCase() || 'UNKNOWN',
    processedFormat: allowedFormat,
    reductionPercentage: Math.max(0, ((file.size - finalFile.size) / file.size) * 100),
    warning: isUnusuallyRestrictive ? warningMessage : undefined,
    checklist: {
      formatValid: true,
      dimensionsValid: requirement.required_width && requirement.required_height 
        ? (canvas.width === requirement.required_width && canvas.height === requirement.required_height) 
        : true,
      sizeValid: finalFile.size <= maxSizeBytes,
      aspectRatioValid: targetRatioNum > 0
        ? Math.abs((canvas.width / canvas.height) - targetRatioNum) < 0.02
        : true
    }
  };
}

export interface PreparedPdfResult {
  file: File;
  pdfUrl: string;
  originalSize: number;
  maxSize: number;
  isValid: boolean;
  checklist: { formatValid: boolean; sizeValid: boolean };
  error?: string;
  warning?: string;
}

export async function validatePdfFile(
  file: File,
  requirement: { max_size_kb: number }
): Promise<PreparedPdfResult> {
  const maxSizeBytes = requirement.max_size_kb * 1024;
  const isSizeValid = file.size <= maxSizeBytes;
  const signatureCheck = await verifyFileSignature(file);

  const isPdf = signatureCheck.mimeType === 'application/pdf';
  const pdfUrl = URL.createObjectURL(file);

  return {
    file,
    pdfUrl,
    isValid: isPdf && isSizeValid,
    originalSize: file.size,
    maxSize: maxSizeBytes,
    checklist: {
      formatValid: isPdf,
      sizeValid: isSizeValid
    },
    error: !isPdf 
      ? 'The uploaded file is not a valid PDF document header signature.' 
      : !isSizeValid 
        ? `File size is ${(file.size / 1024).toFixed(1)} KB (target limit: ${(requirement.max_size_kb).toFixed(0)} KB).`
        : undefined,
    warning: isPdf && !isSizeValid
      ? `Uploaded PDF (${(file.size / 1024).toFixed(1)} KB) exceeds the preset limit of ${requirement.max_size_kb} KB. You can preview the PDF below.`
      : undefined
  };
}

