import jsPDF from 'jspdf';

interface ProgramAct {
  actNumber: number;
  title: string;
  style: string | null;
  dancerCount: number;
  songTitle: string | null;
  songArtist: string | null;
  intermissionBefore: boolean;
  dancerNames?: string[];
  choreographer?: string | null;
}

interface ProgramOptions {
  showName: string;
  date: string | null;
  venue: string;
  acts: ProgramAct[];
  studioName?: string;
}

export function generateProgramPDF(options: ProgramOptions): void {
  const { showName, date, venue, acts, studioName } = options;
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ── Header ──────────────────────────────────────────────────────────────────

  // Show name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  const nameLines = doc.splitTextToSize(showName, contentWidth);
  doc.text(nameLines, pageWidth / 2, y, { align: 'center' });
  y += nameLines.length * 28;

  // Date and venue line
  const subParts: string[] = [];
  if (date) {
    const parsed = new Date(date + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      const formatted = parsed.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      subParts.push(formatted);
    } else {
      subParts.push('Date TBD');
    }
  }
  if (venue) subParts.push(venue);

  if (subParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(subParts.join('  |  '), pageWidth / 2, y, { align: 'center' });
    y += 18;
  }

  // Divider under header
  y += 10;
  doc.setDrawColor(180);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  // ── Program heading ─────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Program', pageWidth / 2, y, { align: 'center' });
  y += 24;

  // ── Act entries ─────────────────────────────────────────────────────────────

  const lineHeight = 16;
  const subLineHeight = 14;

  for (const act of acts) {
    // Check if we need a new page (leave room for footer)
    let extraLines = 0;
    if (act.choreographer) extraLines++;
    if (act.dancerNames && act.dancerNames.length > 0) extraLines++;
    const neededSpace = (act.intermissionBefore ? lineHeight * 3 + 20 : lineHeight * 2 + 8) + extraLines * subLineHeight;
    if (y + neededSpace > pageHeight - 60) {
      addFooter(doc, pageWidth, pageHeight, margin, studioName);
      doc.addPage();
      y = margin;
    }

    // Intermission marker
    if (act.intermissionBefore) {
      y += 8;
      doc.setDrawColor(160);
      doc.setLineWidth(0.5);
      const intermText = 'INTERMISSION';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const textWidth = doc.getTextWidth(intermText);
      const gapPad = 8;
      const lineLeft = margin;
      const lineRight = pageWidth - margin;
      const textX = pageWidth / 2 - textWidth / 2;

      doc.line(lineLeft, y, textX - gapPad, y);
      doc.line(textX + textWidth + gapPad, y, lineRight, y);
      doc.text(intermText, pageWidth / 2, y + 3, { align: 'center' });
      y += 20;
    }

    // Act number + title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const actLabel = `${act.actNumber}.`;
    doc.text(actLabel, margin, y);

    const labelWidth = doc.getTextWidth(actLabel) + 6;
    let titleLine = act.title;
    if (act.style) titleLine += `  —  ${act.style}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const titleLines = doc.splitTextToSize(titleLine, contentWidth - labelWidth);
    doc.text(titleLines, margin + labelWidth, y);
    y += titleLines.length * lineHeight;

    // Song info
    if (act.songTitle || act.songArtist) {
      const songParts: string[] = [];
      if (act.songTitle) songParts.push(`"${act.songTitle}"`);
      if (act.songArtist) songParts.push(`by ${act.songArtist}`);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(songParts.join(' '), margin + labelWidth, y);
      doc.setTextColor(0);
      y += subLineHeight;
    }

    // Choreographer
    if (act.choreographer) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`Choreography by ${act.choreographer}`, margin + labelWidth, y);
      doc.setTextColor(0);
      y += subLineHeight;
    }

    // Dancer names
    if (act.dancerNames && act.dancerNames.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140);
      const dancerText = `Dancers: ${act.dancerNames.join(', ')}`;
      const dancerLines = doc.splitTextToSize(dancerText, contentWidth - labelWidth);
      doc.text(dancerLines, margin + labelWidth, y);
      doc.setTextColor(0);
      y += dancerLines.length * (subLineHeight - 2);
    }

    y += 6;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────

  addFooter(doc, pageWidth, pageHeight, margin, studioName);

  // ── Save ────────────────────────────────────────────────────────────────────

  const safeName = showName.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase();
  doc.save(`${safeName}-program.pdf`);
}

function addFooter(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margin: number,
  studioName?: string,
): void {
  const footerY = pageHeight - 30;

  doc.setDrawColor(200);
  doc.setLineWidth(0.25);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140);

  if (studioName) {
    doc.text(studioName, margin, footerY);
  }

  doc.text('Generated with Creator', pageWidth - margin, footerY, { align: 'right' });
  doc.setTextColor(0);
}
