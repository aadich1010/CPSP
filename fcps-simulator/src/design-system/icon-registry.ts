/**
 * icon-registry.ts
 * -----------------------------------------------------------------------------
 * The ONLY place lucide-react may be imported.
 *
 * Why a registry instead of importing icons at each call site:
 *   1. Icons become semantic ("questionBank") not visual ("BookOpen"). Swapping
 *      the glyph later is a one-line change here, not a repo-wide find/replace.
 *   2. It gives the audit script a closed vocabulary to validate against.
 *   3. Named imports keep tree-shaking intact — do NOT switch this to
 *      `import * as Lucide` for convenience; that ships the whole library.
 *
 * If your lucide-react version is missing one of these exports, the build will
 * fail loudly at that line. Swap the glyph, keep the key.
 */

import {
  Activity, AlertCircle, ArrowRight, ArrowUpRight, Award,
  Bot, Inbox, Landmark, Phone, Printer, Smartphone,
  BarChart3, Bell, Bookmark, BookOpen, Brain,
  Calendar, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp,
  ClipboardList, Clock, CreditCard, Crown,
  Dna, Download, Eye, EyeOff,
  FileText, Filter, Flame, Folder,
  Gem, GraduationCap,
  Heart, HelpCircle,
  Info, Layers, LayoutDashboard, LayoutGrid, LineChart, ListChecks, Lock, LogIn, LogOut,
  Mail, Medal, Menu, Microscope, Minus, MoreHorizontal,
  Pause, Pencil, Percent, Pill, Play, Plus,
  Receipt, RotateCcw,
  Search, Settings, Share2, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Star, Stethoscope, Syringe,
  Target, Timer, Trash2, TrendingDown, TrendingUp, Trophy,
  Unlock, Upload, User, Users,
  Wallet, X, XCircle, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Semantic name -> Lucide component. Keys are the app's icon vocabulary. */
export const ICON_REGISTRY = Object.freeze({
  // --- navigation ----------------------------------------------------------
  dashboard: LayoutDashboard,
  questionBank: BookOpen,
  mockExam: ClipboardList,
  practice: Pencil,
  flashcards: Layers,
  subjects: LayoutGrid,
  notes: FileText,
  bookmarks: Bookmark,
  analytics: BarChart3,
  leaderboard: Trophy,
  schedule: Calendar,
  library: Folder,
  billing: CreditCard,
  invoices: Receipt,
  wallet: Wallet,
  settings: Settings,
  help: HelpCircle,
  profile: User,
  community: Users,
  notifications: Bell,
  messages: Mail,
  logout: LogOut,
  login: LogIn,

  // --- metrics -------------------------------------------------------------
  attempted: ListChecks,
  correct: CheckCircle2,
  incorrect: XCircle,
  accuracy: Target,
  score: Percent,
  streak: Flame,
  timeSpent: Clock,
  timer: Timer,
  progress: LineChart,
  trendUp: TrendingUp,
  trendDown: TrendingDown,
  rank: Medal,
  achievement: Award,
  activity: Activity,

  // --- clinical subjects ---------------------------------------------------
  medicine: Stethoscope,
  neurology: Brain,
  pathology: Microscope,
  pharmacology: Pill,
  anatomy: Dna,
  physiology: Heart,
  surgery: Syringe,
  graduation: GraduationCap,

  // --- actions -------------------------------------------------------------
  start: Play,
  pause: Pause,
  resume: RotateCcw,
  retry: RotateCcw,
  review: Eye,
  hide: EyeOff,
  search: Search,
  filter: Filter,
  sort: SlidersHorizontal,
  add: Plus,
  remove: Minus,
  edit: Pencil,
  delete: Trash2,
  download: Download,
  upload: Upload,
  share: Share2,
  more: MoreHorizontal,
  close: X,
  menu: Menu,

  // --- status / premium ----------------------------------------------------
  premium: Crown,
  vvip: Gem,
  upgrade: Sparkles,
  locked: Lock,
  unlocked: Unlock,
  verified: ShieldCheck,
  secure: Shield,
  info: Info,
  warning: AlertCircle,
  bolt: Zap,
  star: Star,

  // --- payment / support (added for the emoji migration) -------------------
  ai: Bot,
  mobilePay: Smartphone,
  bank: Landmark,
  support: Phone,
  print: Printer,
  empty: Inbox,

  // --- directional ---------------------------------------------------------
  next: ChevronRight,
  previous: ChevronLeft,
  expand: ChevronDown,
  collapse: ChevronUp,
  go: ArrowRight,
  external: ArrowUpRight,
});

/** Union of every valid icon name. A typo at a call site is a type error. */
export type IconName = keyof typeof ICON_REGISTRY;

export const ICON_NAMES = Object.freeze(Object.keys(ICON_REGISTRY)) as readonly IconName[];

/** Rendered when a name is missing, so a typo degrades instead of crashing. */
export const FALLBACK_ICON: LucideIcon = HelpCircle;

/** Design-system size scale. Never pass arbitrary pixel values from call sites. */
export const ICON_SIZES = Object.freeze({ xs: 14, sm: 16, md: 20, lg: 24, xl: 28 });

export type IconSize = keyof typeof ICON_SIZES;

/**
 * Optical correction: thin strokes disappear at small sizes and look heavy at
 * large ones. Stroke width scales inversely with the glyph.
 */
export const STROKE_FOR_SIZE: Readonly<Record<number, number>> =
  Object.freeze({ 14: 2, 16: 1.9, 20: 1.75, 24: 1.6, 28: 1.5 });

export default ICON_REGISTRY;
