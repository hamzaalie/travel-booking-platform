import voucherService from '../services/voucher.service';
import { 
  HotelVoucher, 
  MealPlan 
} from '../../../shared/src/hotelEnhancedTypes';
import { 
  CarRentalVoucher, 
  EnhancedCarRentalBooking
} from '../../../shared/src/carRentalEnhancedTypes';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../config/logger';

/**
 * Test script for voucher generation
 * Run: npx ts-node src/scripts/test-vouchers.ts
 */

async function testHotelVoucher() {
  try {
    logger.info('Testing hotel voucher generation...');

    const testVoucher: HotelVoucher = {
      voucherId: 'HV-TEST-001',
      bookingReference: 'BK-HTL-2026-001',
      confirmationNumber: 'CONF-HTL-2026-001',
      hotel: {
        name: 'Grand Hyatt Bangkok',
        address: '494 Rajdamri Road',
        city: 'Bangkok',
        country: 'Thailand',
        phone: '+66 2 254 1234',
        email: 'bangkok@grandhyatt.com',
        starRating: 5,
      },
      reservation: {
        checkInDate: new Date('2026-03-01'),
        checkOutDate: new Date('2026-03-05'),
        numberOfNights: 4,
        roomType: 'Deluxe King Room',
        mealPlan: MealPlan.BREAKFAST_INCLUDED,
        numberOfRooms: 1,
        numberOfGuests: {
          adults: 2,
          children: 1,
        },
      },
      primaryGuest: {
        title: 'Mr.',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1 555-0100',
      },
      specialRequests: [
        'High floor preferred',
        'Late check-out if possible',
        'Extra pillows',
      ],
      pricing: {
        roomRate: 12000,
        taxes: 1800,
        serviceFee: 200,
        total: 14000,
        currency: 'THB',
        paymentStatus: 'PAID',
      },
      cancellationPolicy: {
        freeCancellationUntil: new Date('2026-02-26'),
        cancellationFee: 2000,
        refundable: true,
        terms: 'Free cancellation until 3 days before check-in. After that, 1 night charge applies.',
      },
      importantInfo: {
        checkInTime: '14:00',
        checkOutTime: '11:00',
        childPolicy: 'Children under 12 stay free when using existing bedding',
        petPolicy: 'Pets not allowed',
        additionalNotes: [
          'Please bring a valid ID and credit card for check-in',
          'Airport shuttle available for 500 THB per person',
          'Spa and fitness center access included',
        ],
      },
      qrCodeData: JSON.stringify({
        voucherId: 'HV-TEST-001',
        bookingReference: 'BK-HTL-2026-001',
        confirmationNumber: 'CONF-HTL-2026-001',
      }),
      generatedAt: new Date(),
      validUntil: new Date('2026-03-01'),
    };

    const pdfBuffer = await voucherService.generateHotelVoucher(testVoucher);

    const outputPath = join(__dirname, '../../uploads/test-hotel-voucher.pdf');
    writeFileSync(outputPath, pdfBuffer);

    logger.info(`✅ Hotel voucher generated successfully: ${outputPath}`);
    logger.info(`File size: ${pdfBuffer.length} bytes`);
    
    return true;
  } catch (error: any) {
    logger.error('❌ Hotel voucher generation failed:', error.message);
    return false;
  }
}

