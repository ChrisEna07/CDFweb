import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generarPDFCobro = async (cliente, deudas = []) => {
  try {
    if (!deudas || deudas.length === 0) return false;

    const doc = new jsPDF()
    const fechaHoy = new Date().toLocaleDateString('es-CO')
    
    // Cálculo de total asegurando que sean números
    const total = deudas.reduce((acc, d) => acc + (Number(d.monto_total) || 0), 0)

    // --- LOGO (Esquina superior izquierda) ---
    try {
      // x: 15, y: 10, ancho: 25, alto: 25
      doc.addImage('/logo-marivama.png', 'PNG', 15, 10, 25, 25, undefined, 'FAST')
    } catch (e) { 
      console.log("Logo no encontrado, continuando sin imagen") 
    }

    // --- ENCABEZADO ---
    doc.setFontSize(22)
    doc.setTextColor(234, 88, 12) // Naranja MariVama
    doc.setFont(undefined, 'bold')
    doc.text('MARIVAMA', 45, 22)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont(undefined, 'normal')
    doc.text('FRITOS & EMPANADAS', 45, 28)
    doc.text(`Fecha de cobro: ${fechaHoy}`, 45, 33)

    // Línea divisoria decorativa
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

    // --- MAPEO DE FILAS (Blindado contra nulos) ---
    const filas = deudas.map(d => {
      // Si created_at falla, usa la fecha actual como respaldo
      const fechaBase = d.created_at ? new Date(d.created_at) : new Date();
      const fechaFormateada = fechaBase.toLocaleDateString('es-CO', { 
        day: '2-digit', 
        month: '2-digit' 
      });

      return [
        fechaFormateada,
        d.productos?.nombre || 'Consumo MariVama', // Si no hay nombre de producto
        d.cantidad || 1,
        `$${(Number(d.monto_total) || 0).toLocaleString('es-CO')}`
      ];
    });

    // --- TABLA DE PRODUCTOS ---
    autoTable(doc, {
      startY: 60,
      head: [['Fecha', 'Detalle', 'Cant.', 'Subtotal']],
      body: filas,
      headStyles: { 
        fillColor: [234, 88, 12], 
        fontSize: 10, 
        halign: 'center',
        fontStyle: 'bold'
      },
      bodyStyles: { 
        fontSize: 10,
        textColor: 50 
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 40 }
      },
      margin: { left: 15, right: 15 },
      theme: 'grid'
    })

    // --- RESUMEN FINAL ---
    const finalY = doc.lastAutoTable.finalY + 15
    
    // Rectángulo de total opcional para resaltar
    doc.setDrawColor(234, 88, 12)
    doc.setFillColor(250, 240, 230) // Fondo crema suave
    doc.rect(130, finalY - 8, 65, 12, 'F')
    
    doc.setFontSize(14)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(0)
    doc.text(`TOTAL A PAGAR: $${total.toLocaleString('es-CO')}`, 190, finalY, { align: 'right' })

    // Mensaje de despedida
    doc.setFontSize(11)
    doc.setFont(undefined, 'italic')
    doc.setTextColor(234, 88, 12)
    doc.text('¡Gracias por preferir MariVama! ✨🥟', 105, finalY + 20, { align: 'center' })

    // --- PROCESO DE ENVÍO / COMPARTIR ---
    const fileName = `Cuenta_${cliente.apodo || 'Cliente'}.pdf`
    const pdfBlob = doc.output('blob')
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' })

    // Intentar compartir (Solo funciona en móviles/HTTPS)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Cuenta MariVama',
          text: `Hola ${cliente.apodo}! ✨ Te adjunto el detalle de tu cuenta en MariVama. Quedo atenta.`
        })
      } catch (err) {
        // Si el usuario cancela el compartir, no hacemos nada
        console.log("Compartir cancelado o fallido")
      }
    } else {
      // Descarga automática si no se puede compartir
      doc.save(fileName)
    }
    
    return true
  } catch (error) {
    console.error("Error crítico en generación de PDF:", error)
    return false
  }
}