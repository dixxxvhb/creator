import jsPDF from 'jspdf';
import type { Dancer, Costume, CostumeAssignment, Piece, CostumeAccessory } from '@/types';

export interface CostumePdfData {
  dancer: Dancer;
  costumes: {
    costume: Costume;
    piece: Piece;
    assignment: CostumeAssignment;
    accessories: CostumeAccessory[];
  }[];
}

export function exportDancerCostumePdf(data: CostumePdfData) {
  const doc = new jsPDF();
  const { dancer, costumes } = data;

  // Title
  doc.setFontSize(18);
  doc.text(`Costume Breakdown: ${dancer.full_name}`, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 28);

  let y = 40;

  for (const { costume, piece, assignment, accessories } of costumes) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // Piece name
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(piece.title, 14, y);
    y += 8;

    // Costume name
    doc.setFontSize(11);
    doc.text(`Costume: ${costume.name}`, 14, y);
    y += 6;

    // Details
    doc.setFontSize(9);
    doc.setTextColor(80);
    if (costume.description) {
      doc.text(`Description: ${costume.description}`, 18, y); y += 5;
    }
    if (costume.color) {
      doc.text(`Color: ${costume.color}`, 18, y); y += 5;
    }
    if (assignment.size) {
      doc.text(`Size: ${assignment.size}`, 18, y); y += 5;
    }
    if (assignment.alteration_notes) {
      doc.text(`Alterations: ${assignment.alteration_notes}`, 18, y); y += 5;
    }
    doc.text(`Status: ${assignment.status}`, 18, y); y += 5;

    if (costume.vendor_url) {
      doc.text(`Vendor: ${costume.vendor_url}`, 18, y); y += 5;
    }

    // Accessories
    if (accessories.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text('Accessories:', 18, y); y += 5;
      doc.setFontSize(9);
      doc.setTextColor(80);
      for (const acc of accessories) {
        const parts: string[] = [acc.accessory_type];
        if (acc.description) parts.push(acc.description);
        if (acc.color) parts.push(`(${acc.color})`);
        doc.text(`  - ${parts.join(' — ')}`, 18, y); y += 5;
      }
    }

    y += 8; // spacing between costumes
  }

  doc.save(`costume-breakdown-${dancer.short_name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/** Export all dancers' costumes as a single PDF */
export function exportAllCostumesPdf(allData: CostumePdfData[]) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('Costume Breakdown — All Dancers', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(128);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 28);

  let y = 40;

  for (const data of allData) {
    if (data.costumes.length === 0) continue;

    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    // Dancer header
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(data.dancer.full_name, 14, y);
    y += 8;

    for (const { costume, piece, assignment, accessories } of data.costumes) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`${piece.title} — ${costume.name}`, 18, y); y += 5;

      doc.setFontSize(9);
      doc.setTextColor(80);
      const details: string[] = [];
      if (assignment.size) details.push(`Size: ${assignment.size}`);
      if (costume.color) details.push(`Color: ${costume.color}`);
      details.push(`Status: ${assignment.status}`);
      doc.text(details.join('  |  '), 22, y); y += 5;

      if (assignment.alteration_notes) {
        doc.text(`Alterations: ${assignment.alteration_notes}`, 22, y); y += 5;
      }

      for (const acc of accessories) {
        doc.text(`  + ${acc.accessory_type}: ${acc.description || '(no description)'}`, 22, y); y += 5;
      }

      y += 3;
    }

    y += 5;
  }

  doc.save('costume-breakdown-all-dancers.pdf');
}
