import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { validate } from '../middleware/validation.middleware';
import { authService } from '../services/auth.service';
import { uploadAgentDocuments } from '../config/upload';
import Joi from 'joi';

const router = Router();

// Validation schemas
const registerSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow('').optional(),
    role: Joi.string().valid('B2B_AGENT', 'B2C_CUSTOMER').required(),
    
    // Basic Agency Info
    agencyName: Joi.string().allow('').when('role', {
      is: 'B2B_AGENT',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    agencyLicense: Joi.string().allow('').optional(),
    address: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional(),
    
    // Personal Information
    dateOfBirth: Joi.date().optional(),
    gender: Joi.string().valid('MALE', 'FEMALE', 'OTHER').optional(),
    panNumber: Joi.string().allow('').optional(),
    
    // Contact Information
    secondaryPhone: Joi.string().allow('').optional(),
    secondaryEmail: Joi.string().email().allow('').optional(),
    emergencyContact: Joi.string().allow('').optional(),
    emergencyPhone: Joi.string().allow('').optional(),
    
    // Business Information
    businessType: Joi.string().valid('SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED', 'OTHER').optional(),
    registrationNumber: Joi.string().allow('').optional(),
    taxVatNumber: Joi.string().allow('').optional(),
    websiteUrl: Joi.string().uri().allow('').optional(),
    yearEstablished: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
    numberOfEmployees: Joi.number().integer().min(1).optional(),
    monthlyBookingVolume: Joi.string().allow('').optional(),
    
    // Bank Details
    bankName: Joi.string().allow('').optional(),
    bankBranch: Joi.string().allow('').optional(),
    bankAccountName: Joi.string().allow('').optional(),
    bankAccountNumber: Joi.string().allow('').optional(),
    
    // Document numbers (actual files uploaded separately)
    citizenshipNumber: Joi.string().allow('').optional(),
    passportNumber: Joi.string().allow('').optional(),
  }),
});

const loginSchema = Joi.object({
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, req.ip);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req.ip);

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Refresh token required',
      });
      return;
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  })
);

// POST /api/auth/register/agent - Agent registration with document upload
router.post(
  '/register/agent',
  uploadAgentDocuments.fields([
    { name: 'citizenshipFront', maxCount: 1 },
    { name: 'citizenshipBack', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'companyRegistration', maxCount: 1 },
    { name: 'vatCertificate', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'signature', maxCount: 1 },
    { name: 'passport', maxCount: 1 },
    { name: 'bankStatement', maxCount: 1 },
    { name: 'otherDocuments', maxCount: 5 },
  ]),
  asyncHandler(async (req, res) => {
    // Parse JSON fields from form data
    const registrationData = {
      ...req.body,
      dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : undefined,
      yearEstablished: req.body.yearEstablished ? parseInt(req.body.yearEstablished) : undefined,
      numberOfEmployees: req.body.numberOfEmployees ? parseInt(req.body.numberOfEmployees) : undefined,
    };

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    const result = await authService.registerAgent(registrationData, files, req.ip);

    res.status(201).json({
      success: true,
      message: 'Agent registration submitted successfully. Your application is pending review.',
      data: result,
    });
  })
);

export default router;
