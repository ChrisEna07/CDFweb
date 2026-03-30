import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generarPDFCobro = async (cliente, deudas = [], puntosExtra = { puntos: 0, premio: false }) => {
  try {
    if (!deudas || deudas.length === 0) return false;

    const doc = new jsPDF()
    const fechaHoy = new Date().toLocaleDateString('es-CO')
    const total = deudas.reduce((acc, d) => acc + (Number(d.monto_total) || 0), 0)

    // --- LOGO ---
    try {
      doc.addImage('/logo-marivama.png', 'PNG', 15, 10, 25, 25, undefined, 'FAST')
    } catch (e) { 
      console.log("Logo no encontrado") 
    }

    // --- ENCABEZADO ---
    doc.setFontSize(22)
    doc.setTextColor(234, 88, 12)
    doc.setFont(undefined, 'bold')
    doc.text('MARIVAMA', 45, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont(undefined, 'normal')
    doc.text('FRITOS & EMPANADAS', 45, 28)
    doc.text(`Fecha de cobro: ${fechaHoy}`, 45, 33)

    doc.setDrawColor(234, 88, 12)
    doc.setLineWidth(0.5)
    doc.line(15, 40, 195, 40)

    // --- INFO CLIENTE ---
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.setFont(undefined, 'bold')
    doc.text(`CLIENTE: ${cliente.apodo?.toUpperCase() || 'CLIENTE'}`, 15, 50)
    
    if (cliente.nombre) {
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(100)
      doc.text(`Ref: ${cliente.nombre}`, 15, 55)
    }

    // --- SECCIÓN DE PUNTOS (NUEVO) ---
    const posXRef = 140;
    doc.setDrawColor(234, 88, 12);
    doc.setLineWidth(0.2);
    doc.roundedRect(posXRef, 44, 55, 12, 2, 2, 'S');
    
    doc.setFontSize(9);
    doc.setTextColor(234, 88, 12);
    doc.setFont(undefined, 'bold');
    doc.text('MIS PUNTOS MARIVAMA', posXRef + 5, 49);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`${puntosExtra.puntos} Puntos Acumulados`, posXRef + 5, 54);

    // --- FILAS ---
    const filas = deudas.map(d => {
      const fechaBase = d.created_at ? new Date(d.created_at) : new Date();
      const fechaFormateada = fechaBase.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' });
      return [
        fechaFormateada,
        d.productos?.nombre || 'Consumo MariVama',
        d.cantidad || 1,
        `$${(Number(d.monto_total) || 0).toLocaleString('es-CO')}`
      ];
    });

    // --- TABLA ---
    autoTable(doc, {
      startY: 60,
      head: [['Fecha', 'Detalle', 'Cant.', 'Subtotal']],
      body: filas,
      headStyles: { fillColor: [234, 88, 12], halign: 'center' },
      columnStyles: { 0: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'right' } },
      theme: 'grid'
    })

    let finalY = doc.lastAutoTable.finalY + 15
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.text(`TOTAL A PAGAR: $${total.toLocaleString('es-CO')}`, 190, finalY, { align: 'right' })

    // --- NOTIFICACIÓN DE PREMIO (NUEVO) ---
    if (puntosExtra.premio) {
      finalY += 10;
      doc.setDrawColor(34, 197, 94); // Color verde para el éxito
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(15, finalY, 180, 10, 2, 2, 'FD');
      
      doc.setFontSize(10);
      doc.setTextColor(21, 128, 61);
      doc.text('¡FELICIDADES! Tienes 10 puntos: Reclama tu Empanada y Tinto GRATIS 🎁☕', 105, finalY + 6.5, { align: 'center' });
      finalY += 5;
    }

    doc.setFontSize(11)
    doc.setFont(undefined, 'italic')
    doc.setTextColor(234, 88, 12)
    doc.text('¡Gracias por preferir MariVama! ✨🥟', 105, finalY + 15, { align: 'center' })

    // --- LÓGICA DE ENVÍO MEJORADA ---
    const fileName = `Cuenta_${cliente.apodo || 'Cliente'}.pdf`
    const pdfBlob = doc.output('blob')
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

    // Mensaje de WhatsApp actualizado con puntos
    let mensajeWhatsApp = `¡Hola ${cliente.apodo}! ✨ Te adjunto el detalle de tu cuenta en *FritosMariVama* recuerda al pagar a tiempo ganas puntos para un premio gratis. Total: *$${total.toLocaleString('es-CO')}*. \n\n🏅 Tienes *${puntosExtra.puntos} puntos* acumulados.`;
    
    if (puntosExtra.premio) {
      mensajeWhatsApp += `\n🎁 ¡YA TIENES UN PREMIO DISPONIBLE! (Empanada + Tinto) gratis 🎁`;
    }

    mensajeWhatsApp += `\n\nMi Nequi es 3026076608. ¡Quedo atenta! 🥟`;

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(mensajeWhatsApp);
        }

        await navigator.share({
          files: [file],
          title: 'Cuenta MariVama',
          text: mensajeWhatsApp 
        })
      } catch (err) {
        console.log("Compartir cancelado")
      }
    } else {
      doc.save(fileName)
    }
    
    return true
  } catch (error) {
    console.error("Error PDF:", error)
    return false
  }
}