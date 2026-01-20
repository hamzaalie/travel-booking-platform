import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';
import { auditService } from './audit.service';
import emailService from './email.service';
import { fieldToDocumentType } from '../config/upload';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'B2B_AGENT' | 'B2C_CUSTOMER';
  agencyName?: string;
  agencyLicense?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface AgentRegisterData extends RegisterData {
  // Personal Information
  dateOfBirth?: Date;
  gender?: string;
  panNumber?: string;
  
  // Contact Information
  secondaryPhone?: string;
  secondaryEmail?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  
  // Business Information
  businessType?: string;
  registrationNumber?: string;
  taxVatNumber?: string;
  websiteUrl?: string;
  yearEstablished?: number;
  numberOfEmployees?: number;
  monthlyBookingVolume?: string;
  
  // Bank Details
  bankName?: string;
  bankBranch?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  
  // Document numbers
  citizenshipNumber?: string;
  passportNumber?: string;
}

interface LoginResponse {
  user: any;
  agent?: any;
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async register(data: RegisterData, ipAddress?: string): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      // Create user and related entities in a transaction
      const result = await prisma.$transaction(async (tx: any) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role,
          },
        });

        let agent = null;

        // If B2B agent, create agent profile and wallet
        if (data.role === 'B2B_AGENT') {
          if (!data.agencyName) {
            throw new AppError('Agency name required for B2B agents', 400);
          }

          agent = await tx.agent.create({
            data: {
              userId: user.id,
              agencyName: data.agencyName,
              agencyLicense: data.agencyLicense,
              address: data.address,
              city: data.city,
              country: data.country,
              status: 'PENDING', // Require admin approval
            },
          });

          // Create wallet for agent
          await tx.wallet.create({
            data: {
              agentId: agent.id,
              balance: 0,
              status: 'ACTIVE',
            },
          });
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'USER_REGISTERED',
            entity: 'User',
            entityId: user.id,
            changes: {
              email: data.email,
              role: data.role,
            },
            ipAddress,
          },
        });

        return { user, agent };
      });

      logger.info(`User registered: ${result.user.email} (${result.user.role})`);

      // For B2B agents pending approval, don't return tokens
      if (result.user.role === 'B2B_AGENT' && result.agent?.status === 'PENDING') {
        // Send welcome email (non-blocking)
        emailService.sendWelcomeEmail(result.user.email, result.user).catch(err =>
          logger.error('Failed to send welcome email:', err)
        );

        return {
          user: this.sanitizeUser(result.user),
          agent: result.agent,
          accessToken: '',
          refreshToken: '',
          message: 'Registration successful. Your account is pending approval.'
        } as any;
      }

      // Generate tokens for approved users
      const tokens = this.generateTokens(result.user.id, result.user.email, result.user.role);

      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(result.user.email, result.user).catch(err =>
        logger.error('Failed to send welcome email:', err)
      );

      return {
        user: this.sanitizeUser(result.user),
        agent: result.agent,
        ...tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  async login(email: string, password: string, ipAddress?: string): Promise<LoginResponse> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        agent: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if B2B agent is approved
    if (user.role === 'B2B_AGENT') {
      if (!user.agent || user.agent.status === 'PENDING') {
        throw new AppError('Your agent account is pending approval', 403);
      }
      if (user.agent.status === 'REJECTED') {
        throw new AppError(
          `Your agent account was rejected. Reason: ${user.agent.rejectionReason || 'Not specified'}`,
          403
        );
      }
      if (user.agent.status === 'SUSPENDED') {
        throw new AppError('Your agent account has been suspended', 403);
      }
    }

    // Audit log
    await auditService.log({
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
    });

    logger.info(`User logged in: ${user.email}`);

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      agent: user.agent,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        id: string;
        email: string;
        role: string;
      };

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.isActive) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Generate new access token
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
      const options = {
        expiresIn: String(config.jwt.expiresIn),
      } as any;
      const accessToken = jwt.sign(
        payload,
        String(config.jwt.secret),
        options
      );

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private generateTokens(id: string, email: string, role: string) {
    const payload = { id, email, role };
    const accessTokenOptions = {
      expiresIn: String(config.jwt.expiresIn),
    } as any;
    const refreshTokenOptions = {
      expiresIn: String(config.jwt.refreshExpiresIn),
    } as any;

    const accessToken = jwt.sign(
      payload,
      String(config.jwt.secret),
      accessTokenOptions
    );

    const refreshToken = jwt.sign(
      payload,
      String(config.jwt.refreshSecret),
      refreshTokenOptions
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Agent registration with documents
  async registerAgent(
    data: AgentRegisterData,
    files: { [fieldname: string]: Express.Multer.File[] } | undefined,
    ipAddress?: string
  ): Promise<any> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }

    // Validate required fields for agent
    if (!data.agencyName) {
      throw new AppError('Agency name is required for agent registration', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    try {
      const result = await prisma.$transaction(async (tx: any) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: 'B2B_AGENT',
          },
        });

        // Create agent profile with all extended fields
        const agent = await tx.agent.create({
          data: {
            userId: user.id,
            agencyName: data.agencyName!,
            agencyLicense: data.agencyLicense,
            address: data.address,
            city: data.city,
            country: data.country,
            status: 'PENDING',
            
            // Personal Information
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            panNumber: data.panNumber,
            
            // Contact Information
            secondaryPhone: data.secondaryPhone,
            secondaryEmail: data.secondaryEmail,
            emergencyContact: data.emergencyContact,
            emergencyPhone: data.emergencyPhone,
            
            // Business Information
            businessType: data.businessType,
            registrationNumber: data.registrationNumber,
            taxVatNumber: data.taxVatNumber,
            websiteUrl: data.websiteUrl,
            yearEstablished: data.yearEstablished,
            numberOfEmployees: data.numberOfEmployees,
            monthlyBookingVolume: data.monthlyBookingVolume,
            
            // Bank Details
            bankName: data.bankName,
            bankBranch: data.bankBranch,
            bankAccountName: data.bankAccountName,
            bankAccountNumber: data.bankAccountNumber,
          },
        });

        // Create wallet for agent
        await tx.wallet.create({
          data: {
            agentId: agent.id,
            balance: 0,
            status: 'ACTIVE',
          },
        });

        // Process and save uploaded documents
        if (files) {
          const documentPromises: Promise<any>[] = [];

          for (const [fieldName, fileArray] of Object.entries(files)) {
            for (const file of fileArray) {
              const documentType = fieldToDocumentType[fieldName] || 'OTHER';
              
              // Determine document number based on type
              let documentNumber: string | undefined;
              if (documentType === 'CITIZENSHIP_FRONT' || documentType === 'CITIZENSHIP_BACK') {
                documentNumber = data.citizenshipNumber;
              } else if (documentType === 'PASSPORT') {
                documentNumber = data.passportNumber;
              } else if (documentType === 'PAN_CARD') {
                documentNumber = data.panNumber;
              }

              documentPromises.push(
                tx.agentDocument.create({
                  data: {
                    agentId: agent.id,
                    documentType: documentType,
                    documentName: file.originalname,
                    documentUrl: `/uploads/agent-documents/${file.filename}`,
                    documentNumber: documentNumber,
                    verificationStatus: 'PENDING',
                  },
                })
              );
            }
          }

          await Promise.all(documentPromises);
        }

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'AGENT_REGISTERED',
            entity: 'Agent',
            entityId: agent.id,
            changes: {
              email: data.email,
              agencyName: data.agencyName,
              documentsUploaded: files ? Object.keys(files).length : 0,
            },
            ipAddress,
          },
        });

        return { user, agent };
      });

      logger.info(`Agent registered: ${result.user.email} - ${result.agent.agencyName}`);

      // Send welcome email (non-blocking)
      emailService.sendWelcomeEmail(result.user.email, result.user).catch(err =>
        logger.error('Failed to send welcome email:', err)
      );

      return {
        user: this.sanitizeUser(result.user),
        agent: result.agent,
        message: 'Agent registration submitted successfully. Your application is pending review.',
      };
    } catch (error) {
      logger.error('Agent registration error:', error);
      throw new AppError('Agent registration failed', 500);
    }
  }
}

export const authService = new AuthService();
