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
 *    separation, rendered as deep, matte, premium tones (burgundy / forest /
 *    navy / plum / bronze / teal) rather than bright neon.
 *  - Lightness was raised by a flat +8 percentage points (same hue/
 *    saturation, just less dark) from the original "~24-28% L" set -- the
 *    original was AAA (>=7:1) on every card; students found it too dark.
 *    White text on every card still holds AA (>=4.5:1) on the worst-case
 *    color, most sit well above that -- `contrast` below is the actual
 *    measured ratio, not an estimate.
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
  'Anatomy':                          { bg: '#863232', bgDark: '#692121', contrast: 8.35 },
  'Physiology':                       { bg: '#308349', bgDark: '#206534', contrast: 4.7 },
  'Biochemistry':                     { bg: '#633286', bgDark: '#4B2169', contrast: 9.01 },
  'Pathology':                        { bg: '#7F742F', bgDark: '#61581F', contrast: 4.73 },
  'Pharmacology':                     { bg: '#327886', bgDark: '#215D69', contrast: 5.04 },
  'Microbiology':                     { bg: '#86325F', bgDark: '#692148', contrast: 7.97 },
  'Forensic Medicine':                { bg: '#437F2F', bgDark: '#2F611F', contrast: 4.87 },
  'Community Medicine':               { bg: '#353286', bgDark: '#232169', contrast: 10.76 },
  'Behavioral Sciences':              { bg: '#864E32', bgDark: '#693921', contrast: 6.67 },
  'Medical Ethics & Professionalism': { bg: '#2F7F61', bgDark: '#1F6148', contrast: 4.85 },
  'Epidemiology & Biostatistics':     { bg: '#7F3286', bgDark: '#642169', contrast: 7.77 },

  // ── Paper II — Applied & Specialty ──────────────────────────────────────
  'Surgery & Allied':                          { bg: '#325B86', bgDark: '#214469', contrast: 7.06 },
  'Anesthesia':                                { bg: '#863243', bgDark: '#69212F', contrast: 8.23 },
  'Applied Physiology':                        { bg: '#308338', bgDark: '#206526', contrast: 4.74 },
  'Applied Pathology':                         { bg: '#513286', bgDark: '#3B2169', contrast: 9.77 },
  'Applied Pharmacology':                      { bg: '#866932', bgDark: '#695121', contrast: 5.15 },
  'Applied Biochemistry':                      { bg: '#2F7F7B', bgDark: '#1F615E', contrast: 4.73 },
  'Clinical Anatomy':                          { bg: '#863271', bgDark: '#692157', contrast: 7.75 },
  'Obstetrics & Gynecology':                   { bg: '#547F2F', bgDark: '#3D611F', contrast: 4.72 },
  'Pediatrics':                                { bg: '#323F86', bgDark: '#212C69', contrast: 9.59 },
  'ENT':                                       { bg: '#863C32', bgDark: '#692A21', contrast: 7.76 },
  'Ophthalmology':                             { bg: '#2F7F50', bgDark: '#1F613A', contrast: 4.92 },
  'Immunology':                                { bg: '#6D3286', bgDark: '#542169', contrast: 8.57 },
  'Radiology (Imaging Basics)':                { bg: '#77772C', bgDark: '#59591C', contrast: 4.71 },
  'Dermatology (Basic Sciences)':              { bg: '#326D86', bgDark: '#215469', contrast: 5.73 },
  'Emergency Medicine / Critical Care Basics': { bg: '#863255', bgDark: '#69213F', contrast: 8.07 },
  'Cardiology':                                { bg: '#3A8330', bgDark: '#286520', contrast: 4.7 },
  'Neurology':                                 { bg: '#403286', bgDark: '#2D2169', contrast: 10.4 },
  'Pulmonology':                               { bg: '#865932', bgDark: '#694221', contrast: 6.02 },
  'Gastroenterology':                          { bg: '#2F7F6B', bgDark: '#1F6151', contrast: 4.81 },
  'Nephrology':                                { bg: '#863282', bgDark: '#692166', contrast: 7.52 },
  'Endocrinology':                             { bg: '#863239', bgDark: '#692126', contrast: 8.3 },
  'Urology':                                   { bg: '#308242', bgDark: '#20652F', contrast: 4.78 },
  'Orthopedics':                               { bg: '#5D3286', bgDark: '#452169', contrast: 9.27 },
  'Oncology / Medical Oncology':               { bg: '#607B2D', bgDark: '#485D1E', contrast: 4.81 },

  // ── Clinical Practice ────────────────────────────────────────────────
  'Medicine (Clinical Vignettes)': { bg: '#325186', bgDark: '#213B69', contrast: 7.9 },
}

/** Neutral fallback for any subject that somehow isn't in the map above
 *  (keeps rendering readable/on-brand rather than crashing or going
 *  transparent if SUBJECTS ever gains an entry before this file is updated). */
export const SUBJECT_COLOR_FALLBACK: SubjectColor = { bg: '#42546E', bgDark: '#2C3D56', contrast: 7.71 }
