/* =========================================
   ORDER PDF HELPERS
   jspdf is loaded only when the button is
   clicked, so it does not slow down the app.
========================================= */

export const formatOrderDate = (date) => {
    if (!date) return "-";
  
    const value = new Date(date);
  
    if (Number.isNaN(value.getTime())) return "-";
  
    return value.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  // The default PDF font cannot print the rupee symbol, so "Rs." is used.
  const formatPdfAmount = (amount) =>
    `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  
  /* Build the PDF document (one detail table per selected order row) */
  export const buildOrdersPdf = async (rows) => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
  
    const doc = new jsPDF({ unit: "pt", format: "a4" });
  
    doc.setFontSize(18);
    doc.setTextColor(191, 0, 0);
    doc.text("Wardrobe - Order Details", 40, 50);
  
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated: ${formatOrderDate(new Date())}   |   Orders: ${rows.length}`,
      40,
      68
    );
  
    let y = 90;
  
    rows.forEach((row) => {
      autoTable(doc, {
        startY: y,
        theme: "grid",
        head: [[{ content: `Order ${row.orderId}`, colSpan: 2 }]],
        body: [
          ["Order ID", String(row.orderId)],
          ["Customer", row.customerName],
          ["Mobile", row.mobile],
          ["Address", row.address],
          ["Order Item", row.itemName],
          ["Portion", row.portion],
          ["Quantity", String(row.quantity)],
          ["Item Total", formatPdfAmount(row.totalAmount)],
          ["Payment Method", row.paymentMethod],
          ["Order Date", formatOrderDate(row.createdAt)],
        ],
        headStyles: { fillColor: [191, 0, 0], textColor: 255, fontSize: 11 },
        styles: { fontSize: 10, cellPadding: 6, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: "bold", fillColor: [248, 250, 252] },
        },
        margin: { left: 40, right: 40 },
        pageBreak: "avoid",
      });
  
      y = doc.lastAutoTable.finalY + 20;
    });
  
    return doc;
  };
  
  export const downloadOrdersPdf = async (rows) => {
    const doc = await buildOrdersPdf(rows);
    const date = new Date().toISOString().slice(0, 10);
  
    doc.save(`orders-${date}.pdf`);
  };