async function testCarRentalVoucher() {
  try {
    logger.info('Testing car rental voucher generation...');

    const booking: EnhancedCarRentalBooking = {
      bookingId: 'BK-CAR-2026-001',
      confirmationNumber: 'CONF-CAR-2026-001',
      vehicle: {
        id: 'VEH-001',
        category: 'STANDARD',
        model: 'Toyota Camry',
        transmission: 'AUTOMATIC',
        seats: 5,
        doors: 4,
        fuelType: 'PETROL',
        imageUrl: 'https://example.com/camry.jpg',
      },
      rental: {
        pickupLocation: 'Bangkok Suvarnabhumi Airport',
        dropoffLocation: 'Bangkok Suvarnabhumi Airport',
        pickupDate: new Date('2026-03-15'),
        dropoffDate: new Date('2026-03-22'),
        numberOfDays: 7,
      },
      driver: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1 555-0100',
        age: 35,
        licenseNumber: 'D1234567',
        licenseCountry: 'USA',
        licenseYears: 10,
      },
      insurance: {
        selectedCoverage: [],
        totalPrice: 210,
        currency: 'USD',
      },
      addOns: {
        selectedAddOns: [],
        totalPrice: 196,
        currency: 'USD',
      },
      pricing: {
        baseRate: 350,
        insuranceTotal: 210,
        addOnsTotal: 196,
        taxes: 75.6,
        fees: 20,
        total: 851.6,
        currency: 'USD',
        deposit: 500,
      },
      policies: {
        fuelPolicy: 'Full to Full',
        mileagePolicy: 'Unlimited',
        cancellationPolicy: 'Free cancellation up to 24 hours before pickup',
        lateFee: 50,
      },
    };

    const testVoucher: CarRentalVoucher = {
      voucherId: 'CR-TEST-001',
      bookingReference: 'BK-CAR-2026-001',
      confirmationNumber: 'CONF-CAR-2026-001',
      rentalCompany: {
        name: 'Premium Car Rentals',
        logo: 'https://example.com/logo.png',
        address: 'Bangkok Suvarnabhumi Airport, Thailand',
        phone: '+66 2 132 1888',
        email: 'support@premiumrentals.com',
      },
      booking: booking,
      importantInfo: {
        whatToBring: [
          'Valid driver license (held for at least 1 year)',
          'Credit card in driver name',
          'Passport or national ID',
          'Booking confirmation (this voucher)',
        ],
        pickupInstructions: [
          'Present this voucher at the rental counter',
          'Vehicle inspection will be conducted before departure',
          'Fuel policy: Full to Full (return with same fuel level)',
          'Mileage: Unlimited kilometers included',
        ],
        dropoffInstructions: [
          'Return vehicle to same location',
          'Refuel before returning',
          'Vehicle inspection will be done',
        ],
        emergencyContact: '+66 2 123 4567',
      },
      qrCodeData: JSON.stringify({
        voucherId: 'CR-TEST-001',
        bookingReference: 'BK-CAR-2026-001',
        confirmationNumber: 'CONF-CAR-2026-001',
      }),
      generatedAt: new Date(),
    };

    const pdfBuffer = await voucherService.generateCarRentalVoucher(testVoucher);

    const outputPath = join(__dirname, '../../uploads/test-car-rental-voucher.pdf');
    writeFileSync(outputPath, pdfBuffer);

    logger.info(`✅ Car rental voucher generated successfully: ${outputPath}`);
    logger.info(`File size: ${pdfBuffer.length} bytes`);
    
    return true;
  } catch (error: any) {
    logger.error('❌ Car rental voucher generation failed:', error.message);
    return false;
  }
}

async function runTests() {
  logger.info('='.repeat(60));
  logger.info('VOUCHER GENERATION TEST SUITE');
  logger.info('='.repeat(60));

  const results = {
    hotel: false,
    carRental: false,
  };

  // Test hotel voucher
  logger.info('\n[1/2] Testing hotel voucher...');
  results.hotel = await testHotelVoucher();

  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test car rental voucher
  logger.info('\n[2/2] Testing car rental voucher...');
  results.carRental = await testCarRentalVoucher();

  // Summary
  logger.info('\n' + '='.repeat(60));
  logger.info('TEST RESULTS');
  logger.info('='.repeat(60));
  logger.info(`Hotel Voucher: ${results.hotel ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`Car Rental Voucher: ${results.carRental ? '✅ PASS' : '❌ FAIL'}`);
  logger.info('='.repeat(60));

  const allPassed = results.hotel && results.carRental;
  
  if (allPassed) {
    logger.info('✅ All tests passed!');
    logger.info('\nGenerated PDFs are located in:');
    logger.info('  - backend/uploads/test-hotel-voucher.pdf');
    logger.info('  - backend/uploads/test-car-rental-voucher.pdf');
    process.exit(0);
  } else {
    logger.error('❌ Some tests failed. Check the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logger.error('Test suite failed:', error);
  process.exit(1);
});
