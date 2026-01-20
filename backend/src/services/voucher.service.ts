import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { HotelVoucher, CarRentalVoucher, calculateNumberOfNights } from '../../../shared/src';
import { format } from 'date-fns';
import { logger } from '../config/logger';

/**
 * Voucher Generation Service
 * Generates PDF vouchers with QR codes for hotel and car rental bookings
 */

class VoucherService {
  /**
   * Generate hotel voucher PDF
   */
  async generateHotelVoucher(voucher: HotelVoucher): Promise<Buffer> {
    try {
      logger.info(`Generating hotel voucher: ${voucher.voucherId}`);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header with branding
        this.addHotelHeader(doc, voucher);

        // Voucher details
        doc.moveDown();
        doc.fontSize(20).font('Helvetica-Bold').text('HOTEL VOUCHER', { align: 'center' });
        doc.moveDown(0.5);

        // Voucher ID and QR Code side by side
        const startY = doc.y;
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Voucher ID: ${voucher.voucherId}`, 50, startY)
          .text(`Booking Reference: ${voucher.bookingReference}`, 50, startY + 15)
          .text(`Confirmation: ${voucher.confirmationNumber}`, 50, startY + 30);

        // Add QR Code on the right
        this.addQRCode(doc, voucher.qrCodeData, 450, startY);

        doc.moveDown(4);

        // Hotel Information
        this.addSection(doc, 'Hotel Information');
        doc.fontSize(14).font('Helvetica-Bold').text(voucher.hotel.name);
        doc.fontSize(10).font('Helvetica')
          .text(`${voucher.hotel.starRating} Star Hotel`)
          .text(voucher.hotel.address)
          .text(`${voucher.hotel.city}, ${voucher.hotel.country}`)
          .text(`Phone: ${voucher.hotel.phone}`)
          .text(`Email: ${voucher.hotel.email}`);

        doc.moveDown();

        // Reservation Details
        this.addSection(doc, 'Reservation Details');
        const nights = calculateNumberOfNights(
          voucher.reservation.checkInDate,
          voucher.reservation.checkOutDate
        );
        
        doc.fontSize(10).font('Helvetica')
          .text(`Check-in: ${format(voucher.reservation.checkInDate, 'EEE, dd MMM yyyy')} at ${voucher.importantInfo.checkInTime}`)
          .text(`Check-out: ${format(voucher.reservation.checkOutDate, 'EEE, dd MMM yyyy')} at ${voucher.importantInfo.checkOutTime}`)
          .text(`Number of Nights: ${nights}`)
          .text(`Room Type: ${voucher.reservation.roomType}`)
          .text(`Meal Plan: ${voucher.reservation.mealPlan}`)
          .text(`Number of Rooms: ${voucher.reservation.numberOfRooms}`)
          .text(`Guests: ${voucher.reservation.numberOfGuests.adults} Adult(s), ${voucher.reservation.numberOfGuests.children} Child(ren)`);

        doc.moveDown();

        // Guest Information
        this.addSection(doc, 'Primary Guest');
        doc.fontSize(10).font('Helvetica')
          .text(`Name: ${voucher.primaryGuest.title} ${voucher.primaryGuest.firstName} ${voucher.primaryGuest.lastName}`)
          .text(`Email: ${voucher.primaryGuest.email}`)
          .text(`Phone: ${voucher.primaryGuest.phone}`);

        doc.moveDown();

        // Special Requests
        if (voucher.specialRequests && voucher.specialRequests.length > 0) {
          this.addSection(doc, 'Special Requests');
          voucher.specialRequests.forEach((request: string) => {
            doc.fontSize(10).font('Helvetica').text(`• ${request}`);
          });
          doc.moveDown();
        }

        // Pricing
        this.addSection(doc, 'Pricing');
        doc.fontSize(10).font('Helvetica')
          .text(`Room Rate: ${voucher.pricing.currency} ${voucher.pricing.roomRate.toFixed(2)}`)
          .text(`Taxes: ${voucher.pricing.currency} ${voucher.pricing.taxes.toFixed(2)}`)
          .text(`Service Fee: ${voucher.pricing.currency} ${voucher.pricing.serviceFee.toFixed(2)}`)
          .fontSize(12).font('Helvetica-Bold')
          .text(`Total: ${voucher.pricing.currency} ${voucher.pricing.total.toFixed(2)}`)
          .fontSize(10).font('Helvetica')
          .text(`Payment Status: ${voucher.pricing.paymentStatus}`);

        doc.moveDown();

        // Cancellation Policy
        this.addSection(doc, 'Cancellation Policy');
        if (voucher.cancellationPolicy.freeCancellationUntil) {
          doc.fontSize(10).font('Helvetica')
            .fillColor('green')
            .text(`✓ Free cancellation until ${format(voucher.cancellationPolicy.freeCancellationUntil, 'EEE, dd MMM yyyy HH:mm')}`);
          doc.fillColor('black');
        }
        doc.fontSize(10).font('Helvetica')
          .text(`Refundable: ${voucher.cancellationPolicy.refundable ? 'Yes' : 'No'}`)
          .text(voucher.cancellationPolicy.terms, { width: 500 });

        doc.moveDown();

        // Important Information
        this.addSection(doc, 'Important Information');
        if (voucher.importantInfo.childPolicy) {
          doc.fontSize(10).font('Helvetica').text(`Child Policy: ${voucher.importantInfo.childPolicy}`);
        }
        if (voucher.importantInfo.petPolicy) {
          doc.fontSize(10).font('Helvetica').text(`Pet Policy: ${voucher.importantInfo.petPolicy}`);
        }
        if (voucher.importantInfo.additionalNotes) {
          voucher.importantInfo.additionalNotes.forEach((note: string) => {
            doc.fontSize(10).font('Helvetica').text(`• ${note}`);
          });
        }

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica-Oblique')
          .fillColor('gray')
          .text('This is your official hotel voucher. Please present this document (printed or digital) at check-in.', {
            align: 'center',
          })
          .text(`Generated on ${format(voucher.generatedAt, 'dd MMM yyyy HH:mm')}`, { align: 'center' })
          .text(`Valid until ${format(voucher.validUntil, 'dd MMM yyyy')}`, { align: 'center' });

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating hotel voucher:', error);
      throw new Error('Failed to generate hotel voucher');
    }
  }

  /**
   * Generate car rental voucher PDF
   */
  async generateCarRentalVoucher(voucher: CarRentalVoucher): Promise<Buffer> {
    try {
      logger.info(`Generating car rental voucher: ${voucher.voucherId}`);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addCarRentalHeader(doc, voucher);

        doc.moveDown();
        doc.fontSize(20).font('Helvetica-Bold').text('CAR RENTAL VOUCHER', { align: 'center' });
        doc.moveDown(0.5);

        // Voucher ID and QR Code
        const startY = doc.y;
        doc.fontSize(10)
          .font('Helvetica')
          .text(`Voucher ID: ${voucher.voucherId}`, 50, startY)
          .text(`Booking Reference: ${voucher.bookingReference}`, 50, startY + 15)
          .text(`Confirmation: ${voucher.confirmationNumber}`, 50, startY + 30);

        this.addQRCode(doc, voucher.qrCodeData, 450, startY);

        doc.moveDown(4);

        // Vehicle Information
        this.addSection(doc, 'Vehicle Information');
        doc.fontSize(12).font('Helvetica-Bold').text(voucher.booking.vehicle.model);
        doc.fontSize(10).font('Helvetica')
          .text(`Category: ${voucher.booking.vehicle.category}`)
          .text(`Transmission: ${voucher.booking.vehicle.transmission}`)
          .text(`Seats: ${voucher.booking.vehicle.seats} | Doors: ${voucher.booking.vehicle.doors}`)
          .text(`Fuel Type: ${voucher.booking.vehicle.fuelType}`);

        doc.moveDown();

        // Rental Details
        this.addSection(doc, 'Rental Details');
        doc.fontSize(10).font('Helvetica')
          .text(`Pickup: ${format(voucher.booking.rental.pickupDate, 'EEE, dd MMM yyyy HH:mm')}`)
          .text(`Location: ${voucher.booking.rental.pickupLocation}`)
          .text(`Dropoff: ${format(voucher.booking.rental.dropoffDate, 'EEE, dd MMM yyyy HH:mm')}`)
          .text(`Location: ${voucher.booking.rental.dropoffLocation}`)
          .text(`Duration: ${voucher.booking.rental.numberOfDays} days`);

        doc.moveDown();

        // Driver Information
        this.addSection(doc, 'Driver Information');
        doc.fontSize(10).font('Helvetica')
          .text(`Name: ${voucher.booking.driver.firstName} ${voucher.booking.driver.lastName}`)
          .text(`Age: ${voucher.booking.driver.age} years`)
          .text(`License: ${voucher.booking.driver.licenseNumber} (${voucher.booking.driver.licenseCountry})`)
          .text(`Email: ${voucher.booking.driver.email}`)
          .text(`Phone: ${voucher.booking.driver.phone}`);

        doc.moveDown();

        // Insurance Coverage
        if (voucher.booking.insurance.selectedCoverage.length > 0) {
          this.addSection(doc, 'Insurance Coverage');
          voucher.booking.insurance.selectedCoverage.forEach((ins: any) => {
            doc.fontSize(10).font('Helvetica-Bold').text(`• ${ins.name}`);
            doc.fontSize(9).font('Helvetica')
              .text(`  Excess: ${ins.coverage.excessAmount} ${ins.pricing.currency}`, { indent: 10 });
          });
          doc.moveDown();
        }

        // Add-ons
        if (voucher.booking.addOns.selectedAddOns.length > 0) {
          this.addSection(doc, 'Add-ons');
          voucher.booking.addOns.selectedAddOns.forEach((addon: any) => {
            doc.fontSize(10).font('Helvetica')
              .text(`• ${addon.name} (x${addon.quantity})`);
          });
          doc.moveDown();
        }

        // Pricing
        this.addSection(doc, 'Pricing Breakdown');
        doc.fontSize(10).font('Helvetica')
          .text(`Base Rate: ${voucher.booking.pricing.currency} ${voucher.booking.pricing.baseRate.toFixed(2)}`)
          .text(`Insurance: ${voucher.booking.pricing.currency} ${voucher.booking.pricing.insuranceTotal.toFixed(2)}`)
          .text(`Add-ons: ${voucher.booking.pricing.currency} ${voucher.booking.pricing.addOnsTotal.toFixed(2)}`)
          .text(`Taxes & Fees: ${voucher.booking.pricing.currency} ${(voucher.booking.pricing.taxes + voucher.booking.pricing.fees).toFixed(2)}`)
          .fontSize(12).font('Helvetica-Bold')
          .text(`Total: ${voucher.booking.pricing.currency} ${voucher.booking.pricing.total.toFixed(2)}`)
          .fontSize(10).font('Helvetica')
          .text(`Deposit Required: ${voucher.booking.pricing.currency} ${voucher.booking.pricing.deposit.toFixed(2)}`);

        doc.moveDown();

        // Important Information
        this.addSection(doc, 'What to Bring');
        voucher.importantInfo.whatToBring.forEach((item: string) => {
          doc.fontSize(10).font('Helvetica').text(`• ${item}`);
        });

        doc.moveDown();
        this.addSection(doc, 'Pickup Instructions');
        voucher.importantInfo.pickupInstructions.forEach((item: string) => {
          doc.fontSize(10).font('Helvetica').text(`• ${item}`);
        });

        doc.moveDown();
        this.addSection(doc, 'Emergency Contact');
        doc.fontSize(10).font('Helvetica').text(voucher.importantInfo.emergencyContact);

        // Footer
        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica-Oblique')
          .fillColor('gray')
          .text('Please present this voucher along with your driver\'s license and credit card at pickup.', {
            align: 'center',
          })
          .text(`Generated on ${format(voucher.generatedAt, 'dd MMM yyyy HH:mm')}`, { align: 'center' });

        doc.end();
      });
    } catch (error) {
      logger.error('Error generating car rental voucher:', error);
      throw new Error('Failed to generate car rental voucher');
    }
  }

  /**
   * Helper: Add section header
   */
  private addSection(doc: PDFKit.PDFDocument, title: string) {
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#1a56db')
      .text(title.toUpperCase());
    doc.moveDown(0.3);
    doc.fillColor('black');
  }

  /**
   * Helper: Add hotel header
   */
  private addHotelHeader(doc: PDFKit.PDFDocument, _voucher: HotelVoucher) {
    doc.fontSize(18)
      .font('Helvetica-Bold')
      .fillColor('#1a56db')
      .text('Travel Booking Platform', { align: 'center' });
    
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('gray')
      .text('Your Trusted Travel Partner', { align: 'center' });
    
    // Horizontal line
    doc.moveTo(50, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .strokeColor('#e5e7eb')
      .stroke();
  }

  /**
   * Helper: Add car rental header
   */
  private addCarRentalHeader(doc: PDFKit.PDFDocument, voucher: CarRentalVoucher) {
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#1a56db')
      .text(voucher.rentalCompany.name, { align: 'center' });
    
    doc.fontSize(9)
      .font('Helvetica')
      .fillColor('gray')
      .text(voucher.rentalCompany.address, { align: 'center' })
      .text(`Phone: ${voucher.rentalCompany.phone} | Email: ${voucher.rentalCompany.email}`, { align: 'center' });
    
    doc.moveTo(50, doc.y + 10)
      .lineTo(550, doc.y + 10)
      .strokeColor('#e5e7eb')
      .stroke();
  }

  /**
   * Helper: Add QR code
   */
  private async addQRCode(doc: PDFKit.PDFDocument, data: string, x: number, y: number) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      // Convert data URL to buffer
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      doc.image(qrBuffer, x, y, { width: 100 });
    } catch (error) {
      logger.error('Error generating QR code:', error);
      // Continue without QR code
    }
  }
}

export default new VoucherService();
