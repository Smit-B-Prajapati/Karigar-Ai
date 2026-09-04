import multer from 'multer';

const storage = multer.memoryStorage();
export const uploadSingleImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
}).single('image');

// Supported MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates image buffer using magic byte signatures
 * @param {Buffer} buffer 
 * @returns {{ valid: boolean, detectedType?: string, extension?: string, error?: string }}
 */
export function validateImageSignature(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File buffer is too small or empty' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, detectedType: 'image/jpeg', extension: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    return { valid: true, detectedType: 'image/png', extension: '.png' };
  }

  // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, detectedType: 'image/webp', extension: '.webp' };
  }

  return {
    valid: false,
    error: 'Invalid file signature. Only JPEG, PNG, and WEBP images are supported. Executable or unsafe files are strictly rejected.'
  };
}

/**
 * Saves image buffer to disk in uploads directory
 * @param {Buffer} buffer 
 * @param {string} extension 
 * @param {string} prefix 
 * @returns {Promise<{ filename: string, filePath: string, publicUrl: string, size: number }>}
 */
export async function saveImageFile(buffer, extension, prefix = 'product') {
  const uploadDir = path.resolve(process.cwd(), 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeExt = extension.startsWith('.') ? extension : `.${extension}`;
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const filename = `${prefix}-${Date.now()}-${randomSuffix}${safeExt}`;
  const filePath = path.join(uploadDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  const publicUrl = `/uploads/products/${filename}`;
  return {
    filename,
    filePath,
    publicUrl,
    size: buffer.length
  };
}

/**
 * Parses raw Base64 Data URL or raw base64 string
 * @param {string} base64Str 
 * @returns {{ buffer: Buffer, declaredMime?: string } | null}
 */
export function parseBase64Image(base64Str) {
  if (typeof base64Str !== 'string') return null;

  const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      declaredMime: matches[1].toLowerCase(),
      buffer: Buffer.from(matches[2], 'base64')
    };
  }

  // Raw base64 string without data prefix
  try {
    const buffer = Buffer.from(base64Str, 'base64');
    return { buffer };
  } catch {
    return null;
  }
}

/**
 * Process and validate image input from request body or files
 * @param {import('express').Request} req 
 * @param {string} productId 
 */
export async function processUploadedImage(req, productId) {
  let imageBuffer = null;
  let declaredType = null;
  let originalFilename = '';

  // 1. Check if sent as Base64 in JSON payload: req.body.image or req.body.imageData
  const rawImage = req.body.image || req.body.imageData || req.body.photo;
  if (rawImage) {
    const parsed = parseBase64Image(rawImage);
    if (!parsed) {
      const err = new Error('Invalid Base64 image payload format');
      err.statusCode = 400;
      throw err;
    }
    imageBuffer = parsed.buffer;
    declaredType = parsed.declaredMime;
    originalFilename = req.body.filename || req.body.name || 'image.jpg';
  } else if (req.file && req.file.buffer) {
    // 2. If multipart file buffer is present
    imageBuffer = req.file.buffer;
    declaredType = req.file.mimetype;
    originalFilename = req.file.originalname;
  } else if (req.body && Buffer.isBuffer(req.body)) {
    // 3. Raw binary body
    imageBuffer = req.body;
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    const err = new Error('No image file provided. Please upload a JPEG, PNG, or WEBP image.');
    err.statusCode = 400;
    throw err;
  }

  // Size validation (Max 5MB)
  if (imageBuffer.length > MAX_FILE_SIZE_BYTES) {
    const err = new Error(`File size (${(imageBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds the 5 MB limit.`);
    err.statusCode = 400;
    throw err;
  }

  // Extension check if originalFilename provided
  if (originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
      const err = new Error(`Unsupported file extension "${ext}". Allowed: .jpg, .jpeg, .png, .webp`);
      err.statusCode = 400;
      throw err;
    }
  }

  // Declared MIME check if present
  if (declaredType && !ALLOWED_MIME_TYPES.has(declaredType)) {
    const err = new Error(`Unsupported MIME type "${declaredType}". Allowed: image/jpeg, image/png, image/webp`);
    err.statusCode = 400;
    throw err;
  }

  // Deep inspection: Magic Bytes Signature Validation
  const sigCheck = validateImageSignature(imageBuffer);
  if (!sigCheck.valid) {
    const err = new Error(sigCheck.error || 'File content signature does not match allowed image formats.');
    err.statusCode = 400;
    throw err;
  }

  // Persist image to disk
  const saved = await saveImageFile(imageBuffer, sigCheck.extension, `prod-${productId}`);

  return {
    ...saved,
    mimeType: sigCheck.detectedType,
    originalName: originalFilename || saved.filename
  };
}
