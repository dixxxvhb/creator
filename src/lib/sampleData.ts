import * as piecesService from '@/services/pieces';
import * as formationsService from '@/services/formations';
import * as positionsService from '@/services/dancerPositions';
import * as pathsService from '@/services/dancerPaths';
import * as songSectionsService from '@/services/songSections';
import { applyTemplate } from '@/lib/formationTemplates';
import type { Piece, Formation } from '@/types';

const DANCERS = 8;

/**
 * Builds a fully fleshed-out demo piece so a brand-new teacher sees the
 * canvas working in seconds: 8 dancers, three formations from the real
 * template engine, one drawn travel path, and three music cues.
 *
 * Deliberately creates NO roster dancers (positions use labels only) —
 * fake people would outlive the demo, since the roster doesn't cascade
 * from piece deletion. The whole piece deletes like any other.
 */
export async function createSamplePiece(stageWidth: number, stageDepth: number): Promise<Piece> {
  const piece = await piecesService.createPiece({
    title: 'Sample Piece',
    song_title: null,
    song_artist: null,
    style: 'Contemporary',
    group_size: 'small_group',
    dancer_count: DANCERS,
    bpm: 120,
    duration_seconds: 180,
    audio_url: null,
    stage_width: stageWidth,
    stage_depth: stageDepth,
    notes:
      'This sample shows how a piece comes together. Drag dancers around, play the transition, and poke through the tabs. Delete it whenever you like and start your own.',
    sort_order: 0,
    choreographer: null,
    focal_dancer_id: null,
  });

  const formationSpecs = [
    {
      label: 'Opening Line',
      template: 'line',
      choreo: 'Dancers hold the opening line, then travel into the diamond.',
      counts: 'Hold 1-8, travel on 1-4.',
    },
    {
      label: 'Diamond',
      template: 'diamond',
      choreo: 'Hit the diamond together. Dancer A leads the push downstage.',
      counts: 'Arrive by 8, breathe on 1-2.',
    },
    {
      label: 'Finale V',
      template: 'v-formation',
      choreo: 'Open into the V for the final picture.',
      counts: 'Last 8 counts, hold the ending.',
    },
  ];

  const formations: Formation[] = [];
  for (const [i, spec] of formationSpecs.entries()) {
    const formation = await formationsService.createFormation({
      piece_id: piece.id,
      index: i,
      label: spec.label,
      timestamp_seconds: null,
      choreo_notes: spec.choreo,
      counts_notes: spec.counts,
      transition_duration_ms: 2000,
      transition_easing: 'ease-in-out',
    });
    formations.push(formation);
  }

  // Real geometry from the template engine, saved per formation in parallel.
  const positionInserts = formationSpecs.map((spec, i) =>
    applyTemplate(spec.template, DANCERS, stageWidth, stageDepth, formations[i].id)
  );
  await Promise.all(
    formations.map((formation, i) => positionsService.upsertPositions(formation.id, positionInserts[i]))
  );

  // One travel path for dancer A on the first transition, so the thumbnail
  // strip shows a path pill out of the box. Paths attach to the SOURCE
  // formation.
  const fromA = positionInserts[0].find((p) => p.dancer_label === 'A');
  const toA = positionInserts[1].find((p) => p.dancer_label === 'A');
  if (fromA && toA) {
    const mid = {
      x: (fromA.x + toA.x) / 2,
      y: (fromA.y + toA.y) / 2 - stageDepth * 0.08,
    };
    await pathsService.upsertPath(
      formations[0].id,
      'A',
      [{ x: fromA.x, y: fromA.y }, mid, { x: toA.x, y: toA.y }],
      'freehand'
    );
  }

  // Three music cues across the 180s song, each linked to a formation.
  const cues = [
    { label: 'Intro', section_type: 'Intro' as const, start: 0, end: 20, formationIdx: 0 },
    { label: 'Verse', section_type: 'Verse' as const, start: 20, end: 75, formationIdx: 1 },
    { label: 'Chorus', section_type: 'Chorus' as const, start: 75, end: 120, formationIdx: 2 },
  ];
  for (const [i, cue] of cues.entries()) {
    await songSectionsService.createSongSection({
      piece_id: piece.id,
      label: cue.label,
      section_type: cue.section_type,
      start_seconds: cue.start,
      end_seconds: cue.end,
      formation_id: formations[cue.formationIdx].id,
      sort_order: i,
    });
  }

  return piece;
}
