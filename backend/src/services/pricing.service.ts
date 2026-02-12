import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../config/logger';

interface PriceCalculationInput {
  baseFare: number;
  taxes: number;
  agentId?: string;
  airlineCode?: string;
  routeCode?: string;
}

export interface PriceCalculationResult {
  baseFare: number;
  taxes: number;
  globalMarkup: number;
  agentMarkup: number;
  platformMarkup: number;
  totalMarkup: number;
  subtotal: number;
  totalPrice: number;
  commission: number;
  appliedMarkups: any[];
}

/**
 * Pricing & Markup Engine
 * Calculates final pricing with multi-layer markup logic
 */
export class PricingService {
  /**
   * Calculate final price with all applicable markups
   */
  async calculatePrice(input: PriceCalculationInput): Promise<PriceCalculationResult> {
    const subtotal = input.baseFare + input.taxes;
    let globalMarkup = 0;
    let agentMarkup = 0;
    const appliedMarkups: any[] = [];

    try {
      // Get global markups
      const globalMarkups = await prisma.markup.findMany({
        where: {
          isGlobal: true,
          isActive: true,
        },
      });

      // Apply global markups
      for (const markup of globalMarkups) {
        const markupAmount = this.calculateMarkupAmount(subtotal, markup.type, markup.value);
        globalMarkup += markupAmount;

        appliedMarkups.push({
          id: markup.id,
          name: markup.name,
          type: markup.type,
          value: markup.value.toNumber(),
          amount: markupAmount,
          isGlobal: true,
        });
      }

      // Get agent-specific markups if agent ID provided
      if (input.agentId) {
        // First check agent's direct markup/discount settings
        const agent = await prisma.agent.findUnique({
          where: { id: input.agentId },
          select: {
            markupType: true,
            markupValue: true,
            discountType: true,
            discountValue: true,
            commissionType: true,
            commissionValue: true,
          },
        });

        // Apply agent's assigned markup from admin
        if (agent?.markupType && agent?.markupValue) {
          const agentAssignedMarkup = this.calculateMarkupAmount(
            subtotal,
            agent.markupType as 'FIXED' | 'PERCENTAGE',
            agent.markupValue
          );
          agentMarkup += agentAssignedMarkup;

          appliedMarkups.push({
            id: 'agent-assigned-markup',
            name: 'Agent Assigned Markup',
            type: agent.markupType,
            value: Number(agent.markupValue),
            amount: agentAssignedMarkup,
            isGlobal: false,
            isAgentAssigned: true,
            agentId: input.agentId,
          });
        }

        // Apply agent's assigned discount from admin (subtract from total)
        let agentDiscount = 0;
        if (agent?.discountType && agent?.discountValue) {
          agentDiscount = this.calculateMarkupAmount(
            subtotal,
            agent.discountType as 'FIXED' | 'PERCENTAGE',
            agent.discountValue
          );

          appliedMarkups.push({
            id: 'agent-assigned-discount',
            name: 'Agent Assigned Discount',
            type: agent.discountType,
            value: Number(agent.discountValue),
            amount: -agentDiscount, // Negative because it's a discount
            isGlobal: false,
            isAgentAssigned: true,
            isDiscount: true,
            agentId: input.agentId,
          });
        }

        // Get agent-specific markups from Markup table
        const agentMarkups = await prisma.markup.findMany({
          where: {
            agentId: input.agentId,
            isActive: true,
          },
        });

        // Apply agent-specific markups
        for (const markup of agentMarkups) {
          // Check if markup is route-specific or airline-specific
          let shouldApply = true;

          if (markup.airlineCode && markup.airlineCode !== input.airlineCode) {
            shouldApply = false;
          }

          if (markup.routeCode && markup.routeCode !== input.routeCode) {
            shouldApply = false;
          }

          if (shouldApply) {
            const markupAmount = this.calculateMarkupAmount(
              subtotal,
              markup.type,
              markup.value
            );
            agentMarkup += markupAmount;

            appliedMarkups.push({
              id: markup.id,
              name: markup.name,
              type: markup.type,
              value: markup.value.toNumber(),
              amount: markupAmount,
              isGlobal: false,
              agentId: markup.agentId,
            });
          }
        }

        // Subtract agent discount from agent markup
        agentMarkup -= agentDiscount;
      }

      // Get platform markup percentage from site settings
      let platformMarkup = 0;
      try {
        const platformMarkupSetting = await prisma.siteSetting.findUnique({
          where: { key: 'platform_markup' },
        });
        if (platformMarkupSetting?.value) {
          const settings = platformMarkupSetting.value as any;
          if (settings.enabled && settings.percentage > 0) {
            platformMarkup = (subtotal * settings.percentage) / 100;
            appliedMarkups.push({
              id: 'platform-markup',
              name: 'Platform Markup',
              type: 'PERCENTAGE',
              value: settings.percentage,
              amount: platformMarkup,
              isGlobal: true,
              isPlatform: true,
            });
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch platform markup setting:', err);
      }

      const totalMarkup = globalMarkup + agentMarkup + platformMarkup;
      const totalPrice = Math.max(0, subtotal + totalMarkup); // Ensure price doesn't go negative

      // Commission calculation (agent profit from their markup)
      const commission = Math.max(0, agentMarkup);

      const result: PriceCalculationResult = {
        baseFare: input.baseFare,
        taxes: input.taxes,
        globalMarkup,
        agentMarkup,
        platformMarkup,
        totalMarkup,
        subtotal,
        totalPrice,
        commission,
        appliedMarkups,
      };

      logger.debug('Price calculated:', result);

      return result;
    } catch (error) {
      logger.error('Price calculation error:', error);
      throw new AppError('Failed to calculate price', 500);
    }
  }

  /**
   * Calculate markup amount based on type (FIXED or PERCENTAGE)
   */
  private calculateMarkupAmount(
    baseAmount: number,
    type: 'FIXED' | 'PERCENTAGE',
    value: any
  ): number {
    const valueNum = typeof value === 'number' ? value : value.toNumber();

    if (type === 'FIXED') {
      return valueNum;
    } else if (type === 'PERCENTAGE') {
      return (baseAmount * valueNum) / 100;
    }

    return 0;
  }

  /**
   * Create or update markup
   */
  async createMarkup(data: {
    name: string;
    type: 'FIXED' | 'PERCENTAGE';
    value: number;
    isGlobal: boolean;
    agentId?: string;
    airlineCode?: string;
    routeCode?: string;
  }) {
    if (data.isGlobal && data.agentId) {
      throw new AppError('Global markup cannot have agent ID', 400);
    }

    if (!data.isGlobal && !data.agentId) {
      throw new AppError('Non-global markup must have agent ID', 400);
    }

    if (data.type === 'PERCENTAGE' && (data.value < 0 || data.value > 100)) {
      throw new AppError('Percentage markup must be between 0 and 100', 400);
    }

    return await prisma.markup.create({
      data: {
        name: data.name,
        type: data.type,
        value: data.value,
        isGlobal: data.isGlobal,
        agentId: data.agentId,
        airlineCode: data.airlineCode,
        routeCode: data.routeCode,
      },
    });
  }

  /**
   * Update markup
   */
  async updateMarkup(
    id: string,
    data: {
      name?: string;
      type?: 'FIXED' | 'PERCENTAGE';
      value?: number;
      isActive?: boolean;
      airlineCode?: string;
      routeCode?: string;
    }
  ) {
    if (data.type === 'PERCENTAGE' && data.value && (data.value < 0 || data.value > 100)) {
      throw new AppError('Percentage markup must be between 0 and 100', 400);
    }

    return await prisma.markup.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete markup (soft delete by setting isActive to false)
   */
  async deleteMarkup(id: string) {
    return await prisma.markup.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get all markups
   */
  async getMarkups(filters?: {
    isGlobal?: boolean;
    agentId?: string;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filters?.isGlobal !== undefined) where.isGlobal = filters.isGlobal;
    if (filters?.agentId) where.agentId = filters.agentId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return await prisma.markup.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            agencyName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ isGlobal: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get markup by ID
   */
  async getMarkupById(id: string) {
    const markup = await prisma.markup.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            agencyName: true,
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!markup) {
      throw new AppError('Markup not found', 404);
    }

    return markup;
  }
  /**
   * Get platform markup settings
   */
  async getPlatformMarkup(): Promise<{ percentage: number; enabled: boolean }> {
    try {
      const setting = await prisma.siteSetting.findUnique({
        where: { key: 'platform_markup' },
      });
      if (setting?.value) {
        const val = setting.value as any;
        return { percentage: val.percentage || 0, enabled: val.enabled ?? true };
      }
    } catch (err) {
      logger.warn('Failed to fetch platform markup:', err);
    }
    return { percentage: 5, enabled: true }; // Default 5%
  }

  /**
   * Update platform markup settings
   */
  async updatePlatformMarkup(percentage: number, enabled: boolean, userId?: string): Promise<{ percentage: number; enabled: boolean }> {
    if (percentage < 0 || percentage > 100) {
      throw new AppError('Platform markup percentage must be between 0 and 100', 400);
    }

    await prisma.siteSetting.upsert({
      where: { key: 'platform_markup' },
      update: {
        value: { percentage, enabled },
        updatedAt: new Date(),
      },
      create: {
        key: 'platform_markup',
        value: { percentage, enabled },
        category: 'pricing',
      },
    });

    if (userId) {
      try {
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'SETTING_UPDATED',
            entity: 'SiteSetting',
            entityId: 'platform_markup',
            changes: { percentage, enabled },
          },
        });
      } catch (err) {
        logger.warn('Failed to create audit log for platform markup update:', err);
      }
    }

    return { percentage, enabled };
  }

  /**
   * Apply platform markup to a price (for B2C customers)
   * Returns the marked-up price
   */
  async applyPlatformMarkup(originalPrice: number): Promise<{ price: number; markup: number; percentage: number }> {
    const settings = await this.getPlatformMarkup();
    if (!settings.enabled || settings.percentage <= 0) {
      return { price: originalPrice, markup: 0, percentage: 0 };
    }
    const markup = (originalPrice * settings.percentage) / 100;
    return {
      price: parseFloat((originalPrice + markup).toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
      percentage: settings.percentage,
    };
  }
}

export const pricingService = new PricingService();
