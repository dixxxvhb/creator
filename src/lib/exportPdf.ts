import { jsPDF } from 'jspdf';
import type { Formation, DancerPosition, Piece } from '@/types';

interface ExportPdfOptions {
  piece: Piece;
  formations: Formation[];
  positions: Record<string, DancerPosition[]>;
  stageImages: (string | null)[]; // data URLs per formation
}

const MARGIN = 20;
const PAGE_W = 595.28; // A4 points
const PAGE_H = 841.89;
const CONTENT_W = PAGE_W - MARGIN * 2;

/**
 * Generate a PDF with one page per formation:
 * - Stage diagram image
 * - Dancer list
 * - Choreo notes + counts
 */
export function exportPdf({ piece, formations, positions, stageImages }: ExportPdfOptions): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const filename = sanitizeFilename(piece.title);

  // Title page
  doc.setFontSize(24);
  doc.text(piece.title, PAGE_W / 2, 120, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(120);
  const meta: string[] = [];
  if (piece.style) meta.push(piece.style);
  meta.push(`${piece.dancer_count} dancer${piece.dancer_count !== 1 ? 's' : ''}`);
  if (piece.song_title || piece.song_artist) {
    meta.push([piece.song_title, piece.song_artist].filter(Boolean).join(' — '));
  }
  doc.text(meta.join('  |  '), PAGE_W / 2, 150, { align: 'center' });

  doc.setTextColor(0);
  doc.setFontSize(10);
  doc.text(`${formations.length} formation${formations.length !== 1 ? 's' : ''}`, PAGE_W / 2, 175, { align: 'center' });

  // One page per formation
  formations.forEach((formation, idx) => {
    doc.addPage();
    let y = MARGIN;

    // Formation header
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(formation.label || `Formation ${idx + 1}`, MARGIN, y + 16);
    y += 30;

    // Timestamp if set
    if (formation.timestamp_seconds !== null) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      const m = Math.floor(formation.timestamp_seconds / 60);
      const s = Math.floor(formation.timestamp_seconds % 60);
      doc.text(`Timestamp: ${m}:${s.toString().padStart(2, '0')}`, MARGIN, y);
      y += 14;
    }

    // Stage image
    const img = stageImages[idx];
    if (img) {
      const imgH = CONTENT_W * 0.6; // 3:5 aspect
      try {
        doc.addImage(img, 'PNG', MARGIN, y, CONTENT_W, imgH);
        y += imgH + 10;
      } catch {
        // Skip if image fails
        y += 10;
      }
    }

    // Dancer positions
    const formPositions = positions[formation.id] ?? [];
    if (formPositions.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Dancers', MARGIN, y + 12);
      y += 20;

      doc.setFontSize(9);
      doc.setTextColor(60);
      formPositions.forEach((pos) => {
        if (y > PAGE_H - MARGIN - 20) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(
          `${pos.dancer_label}  —  (${Math.round(pos.x)}, ${Math.round(pos.y)})`,
          MARGIN + 10,
          y
        );
        y += 14;
      });
    }

    // Choreo notes
    if (formation.choreo_notes) {
      y += 10;
      if (y > PAGE_H - MARGIN - 60) {
        doc.addPage();
        y = MARGIN;
      }
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Choreography Notes', MARGIN, y + 12);
      y += 20;
      doc.setFontSize(9);
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(formation.choreo_notes, CONTENT_W - 20);
      doc.text(lines, MARGIN + 10, y);
      y += lines.length * 12;
    }

    // Counts notes
    if (formation.counts_notes) {
      y += 10;
      if (y > PAGE_H - MARGIN - 60) {
        doc.addPage();
        y = MARGIN;
      }
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Counts & Timing', MARGIN, y + 12);
      y += 20;
      doc.setFontSize(9);
      doc.setTextColor(60);
      const lines = doc.splitTextToSize(formation.counts_notes, CONTENT_W - 20);
      doc.text(lines, MARGIN + 10, y);
    }
  });

  doc.save(`${filename}.pdf`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_');
}
