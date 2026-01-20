import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';

export interface TicketData {
  bookingReference: string;
  pnr: string;
  passengerName: string;
  departureCity: string;
  arrivalCity: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  seatNumber?: string;
  class: string;
  baggage?: string;
  ticketNumber?: string;
  totalPrice: number;
  currency: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

class PDFService {
  private outputDir = path.join(__dirname, '../../uploads/tickets');

  constructor() {
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate e-ticket PDF
   */
  async generateTicket(ticketData: TicketData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `ticket-${ticketData.bookingReference}-${Date.now()}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header with gradient effect (simulated)
        doc.rect(0, 0, 612, 100).fill('#667eea');
        
        // Title
        doc.fontSize(26).fillColor('white').text('E-TICKET', 50, 30, { align: 'center' });
        doc.fontSize(12).text('Travel Booking Platform', 50, 65, { align: 'center' });

        // Booking Reference Box
        doc.rect(50, 120, 512, 60).fillAndStroke('#f3f4f6', '#e5e7eb');
        doc.fontSize(10).fillColor('#6b7280').text('BOOKING REFERENCE', 70, 135);
        doc.fontSize(18).fillColor('#1f2937').text(ticketData.bookingReference, 70, 150);

        // PNR Box
        doc.rect(320, 120, 242, 60).fillAndStroke('#667eea', '#5568d3');
        doc.fontSize(10).fillColor('white').text('PNR CODE', 340, 135);
        doc.fontSize(18).fillColor('white').text(ticketData.pnr, 340, 150);

        // Passenger Information
        doc.fontSize(14).fillColor('#1f2937').text('Passenger Information', 50, 200);
        doc.moveTo(50, 220).lineTo(562, 220).stroke('#e5e7eb');

        doc.fontSize(11).fillColor('#6b7280').text('Name', 50, 235);
        doc.fontSize(11).fillColor('#1f2937').text(ticketData.passengerName, 200, 235);

        if (ticketData.ticketNumber) {
          doc.fontSize(11).fillColor('#6b7280').text('Ticket Number', 50, 260);
          doc.fontSize(11).fillColor('#1f2937').text(ticketData.ticketNumber, 200, 260);
        }

        // Flight Information
        doc.fontSize(14).fillColor('#1f2937').text('Flight Information', 50, 300);
        doc.moveTo(50, 320).lineTo(562, 320).stroke('#e5e7eb');

        // Route - Visual representation
        const routeY = 345;
        doc.fontSize(16).fillColor('#667eea').text(ticketData.departureCity, 50, routeY);
        doc.fontSize(14).fillColor('#6b7280').text('✈', 180, routeY);
        doc.fontSize(16).fillColor('#667eea').text(ticketData.arrivalCity, 220, routeY);

        // Departure
        doc.fontSize(11).fillColor('#6b7280').text('Departure', 50, routeY + 40);
        doc.fontSize(11).fillColor('#1f2937').text(`${ticketData.departureDate} at ${ticketData.departureTime}`, 50, routeY + 60);

        // Arrival
        doc.fontSize(11).fillColor('#6b7280').text('Arrival', 320, routeY + 40);
        doc.fontSize(11).fillColor('#1f2937').text(`${ticketData.arrivalDate} at ${ticketData.arrivalTime}`, 320, routeY + 60);

        // Flight Details
        const flightDetailsY = routeY + 100;
        doc.fontSize(11).fillColor('#6b7280').text('Airline', 50, flightDetailsY);
        doc.fontSize(11).fillColor('#1f2937').text(ticketData.airline, 200, flightDetailsY);

        doc.fontSize(11).fillColor('#6b7280').text('Flight Number', 50, flightDetailsY + 25);
        doc.fontSize(11).fillColor('#1f2937').text(ticketData.flightNumber, 200, flightDetailsY + 25);

        doc.fontSize(11).fillColor('#6b7280').text('Class', 50, flightDetailsY + 50);
        doc.fontSize(11).fillColor('#1f2937').text(ticketData.class, 200, flightDetailsY + 50);

        if (ticketData.seatNumber) {
          doc.fontSize(11).fillColor('#6b7280').text('Seat', 320, flightDetailsY);
          doc.fontSize(11).fillColor('#1f2937').text(ticketData.seatNumber, 450, flightDetailsY);
        }

        if (ticketData.baggage) {
          doc.fontSize(11).fillColor('#6b7280').text('Baggage Allowance', 320, flightDetailsY + 25);
          doc.fontSize(11).fillColor('#1f2937').text(ticketData.baggage, 450, flightDetailsY + 25);
        }

        // Payment Information
        const paymentY = flightDetailsY + 90;
        doc.fontSize(14).fillColor('#1f2937').text('Payment Information', 50, paymentY);
        doc.moveTo(50, paymentY + 20).lineTo(562, paymentY + 20).stroke('#e5e7eb');

        doc.fontSize(11).fillColor('#6b7280').text('Total Amount', 50, paymentY + 35);
        doc.fontSize(16).fillColor('#10b981').text(
          `${ticketData.currency} ${ticketData.totalPrice.toFixed(2)}`,
          200,
          paymentY + 30
        );

        // Important Information Box
        const infoY = paymentY + 80;
        doc.rect(50, infoY, 512, 120).fillAndStroke('#fef3c7', '#f59e0b');
        doc.fontSize(12).fillColor('#92400e').text('Important Information', 70, infoY + 15);
        doc.fontSize(9).fillColor('#78350f').text(
          '• Please arrive at the airport at least 2 hours before departure for domestic flights and 3 hours for international flights.',
          70,
          infoY + 40,
          { width: 472, align: 'left' }
        );
        doc.text(
          '• Valid photo identification is required for all passengers.',
          70,
          infoY + 65,
          { width: 472, align: 'left' }
        );
        doc.text(
          '• This is an electronic ticket. Please keep a copy of this document for your records.',
          70,
          infoY + 90,
          { width: 472, align: 'left' }
        );

        // Footer
        doc.fontSize(9).fillColor('#9ca3af').text(
          'Travel Booking Platform | support@travelbooking.com | +1 (555) 123-4567',
          50,
          750,
          { align: 'center', width: 512 }
        );

        doc.end();

        stream.on('finish', () => {
          logger.info(`Ticket PDF generated: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          logger.error('PDF generation error:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to generate ticket PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoice(invoiceData: InvoiceData): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `invoice-${invoiceData.invoiceNumber}-${Date.now()}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc.fontSize(28).fillColor('#1f2937').text('INVOICE', 50, 50);
        doc.fontSize(12).fillColor('#6b7280').text('Travel Booking Platform', 50, 85);
        doc.text('support@travelbooking.com', 50, 100);
        doc.text('+1 (555) 123-4567', 50, 115);

        // Invoice Details (Right side)
        doc.fontSize(11).fillColor('#6b7280').text('Invoice Number:', 400, 50);
        doc.fontSize(11).fillColor('#1f2937').text(invoiceData.invoiceNumber, 400, 65);

        doc.fontSize(11).fillColor('#6b7280').text('Date:', 400, 85);
        doc.fontSize(11).fillColor('#1f2937').text(invoiceData.date, 400, 100);

        doc.fontSize(11).fillColor('#6b7280').text('Booking Ref:', 400, 120);
        doc.fontSize(11).fillColor('#1f2937').text(invoiceData.bookingReference, 400, 135);

        // Customer Information
        doc.moveTo(50, 160).lineTo(562, 160).stroke('#e5e7eb');
        doc.fontSize(14).fillColor('#1f2937').text('Bill To:', 50, 175);
        doc.fontSize(11).fillColor('#1f2937').text(invoiceData.customerName, 50, 195);
        doc.fontSize(11).fillColor('#6b7280').text(invoiceData.customerEmail, 50, 210);

        // Items Table
        const tableTop = 250;
        doc.moveTo(50, tableTop).lineTo(562, tableTop).stroke('#1f2937');

        // Table Headers
        doc.fontSize(11).fillColor('#1f2937');
        doc.text('Description', 50, tableTop + 10);
        doc.text('Qty', 380, tableTop + 10);
        doc.text('Unit Price', 430, tableTop + 10);
        doc.text('Total', 510, tableTop + 10);

        doc.moveTo(50, tableTop + 30).lineTo(562, tableTop + 30).stroke('#e5e7eb');

        // Table Rows
        let currentY = tableTop + 40;
        invoiceData.items.forEach((item, index) => {
          doc.fontSize(10).fillColor('#1f2937');
          doc.text(item.description, 50, currentY, { width: 320 });
          doc.text(item.quantity.toString(), 380, currentY);
          doc.text(`${invoiceData.currency} ${item.unitPrice.toFixed(2)}`, 430, currentY);
          doc.text(`${invoiceData.currency} ${item.total.toFixed(2)}`, 510, currentY);
          
          currentY += 30;
          if (index < invoiceData.items.length - 1) {
            doc.moveTo(50, currentY - 5).lineTo(562, currentY - 5).stroke('#f3f4f6');
          }
        });

        doc.moveTo(50, currentY).lineTo(562, currentY).stroke('#e5e7eb');

        // Totals
        currentY += 20;
        doc.fontSize(11).fillColor('#6b7280').text('Subtotal:', 400, currentY);
        doc.fillColor('#1f2937').text(`${invoiceData.currency} ${invoiceData.subtotal.toFixed(2)}`, 510, currentY);

        currentY += 25;
        doc.fillColor('#6b7280').text('Tax:', 400, currentY);
        doc.fillColor('#1f2937').text(`${invoiceData.currency} ${invoiceData.tax.toFixed(2)}`, 510, currentY);

        currentY += 30;
        doc.rect(380, currentY - 10, 182, 40).fill('#667eea');
        doc.fontSize(14).fillColor('white').text('Total:', 400, currentY);
        doc.fontSize(16).fillColor('white').text(`${invoiceData.currency} ${invoiceData.total.toFixed(2)}`, 510, currentY);

        // Footer
        doc.fontSize(9).fillColor('#9ca3af').text(
          'Thank you for your business!',
          50,
          750,
          { align: 'center', width: 512 }
        );

        doc.end();

        stream.on('finish', () => {
          logger.info(`Invoice PDF generated: ${filePath}`);
          resolve(filePath);
        });

        stream.on('error', (error) => {
          logger.error('Invoice PDF generation error:', error);
          reject(error);
        });

      } catch (error) {
        logger.error('Failed to generate invoice PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate multiple tickets for group bookings
   */
  async generateGroupTickets(ticketsData: TicketData[]): Promise<string[]> {
    const promises = ticketsData.map(ticket => this.generateTicket(ticket));
    return Promise.all(promises);
  }

  /**
   * Delete PDF file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`PDF file deleted: ${filePath}`);
      }
    } catch (error) {
      logger.error('Failed to delete PDF file:', error);
      throw error;
    }
  }

  /**
   * Get public URL for ticket download
   */
  getTicketUrl(filePath: string): string {
    const fileName = path.basename(filePath);
    return `/uploads/tickets/${fileName}`;
  }
}

export const pdfService = new PDFService();
export default pdfService;
