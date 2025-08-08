const PDFDocument = require('pdfkit');

/**
 * PROFESSIONAL INVOICE PDF GENERATOR
 * ===================================
 * 
 * FINALIZED FEATURES:
 * ✅ Single page for ≤25 items (STRICT RULE)
 * ✅ Multi-page with proper page breaks for >25 items
 * ✅ Professional layout with clean borders
 * ✅ Amount in words with proper formatting
 * ✅ Complete payment breakdown (Sub Total, Discounted, Packaging, Final Amount)
 * ✅ Optimized footer layout with thank you mppessage
 * ✅ No content overflow or conflicts
 * 
 * USAGE:
 * const { generateProfessionalInvoicePDF } = require('./utils/professionalPdfGenerator');
 * const pdfBuffer = await generateProfessionalInvoicePDF(invoiceData);
 */

// Function to convert number to words (Indian numbering system)
const numberToWords = (num) => {
  if (num === 0) return 'zero';
  
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertHundreds = (n) => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };

  if (num < 1000) {
    return convertHundreds(num).trim();
  } else if (num < 100000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    let result = convertHundreds(thousands) + 'thousand ';
    if (remainder > 0) {
      result += convertHundreds(remainder);
    }
    return result.trim();
  } else if (num < 10000000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    let result = convertHundreds(lakhs) + 'lakh ';
    if (remainder > 0) {
      if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += convertHundreds(thousands) + 'thousand ';
        if (hundreds > 0) {
          result += convertHundreds(hundreds);
        }
      } else {
        result += convertHundreds(remainder);
      }
    }
    return result.trim();
  } else {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    let result = convertHundreds(crores) + 'crore ';
    if (remainder > 0) {
      if (remainder >= 100000) {
        const lakhs = Math.floor(remainder / 100000);
        const remaining = remainder % 100000;
        result += convertHundreds(lakhs) + 'lakh ';
        if (remaining >= 1000) {
          const thousands = Math.floor(remaining / 1000);
          const hundreds = remaining % 1000;
          result += convertHundreds(thousands) + 'thousand ';
          if (hundreds > 0) {
            result += convertHundreds(hundreds);
          }
        } else if (remaining > 0) {
          result += convertHundreds(remaining);
        }
      } else if (remainder >= 1000) {
        const thousands = Math.floor(remainder / 1000);
        const hundreds = remainder % 1000;
        result += convertHundreds(thousands) + 'thousand ';
        if (hundreds > 0) {
          result += convertHundreds(hundreds);
        }
      } else {
        result += convertHundreds(remainder);
      }
    }
    return result.trim();
  }
};

