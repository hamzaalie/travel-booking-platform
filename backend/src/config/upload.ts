import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from '../middleware/error.middleware';

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads/payment-proofs');
const agentDocsDir = path.join(__dirname, '../../uploads/agent-documents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(agentDocsDir)) {
  fs.mkdirSync(agentDocsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'payment-proof-' + uniqueSuffix + ext);
  },
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images and PDFs are allowed', 400) as any);
  }
};

// Multer configuration
export const uploadPaymentProof = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// Middleware for single file upload
export const uploadSingle = uploadPaymentProof.single('paymentProof');

// Middleware for multiple files
export const uploadMultiple = uploadPaymentProof.array('files', 5);

// Helper function to delete file
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Helper function to get file URL
export const getFileUrl = (req: Request, filename: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/payment-proofs/${filename}`;
};

// ============================================================================
// Agent Documents Upload Configuration
// ============================================================================

// Storage configuration for agent documents
const agentDocStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, agentDocsDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    // Use fieldname to categorize document type
    cb(null, `agent-${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter for agent documents (images and PDFs)
const agentDocFileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are allowed', 400) as any);
  }
};

// Multer configuration for agent document uploads
export const uploadAgentDocuments = multer({
  storage: agentDocStorage,
  fileFilter: agentDocFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 15, // Max 15 files total
  },
});

// Helper function to get agent document URL
export const getAgentDocumentUrl = (req: Request, filename: string): string => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/uploads/agent-documents/${filename}`;
};

// Map field names to document types
export const fieldToDocumentType: Record<string, string> = {
  citizenshipFront: 'CITIZENSHIP_FRONT',
  citizenshipBack: 'CITIZENSHIP_BACK',
  panCard: 'PAN_CARD',
  companyRegistration: 'COMPANY_REGISTRATION',
  vatCertificate: 'VAT_CERTIFICATE',
  tourismCertificate: 'TOURISM_CERTIFICATE',
  profilePhoto: 'PROFILE_PHOTO',
  signature: 'SIGNATURE',
  passport: 'PASSPORT',
  bankStatement: 'BANK_STATEMENT',
  otherDocuments: 'OTHER',
};
