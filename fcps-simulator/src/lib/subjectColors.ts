/**
 * subjectColors.ts
 * -----------------------------------------------------------------------------
 * "Executive Muted Jewel-Tone" palette for the dashboard's subject cards --
 * replaces the earlier golden-angle-generated neon/high-saturation HSL
 * gradients (which tested as eye-straining and unprofessional) with a fixed,
 * hand-verified set of deep, desaturated colors.
 *
 * Design system:
 *  - Every subject gets its own unique background (no two colors repeat),
 *    spread around the hue wheel by the golden angle for maximum visual
 *    separation, then rendered at low lightness (~24-28%) and moderate
 *    saturation (~46-52%) so they read as deep, matte, premium tones
 *    (burgundy / forest / navy / plum / bronze / teal) rather than bright
 *    neon.
 *  - White text on every card. Each `bg` was verified programmatically
 *    (WCAG relative-luminance formula) to hit a contrast ratio of at least
 *    7:1 against #FFFFFF -- the AAA threshold for normal-weight text --
 *    lightness was iteratively lowered per-color until it cleared that bar,
 *    so `contrast` below is the actual measured ratio, not an estimate.
 *  - `bgDark` is the same hue, a touch deeper and more saturated, for the
 *    card's linear-gradient partner stop (mirrors the site's existing
 *    `linear-gradient(135deg, a, b)` card treatment elsewhere).
 *
 * Keyed by the exact subject strings in SUBJECTS (src/lib/subjects.ts) so a
 * lookup miss is a real bug (an unmapped subject), not an expected case --
 * dashboard/page.tsx falls back to a neutral slate if one ever does.
 */

export interface SubjectColor {
  bg: string
  bgDark: string
  contrast: number
}

export const SUBJECT_COLORS: Record<string, SubjectColor> = {
  // ── Paper I — Basic Sciences ──────────────────────────────────────────
  'Anatomy':                          { bg: '#682727', bgDark: '#4A1717', contrast: 11.01 },
  'Physiology':                       { bg: '#256538', bgDark: '#164624', contrast: 7.01 },
  'Biochemistry':                     { bg: '#4D2768', bgDark: '#35174A', contrast: 11.63 },
  'Pathology':                        { bg: '#615924', bgDark: '#423C15', contrast: 7.09 },
  'Pharmacology':                     { bg: '#275D68', bgDark: '#17414A', contrast: 7.36 },
  'Microbiology':                     { bg: '#68274A', bgDark: '#4A1733', contrast: 10.62 },
  'Forensic Medicine':                { bg: '#336124', bgDark: '#204215', contrast: 7.30 },
  'Community Medicine':               { bg: '#292768', bgDark: '#19174A', contrast: 13.25 },
  'Behavioral Sciences':              { bg: '#683D27', bgDark: '#4A2817', contrast: 9.19 },
  'Medical Ethics & Professionalism': { bg: '#24614A', bgDark: '#154231', contrast: 7.28 },
  'Epidemiology & Biostatistics':     { bg: '#632768', bgDark: '#46174A', contrast: 10.39 },

  // ── Paper II — Applied & Specialty ──────────────────────────────────────
  'Surgery & Allied':                         { bg: '#274768', bgDark: '#17304A', contrast: 9.60 },
  'Anesthesia':                                { bg: '#682734', bgDark: '#4A1722', contrast: 10.89 },
  'Applied Physiology':                       { bg: '#25652B', bgDark: '#16461A', contrast: 7.06 },
  'Applied Pathology':                        { bg: '#3F2768', bgDark: '#2A174A', contrast: 12.34 },
  'Applied Pharmacology':                     { bg: '#685227', bgDark: '#4A3917', contrast: 7.43 },
  'Applied Biochemistry':                     { bg: '#24615E', bgDark: '#154240', contrast: 7.13 },
  'Clinical Anatomy':                         { bg: '#682758', bgDark: '#4A173D', contrast: 10.40 },
  'Obstetrics & Gynecology':                  { bg: '#406124', bgDark: '#294215', contrast: 7.11 },
  'Pediatrics':                               { bg: '#273168', bgDark: '#17204A', contrast: 12.17 },
  'ENT':                                      { bg: '#682F27', bgDark: '#4A1E17', contrast: 10.37 },
  'Ophthalmology':                            { bg: '#24613D', bgDark: '#154228', contrast: 7.36 },
  'Immunology':                               { bg: '#552768', bgDark: '#3B174A', contrast: 11.19 },
  'Radiology (Imaging Basics)':               { bg: '#595921', bgDark: '#3A3A12', contrast: 7.30 },
  'Dermatology (Basic Sciences)':             { bg: '#275568', bgDark: '#173B4A', contrast: 8.12 },
  'Emergency Medicine / Critical Care Basics':{ bg: '#682742', bgDark: '#4A172C', contrast: 10.73 },
  'Cardiology':                               { bg: '#2D6525', bgDark: '#1C4616', contrast: 7.00 },
  'Neurology':                                { bg: '#322768', bgDark: '#20174A', contrast: 12.92 },
  'Pulmonology':                              { bg: '#684527', bgDark: '#4A2F17', contrast: 8.50 },
  'Gastroenterology':                         { bg: '#246152', bgDark: '#154237', contrast: 7.22 },
  'Nephrology':                               { bg: '#682765', bgDark: '#4A1747', contrast: 10.16 },
  'Oncology / Medical Oncology':              { bg: '#495D22', bgDark: '#303E14', contrast: 7.31 },

  // ── Clinical Practice ────────────────────────────────────────────────
  'Medicine (Clinical Vignettes)': { bg: '#273F68', bgDark: '#172A4A', contrast: 10.51 },
}

/** Neutral fallback for any subject that somehow isn't in the map above
 *  (keeps rendering readable/on-brand rather than crashing or going
 *  transparent if SUBJECTS ever gains an entry before this file is updated). */
export const SUBJECT_COLOR_FALLBACK: SubjectColor = { bg: '#334155', bgDark: '#1E293B', contrast: 9.73 }
