const fs = require('fs');
const path = require('path');
const { generateProfessionalInvoicePDF } = require('../utils/professionalPdfGenerator');

(async () => {
  try {
    const invoiceData = {
      invoiceNumber: 'INV-TEST-001',
      orderId: 'ORD-TEST-001',
      generatedAt: new Date(),
      paymentStatus: 'paid',
      customerDetails: {
        name: 'John Doe',
        mobile: '9876543210',
        deliveryContact: '9123456780',
        address: {
          street: '12/417, Jeyam Nagar',
          landmark: 'Near Main Market',
          nearestTown: 'Meenampatti',
          district: 'Sivakasi',
          state: 'Tamil Nadu',
          pincode: '626189'
        }
      },
      items: Array.from({ length: 12 }).map((_, idx) => ({
        productSnapshot: {
          productCode: 100 + idx,
          name: `Sample Product ${idx + 1}`,
          price: 60.78947368421055 + (idx % 3) * 5,
          discountPercentage: 81
        },
        quantity: (idx % 4) + 1,
        price: 60.78947368421055 + (idx % 3) * 5,
        discountPercentage: 81
      })),
      orderSummary: {
        totalPrice: 0, // will not be used strictly, the generator calculates and falls back sensibly
        totalSavings: 0,
        totalOfferPrice: 0,
        packagingPrice: 50,
        totalWithPackaging: 0
      },
      storeDetails: {}
    };

    // Generate and write PDF
    const buffer = await generateProfessionalInvoicePDF(invoiceData);
    const outDir = path.resolve(__dirname, '..', 'uploads');
    const outPath = path.join(outDir, 'sample-invoice.pdf');
    fs.writeFileSync(outPath, buffer);

    console.log(`Sample invoice generated at: ${outPath}`);
  } catch (err) {
    console.error('Failed to generate sample invoice:', err);
    process.exit(1);
  }
})();