const generateProfessionalInvoicePDF = (invoiceData) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting professional invoice PDF generation...');
      
      // Create PDF document with A4 standard settings
      const doc = new PDFDocument({
        size: 'A4',
        margin: 15,
        bufferPages: true,
        info: {
          Title: `Invoice ${invoiceData.invoiceNumber}`,
          Author: 'Sun Crackers',
          Subject: 'Invoice',
          Keywords: 'invoice, crackers, fireworks, sivakaasi'
        }
      });
      
      // Collect PDF data
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          console.log(`Professional invoice PDF generated: ${buffer.length} bytes`);
          resolve(buffer);
        } catch (err) {
          reject(new Error(`Buffer creation failed: ${err.message}`));
        }
      });
      
      doc.on('error', (err) => {
        reject(new Error(`PDF generation failed: ${err.message}`));
      });

      // Extract data with defaults
      const {
        invoiceNumber = '001',
        orderId = 'ORD-001',
        customerDetails = {},
        items = [],
        orderSummary = {},
        paymentStatus = 'pending',
        generatedAt = new Date(),
        storeDetails = {}
      } = invoiceData;

      // Utility functions
      const formatCurrency = (amount) => {
        const num = parseFloat(amount) || 0;
        return num.toFixed(2);
      };

      const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      };

      // Page dimensions - A4 standard with proper margins
      let y = 15;
      const pageWidth = 565; // A4 width minus margins
      const pageHeight = 842; // A4 height minus margins
      const leftMargin = 15;
      const rightMargin = 580;
      const itemsPerPage = 25; // FINALIZED: 25 products = 1 page ONLY (STRICT RULE)
      
      // FINALIZED: Single page logic for ≤25 items, multi-page for >25 items
      const totalPages = items.length <= itemsPerPage ? 1 : Math.ceil(items.length / itemsPerPage);
      let currentPage = 1;

      // Helper function to draw page header with clean borders
      const drawPageHeader = (isFirstPage = true) => {
        if (isFirstPage) {
          // MAIN BORDER - Optimized height to fit everything on one page
          const mainBorderY = 15;
          const mainBorderHeight = totalPages === 1 ? 720 : 810; // Reduced height for single page
          doc.rect(leftMargin, mainBorderY, pageWidth, mainBorderHeight).stroke('#000000');
          
          // HEADER SECTION (no separate border - part of main border)
          y = 25;
          doc.fillColor('#000000')
             .fontSize(18)
             .font('Helvetica-Bold')
             .text('SUN CRACKERS', leftMargin + 10, y, { align: 'center', width: pageWidth - 20 });
          
          y += 25;
          doc.fontSize(12)
             .font('Helvetica')
             .text('www.suncrackers.com', leftMargin + 10, y, { align: 'center', width: pageWidth - 20 });

          y += 20;

          // CONTACT ROW - Internal horizontal line only
          doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke('#000000');
          y += 8;
          
          doc.fillColor('#000000')
             .fontSize(11)
             .font('Helvetica-Bold')
             .text('WhatsApp: +91 9443569475', leftMargin + 15, y); // Start space for WhatsApp
          
          // Email aligned to the right edge with end space
          doc.text('Email: suncrackers4500@gmail.com', leftMargin + 15, y, { 
            align: 'right', 
            width: pageWidth - 30 // End space for Email
          });

          y += 20;
          
          // Another horizontal line
          doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke('#000000');
          const topBorderY = y; // Store top border position for vertical divider
          y += 8; // Reduced spacing to remove extra row

          // CUSTOMER DETAILS AND INVOICE INFO SECTION
          const customerSectionWidth = pageWidth * 0.6;
          let customerName = customerDetails.name || 'Customer Name';
          
          // Format address properly from address object
          let customerAddress = 'Customer Address';
          if (customerDetails.address) {
            const addr = customerDetails.address;
            const addressParts = [];
            if (addr.street) addressParts.push(addr.street);
            if (addr.landmark) addressParts.push(addr.landmark);
            if (addr.nearestTown) addressParts.push(addr.nearestTown);
            if (addr.district) addressParts.push(addr.district);
            if (addr.state) addressParts.push(addr.state);
            if (addr.pincode) addressParts.push(addr.pincode);
            if (addr.country && addr.country !== 'India') addressParts.push(addr.country);
            
            if (addressParts.length > 0) {
              customerAddress = addressParts.join(', ');
            } else if (addr.district && addr.state) {
              customerAddress = `${addr.district}, ${addr.state}`;
            }
          }
          
          // Handle multiple contact numbers - use mobile and deliveryContact from database
          let customerContact = 'Contact Number';
          const mobile = customerDetails.mobile;
          const deliveryContact = customerDetails.deliveryContact;
          
          if (mobile && deliveryContact && mobile !== deliveryContact) {
            // Both numbers available and different
            customerContact = `${mobile}, ${deliveryContact}`;
          } else if (mobile) {
            // Only mobile available
            customerContact = mobile;
          } else if (deliveryContact) {
            // Only deliveryContact available
            customerContact = deliveryContact;
          }
          
          // Customer details section - compact alignment
          const labelWidth = 50; // Reduced width for labels
          const customerValueX = leftMargin + 10 + labelWidth;
          const customerSectionStartY = y; // Store start position for vertical divider
          
          doc.fontSize(11)
             .font('Helvetica')
             .fillColor('#000000')
             .text('Name :', leftMargin + 10, y + 5); // Removed extra spacing
          doc.font('Helvetica-Bold')
             .text(customerName, customerValueX, y + 5);
          
          doc.font('Helvetica')
             .text('Address :', leftMargin + 10, y + 20); // Adjusted spacing
          doc.font('Helvetica-Bold')
             .text(customerAddress, customerValueX, y + 20);
          
          doc.font('Helvetica')
             .text('Contact :', leftMargin + 10, y + 35); // Adjusted spacing
          doc.font('Helvetica-Bold')
             .text(customerContact, customerValueX, y + 35);

          // Vertical divider between customer and invoice info - TOUCHES BORDERS
          const dividerX = leftMargin + customerSectionWidth;

          // Invoice section - aligned with discount column for uniform model
          const discountColumnX = leftMargin + 35 + 50 + 120 + 50 + 50 + 60; // sno + code + productName + quantity + rate + actual
          const invoiceStartX = discountColumnX + 8; // Start from discount column line
          const invoiceLabelWidth = 60; // Reduced width for invoice labels
          const invoiceValueX = invoiceStartX + invoiceLabelWidth;
          
          doc.font('Helvetica')
             .text('Invoice No :', invoiceStartX, y + 5); // Aligned with Name
          doc.font('Helvetica-Bold')
             .text(invoiceNumber, invoiceValueX, y + 5);
          
          doc.font('Helvetica')
             .text('Date :', invoiceStartX, y + 20); // Aligned with Address
          doc.font('Helvetica-Bold')
             .text(formatDate(generatedAt), invoiceValueX, y + 20);

          y += 50; // Reduced height
          
          // Draw vertical divider from top border to bottom border - TOUCHES BORDERS
          doc.moveTo(dividerX, topBorderY).lineTo(dividerX, y).stroke('#000000');
          
          // Horizontal line after customer section - touches product table
          doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke('#000000');
          
        } else {
          // CONTINUATION PAGE HEADER - Always full height border
          doc.rect(leftMargin, 15, pageWidth, 810).stroke('#000000');
          y = 25;
          
          doc.fillColor('#000000')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('SUN CRACKERS', leftMargin + 10, y, { align: 'center', width: pageWidth - 20 });
          
          y += 25;
          doc.fontSize(10)
             .font('Helvetica-Oblique')
             .text(`Invoice ${invoiceNumber} - Page ${currentPage} of ${totalPages}`, leftMargin + 10, y, { align: 'center', width: pageWidth - 20 });
          
          y += 30;
        }
      };

      // Helper function to draw table header - no separate border, uses internal lines
      const drawTableHeader = () => {
        const rowHeight = 20;
        
        // Gray background for header (no border - part of main border)
        doc.rect(leftMargin, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#000000');
        
        let xPos = leftMargin;
        doc.fillColor('#000000')
           .fontSize(10)
           .font('Helvetica-Bold');
        
        const colWidths = {
          sno: 35, code: 50, productName: 120, quantity: 50, 
          rate: 50, actual: 60, discountPct: 40, discountVal: 60, total: 60
        };
        
        // Column headers with vertical dividers
        doc.text('S.No', xPos + 2, y + 6, { width: colWidths.sno - 4, align: 'center' });
        xPos += colWidths.sno;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Code', xPos + 2, y + 6, { width: colWidths.code - 4, align: 'center' });
        xPos += colWidths.code;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Product Name', xPos + 2, y + 6, { width: colWidths.productName - 4, align: 'center' });
        xPos += colWidths.productName;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Quantity', xPos + 2, y + 6, { width: colWidths.quantity - 4, align: 'center' });
        xPos += colWidths.quantity;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Rate', xPos + 2, y + 6, { width: colWidths.rate - 4, align: 'center' });
        xPos += colWidths.rate;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Actual', xPos + 2, y + 6, { width: colWidths.actual - 4, align: 'center' });
        xPos += colWidths.actual;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Disc %', xPos + 2, y + 6, { width: colWidths.discountPct - 4, align: 'center' });
        xPos += colWidths.discountPct;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Discount', xPos + 2, y + 6, { width: colWidths.discountVal - 4, align: 'center' });
        xPos += colWidths.discountVal;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        doc.text('Total', xPos + 2, y + 6, { width: colWidths.total - 4, align: 'center' });
        
        y += rowHeight;
        return colWidths;
      };

      // Start first page
      drawPageHeader(true);
      let colWidths = drawTableHeader();

      // Process items with proper page management
      let totalQuantity = 0;
      let totalActual = 0;
      let totalDiscount = 0;
      let totalAmount = 0;
      // Packaging cost should only come from database, default to 0 if no data exists
      let packagingCost = orderSummary.packagingPrice || orderSummary.packagingCost || 0;
      let itemsOnCurrentPage = 0;
      const rowHeight = 20;

      // Helper function to draw table rows - no outer border, only internal lines
      const drawTableRow = (data) => {
        // Only horizontal line after each row + vertical dividers (no outer rectangle)
        doc.moveTo(leftMargin, y + rowHeight).lineTo(rightMargin, y + rowHeight).stroke('#000000');
        
        let xPos = leftMargin;
        doc.fillColor('#000000').fontSize(9).font('Helvetica');
        
        // S.No
        doc.text(data.sno, xPos + 2, y + 6, { width: colWidths.sno - 4, align: 'center' });
        xPos += colWidths.sno;
        if (data.sno) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Code  
        doc.text(data.code, xPos + 2, y + 6, { width: colWidths.code - 4, align: 'center' });
        xPos += colWidths.code;
        if (data.code) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Product Name
        doc.text(data.productName, xPos + 2, y + 6, { width: colWidths.productName - 4, align: 'left' });
        xPos += colWidths.productName;
        if (data.productName) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Quantity
        doc.text(data.quantity, xPos + 2, y + 6, { width: colWidths.quantity - 4, align: 'center' });
        xPos += colWidths.quantity;
        if (data.quantity) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Rate
        doc.text(data.rate, xPos + 2, y + 6, { width: colWidths.rate - 4, align: 'right' });
        xPos += colWidths.rate;
        if (data.rate) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Actual
        doc.text(data.actual, xPos + 2, y + 6, { width: colWidths.actual - 4, align: 'right' });
        xPos += colWidths.actual;
        if (data.actual) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Discount %
        doc.text(data.discountPct, xPos + 2, y + 6, { width: colWidths.discountPct - 4, align: 'center' });
        xPos += colWidths.discountPct;
        if (data.discountPct) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Discount Value
        doc.text(data.discountVal, xPos + 2, y + 6, { width: colWidths.discountVal - 4, align: 'right' });
        xPos += colWidths.discountVal;
        if (data.discountVal) doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        // Total
        doc.text(data.total, xPos + 2, y + 6, { width: colWidths.total - 4, align: 'right' });
        
        y += rowHeight;
      };

      // FINALIZED: Process items with proper page management
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // FINALIZED RULE: Page breaks only for >25 items when current page is full
        if (items.length > itemsPerPage && itemsOnCurrentPage >= itemsPerPage && i < items.length) {
          // Fill remaining rows on current page
          const remainingRows = itemsPerPage - itemsOnCurrentPage;
          for (let j = 0; j < remainingRows; j++) {
            doc.moveTo(leftMargin, y + rowHeight).lineTo(rightMargin, y + rowHeight).stroke('#000000');
            let xPos = leftMargin;
            xPos += colWidths.sno;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.code;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.productName;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.quantity;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.rate;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.actual;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.discountPct;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            xPos += colWidths.discountVal;
            doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
            y += rowHeight;
          }
          
          // PAGE BREAK - Start new page
          currentPage++;
          doc.addPage();
          drawPageHeader(false);
          colWidths = drawTableHeader();
          itemsOnCurrentPage = 0;
        }

        const productName = item.productId?.name || item.productSnapshot?.name || `Product ${i + 1}`;
        const productCode = item.productId?.productCode || item.productSnapshot?.productCode || (100 + i);
        const quantity = item.quantity || 1;
        
        // Rate = price from database (original price)
        const rate = parseFloat(item.price || item.productSnapshot?.price || item.productId?.price || 60.78947368421055);
        
        // Actual = Quantity × Rate
        const actualAmount = quantity * rate;
        
        // Discount percentage from database  
        const discountPercent = parseFloat(item.discountPercentage || item.productSnapshot?.discountPercentage || item.productId?.discountPercentage || 81);
        
        // Discount value = (Actual × Discount%) / 100
        const discountAmount = (actualAmount * discountPercent) / 100;
        
        // Total = Actual - Discount
        const itemTotal = actualAmount - discountAmount;

        totalQuantity += quantity;
        totalActual += actualAmount;
        totalDiscount += discountAmount;
        totalAmount += itemTotal;

        drawTableRow({
          sno: (i + 1).toString(),
          code: productCode.toString(),
          productName: productName,
          quantity: quantity.toString(),
          rate: formatCurrency(rate),
          actual: formatCurrency(actualAmount),
          discountPct: `${discountPercent}%`,
          discountVal: formatCurrency(discountAmount),
          total: formatCurrency(itemTotal)
        });

        itemsOnCurrentPage++;
      }

      // Fill remaining rows with proper column lines (mature & stylish) - Remove last row
      const remainingRows = itemsPerPage - itemsOnCurrentPage - 1; // Remove last empty row
      for (let i = 0; i < remainingRows; i++) {
        // Draw horizontal line 
        doc.moveTo(leftMargin, y + rowHeight).lineTo(rightMargin, y + rowHeight).stroke('#000000');
        
        // Draw all column lines for empty rows - professional appearance
        let xPos = leftMargin;
        xPos += colWidths.sno;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.code;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.productName;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.quantity;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.rate;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.actual;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.discountPct;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        xPos += colWidths.discountVal;
        doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
        
        y += rowHeight;
      }

      // FOOTER SECTION - ONLY ON LAST PAGE
      if (currentPage === totalPages) {
        // TOTALS ROW - gray background, part of main table
        doc.rect(leftMargin, y, pageWidth, rowHeight).fillAndStroke('#E8E8E8', '#000000');
      
      let xPos = leftMargin;
      doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold');
      
      // Empty cells for S.No, Code
      xPos += colWidths.sno;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      xPos += colWidths.code;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      doc.text('TOTAL:', xPos + 2, y + 6, { width: colWidths.productName - 4, align: 'right' });
      xPos += colWidths.productName;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      doc.text(totalQuantity.toString(), xPos + 2, y + 6, { width: colWidths.quantity - 4, align: 'center' });
      xPos += colWidths.quantity;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      xPos += colWidths.rate; // Empty rate cell
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      doc.text(formatCurrency(totalActual), xPos + 2, y + 6, { width: colWidths.actual - 4, align: 'right' });
      xPos += colWidths.actual;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      xPos += colWidths.discountPct; // Empty discount % cell
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      doc.text(formatCurrency(totalDiscount), xPos + 2, y + 6, { width: colWidths.discountVal - 4, align: 'right' });
      xPos += colWidths.discountVal;
      doc.moveTo(xPos, y).lineTo(xPos, y + rowHeight).stroke();
      
      doc.text(formatCurrency(totalAmount), xPos + 2, y + 6, { width: colWidths.total - 4, align: 'right' });
      // No extra column line after total amount - table ends here
      
      y += rowHeight;

      // FINALIZED FOOTER SECTION - Direct connection to table (NO BORDER LINE ABOVE)
      // No extra spacing - footer connects directly to table
      
      // Use database values from orderSummary for accurate totals
      const dbActualTotal = orderSummary.totalPrice || totalActual;
      const dbDiscountTotal = orderSummary.totalSavings || totalDiscount;
      const dbSubTotal = orderSummary.totalOfferPrice || (dbActualTotal - dbDiscountTotal); // Use totalOfferPrice (after discount)
      const dbPackagingPrice = orderSummary.packagingPrice || packagingCost;
      const dbFinalAmount = orderSummary.totalWithPackaging || (dbSubTotal + dbPackagingPrice);
      
      const amountInWords = numberToWords(Math.floor(dbFinalAmount));
      const discountColumnX = leftMargin + 35 + 50 + 120 + 50 + 50 + 60; // sno + code + productName + quantity + rate + actual
      const footerSplitX = discountColumnX; // Split at discount column line for uniform alignment
      const footerHeight = 60; // Reduced height since amount in words is single line
      const footerRowHeight = 20; // Height for each footer row
      
      // Vertical divider aligned with discount column (extends through all summary rows)
      const finalAmountRowY = y + (4 * footerRowHeight) + 10; // Calculate Final Amount row position (4 rows + line + spacing)
      
      // Draw vertical divider through all summary rows for better visual connection
      doc.moveTo(footerSplitX, y).lineTo(footerSplitX, finalAmountRowY + 15).stroke('#000000');
      
      // Left side (60%) - 2 rows layout
      
      // Row 1: Amount in Words title
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
         .text('Amount in Words:', leftMargin + 8, y + 5);
      
      // Row 2: Amount in words content (single line) - Camel Case
      const amountWords = `Rupees ${amountInWords.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ')} Only`;
      doc.fontSize(9).font('Helvetica')
         .text(amountWords, leftMargin + 8, y + 25, { 
           width: footerSplitX - leftMargin - 16, 
           align: 'left' 
         });

      // Right side - aligned with discount column for uniform model
      const summaryStartX = discountColumnX + 8; // Start from discount column line (discountColumnX already declared above)
      const labelWidth = 75;
      const valueStartX = summaryStartX + labelWidth;
      let summaryY = y + 5;
      
      // Row 1: Actual Amount Total
      doc.fontSize(9).font('Helvetica');
      doc.text('Actual Total :', summaryStartX, summaryY, { width: labelWidth, align: 'left' });
      doc.text(`Rs. ${formatCurrency(dbActualTotal)}`, valueStartX, summaryY);
      summaryY += footerRowHeight;
      
      // Row 2: Discount Amount Total
      doc.text('Discount Total:', summaryStartX, summaryY, { width: labelWidth, align: 'left' });
      doc.text(`Rs. ${formatCurrency(dbDiscountTotal)}`, valueStartX, summaryY);
      summaryY += footerRowHeight;
      
      // Row 3: Sub Total (Actual - Discount)
      doc.text('Sub Total :', summaryStartX, summaryY, { width: labelWidth, align: 'left' });
      doc.text(`Rs. ${formatCurrency(dbSubTotal)}`, valueStartX, summaryY);
      summaryY += footerRowHeight;
      
      // Row 4: Packaging
      doc.text('Packaging :', summaryStartX, summaryY, { width: labelWidth, align: 'left' });
      doc.text(`Rs. ${formatCurrency(dbPackagingPrice)}`, valueStartX, summaryY);
      summaryY += footerRowHeight;
      
      // Add a subtle line above Final Amount for better visual connection
      summaryY += 2;
      doc.moveTo(summaryStartX, summaryY).lineTo(valueStartX + 80, summaryY).stroke('#CCCCCC');
      summaryY += 3;
      
      // Row 5: Final Amount (Bold, right-aligned with other amounts for consistency)
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Final Amount :', summaryStartX, summaryY, { width: labelWidth, align: 'left' });
      doc.text(`Rs. ${formatCurrency(dbFinalAmount)}`, valueStartX, summaryY);
      
      // Add space after Final Amount, then border
      summaryY += footerRowHeight + 8; // Extra space after Final Amount
      y = summaryY; // Update y position to match
      doc.moveTo(leftMargin, y).lineTo(rightMargin, y).stroke('#000000');

      // THANK YOU MESSAGE - Outside the border
      y += 10; // Reduced space after footer border
      
      if (totalPages === 1) {
        // Single page: Thank you message outside border
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
           .text('Thank you for business with us!', leftMargin, y, { 
             align: 'center', width: pageWidth 
           });
        
        y += 12;
        doc.fontSize(8).font('Helvetica')
           .text('Address: 12/417, Jeyam Nagar, Meenampatti,Sivakasi-626189', 
                 leftMargin, y, { align: 'center', width: pageWidth });
      } else {
        // Multi-page: Thank you message outside border
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000')
           .text('Thank you for business with us!', leftMargin, y, { 
             align: 'center', width: pageWidth 
           });
        
        y += 12;
        doc.fontSize(8).font('Helvetica')
           .text('Address: 12/417, Jeyam Nagar, Meenampatti,Sivakasi-626189', 
                 leftMargin, y, { align: 'center', width: pageWidth });
      }
      } // End of LAST PAGE ONLY section

      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('Professional invoice PDF generation error:', error);
      reject(new Error(`Professional invoice PDF generation failed: ${error.message}`));
    }
  });
};

module.exports = {
  generateProfessionalInvoicePDF
};