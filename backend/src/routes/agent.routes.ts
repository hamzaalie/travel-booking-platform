import { Router } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authorize } from '../middleware/authorization.middleware';
import { bookingService } from '../services/booking.service';
import { pricingService } from '../services/pricing.service';
import { prisma } from '../config/database';
import { uploadAgentDocuments, fieldToDocumentType, getAgentDocumentUrl } from '../config/upload';
import { logger } from '../config/logger';

const router = Router();

// All routes require B2B agent authentication
router.use(authenticate);
router.use(authorize('B2B_AGENT'));

// GET /api/agent/bookings
router.get(
  '/bookings',
  asyncHandler(async (req: AuthRequest, res) => {
    const bookings = await bookingService.getAgentBookings(req.user!.agentId!, {
      status: req.query.status as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });

    res.json({
      success: true,
      data: bookings,
    });
  })
);

// GET /api/agent/markups
router.get(
  '/markups',
  asyncHandler(async (req: AuthRequest, res) => {
    const markups = await pricingService.getMarkups({
      agentId: req.user!.agentId,
      isActive: true,
    });

    res.json({
      success: true,
      data: markups,
    });
  })
);

// POST /api/agent/markups
router.post(
  '/markups',
  asyncHandler(async (req: AuthRequest, res) => {
    const markup = await pricingService.createMarkup({
      ...req.body,
      agentId: req.user!.agentId,
      isGlobal: false,
    });

    res.status(201).json({
      success: true,
      message: 'Markup created successfully',
      data: markup,
    });
  })
);

// ============================================================================
// AGENT PROFILE & DOCUMENTS
// ============================================================================

// GET /api/agent/profile - Get agent profile with documents
router.get(
  '/profile',
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    res.json({
      success: true,
      data: agent,
    });
  })
);

// GET /api/agent/documents - Get my documents
router.get(
  '/documents',
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
    });

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const documents = await prisma.agentDocument.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: documents,
    });
  })
);

// POST /api/agent/documents - Upload new document(s)
router.post(
  '/documents',
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
    { name: 'tourismCertificate', maxCount: 1 },
    { name: 'otherDocuments', maxCount: 5 },
  ]),
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
    });

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadedDocs: any[] = [];

    for (const [fieldName, fileArray] of Object.entries(files)) {
      for (const file of fileArray) {
        const documentType = fieldToDocumentType[fieldName] || 'OTHER';
        const documentUrl = getAgentDocumentUrl(req, file.filename);

        const doc = await prisma.agentDocument.create({
          data: {
            agentId: agent.id,
            documentType: documentType as any,
            documentName: req.body[`${fieldName}Name`] || file.originalname,
            documentUrl,
            documentNumber: req.body[`${fieldName}Number`] || null,
          },
        });

        uploadedDocs.push(doc);
      }
    }

    logger.info(`Agent ${agent.id} uploaded ${uploadedDocs.length} document(s)`);

    res.status(201).json({
      success: true,
      message: `${uploadedDocs.length} document(s) uploaded successfully`,
      data: uploadedDocs,
    });
  })
);

// DELETE /api/agent/documents/:id - Delete own document (only if PENDING or REJECTED)
router.delete(
  '/documents/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const agent = await prisma.agent.findUnique({
      where: { userId: req.user!.id },
    });

    if (!agent) {
      res.status(404).json({ success: false, error: 'Agent not found' });
      return;
    }

    const document = await prisma.agentDocument.findFirst({
      where: {
        id: req.params.id,
        agentId: agent.id,
      },
    });

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (document.verificationStatus === 'VERIFIED') {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a verified document. Please contact admin.',
      });
      return;
    }

    await prisma.agentDocument.delete({
      where: { id: document.id },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  })
);

export default router;
