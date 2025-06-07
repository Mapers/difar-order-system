// utils/generateReport.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Documento {
  Fecha_Emision: string;
  Fecha_Vcto: string;
  Tipo_Doc: string;
  Abre_Doc: string;
  SerieDoc: string;
  NumeroDoc: number;
  Tipo_Moneda: string;
  Simb_Moneda: string;
  saldoDoc: string;
}

interface Head {
  Nombre: string;
  NombreComercial: string;
}

interface ClienteDocumentos {
  head: Head;
  boddy: Documento[];
}

interface ReporteData {
  CodVend: string;
  nomVend: string;
  document_dislab: ClienteDocumentos[];
}

export const generateReport = (data: ReporteData) => {
  const doc = new jsPDF();
  let currentY = 10;

  doc.setFontSize(16);
  doc.text("Reporte de Documentos por Cliente", 14, currentY);
  currentY += 10;

  data.document_dislab.forEach((cliente, index) => {
    const { Nombre, NombreComercial } = cliente.head;
    const clienteTitle = `${NombreComercial} (${Nombre})`;

    doc.setFontSize(12);
    doc.text(clienteTitle, 14, currentY);
    currentY += 6;

    const rows = cliente.boddy.map((docu) => [
      docu.Fecha_Emision,
      docu.Fecha_Vcto,
      docu.Abre_Doc,
      `${docu.SerieDoc}-${docu.NumeroDoc}`,
      `${docu.Simb_Moneda} ${docu.saldoDoc}`,
    ]);

    autoTable(doc, {
      head: [["Emisión", "Vcto", "Doc", "Nro Doc", "Saldo"]],
      body: rows,
      startY: currentY,
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
      theme: "grid",
    });

    currentY = doc.lastAutoTable?.finalY! + 10;
  });

  // Abrir el PDF en una nueva pestaña
  window.open(doc.output("bloburl"), "_blank");
};
