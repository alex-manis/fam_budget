import type { SystemCategoryName } from '../classification.types.js';

export interface RuleDefinition {
  /** Descriptive name used in logs and explanation strings */
  name: string;
  /**
   * Case-insensitive substrings matched against the concatenated
   * description + merchant string. First pattern hit wins.
   */
  patterns: string[];
  categoryName: SystemCategoryName;
  isEssential: boolean;
  isRecurring: boolean;
  /** Confidence emitted when this rule matches (0.0 – 1.0) */
  confidence: number;
}

/**
 * Ordered rule list for Israeli transactions.
 * More specific rules (unique brand names) appear before generic keywords
 * to reduce false positives. Confidence ≥ 0.85 skips AI fallback.
 *
 * Patterns include both transliterated English (as printed on bank statements)
 * and Hebrew text (for banks that export native Hebrew descriptions).
 */
export const ISRAELI_RULES: RuleDefinition[] = [
  // ── Fuel ──────────────────────────────────────────────────────────────────
  {
    name: 'PAZ fuel station',
    patterns: ['paz ', 'פז ', 'paz-', 'paz/'],
    categoryName: 'Fuel',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Sonol fuel station',
    patterns: ['sonol', 'סונול'],
    categoryName: 'Fuel',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Delek fuel station',
    patterns: ['delek', 'דלק'],
    categoryName: 'Fuel',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'TEN fuel station',
    patterns: ['ten gas', 'ten fuel', 'תן גז'],
    categoryName: 'Fuel',
    isEssential: true,
    isRecurring: false,
    confidence: 0.92,
  },
  {
    name: 'Yellow fuel network',
    patterns: ['yellow '],
    categoryName: 'Fuel',
    isEssential: true,
    isRecurring: false,
    confidence: 0.90,
  },

  // ── Groceries ─────────────────────────────────────────────────────────────
  {
    name: 'Shufersal supermarket',
    patterns: ['shufersal', 'שופרסל'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Rami Levy supermarket',
    patterns: ['rami levy', 'רמי לוי'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Victory supermarket',
    patterns: ['victory', 'ויקטורי'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Yochananof supermarket',
    patterns: ['yochananof', 'יוחננוף'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Mega supermarket',
    patterns: ['mega ', 'מגה '],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.90,
  },
  {
    name: 'Tiv Taam supermarket',
    patterns: ['tiv taam', 'טיב טעם'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'AM:PM convenience store',
    patterns: ['am:pm', 'ampm'],
    categoryName: 'Groceries',
    isEssential: true,
    isRecurring: false,
    confidence: 0.88,
  },

  // ── Telecom ───────────────────────────────────────────────────────────────
  {
    name: 'Cellcom mobile',
    patterns: ['cellcom', 'סלקום'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Partner mobile',
    patterns: ['partner ', 'פרטנר'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'HOT broadband/cable',
    patterns: ['hot.net', 'hot mobile', 'hot vision', 'הוט'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Bezeq landline',
    patterns: ['bezeq', 'בזק'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Golan Telecom',
    patterns: ['golan telecom', 'גולן טלקום'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: '012 Smile ISP',
    patterns: ['012 smile', '012.net'],
    categoryName: 'Telecom',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },

  // ── Transport ─────────────────────────────────────────────────────────────
  {
    name: 'Rav Kav public transit',
    patterns: ['rav kav', 'רב קו', 'ravkav'],
    categoryName: 'Transport',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Egged bus',
    patterns: ['egged', 'אגד'],
    categoryName: 'Transport',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Dan bus',
    patterns: [' dan ', 'דן אוטובוס'],
    categoryName: 'Transport',
    isEssential: true,
    isRecurring: false,
    confidence: 0.90,
  },
  {
    name: 'Israel Railways',
    patterns: ['rakevet', 'רכבת ישראל', 'israel rail'],
    categoryName: 'Transport',
    isEssential: true,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Gett taxi',
    patterns: ['gett'],
    categoryName: 'Transport',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Uber ride',
    patterns: ['uber'],
    categoryName: 'Transport',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Bolt ride',
    patterns: ['bolt ride', 'bolt.eu'],
    categoryName: 'Transport',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },

  // ── Rent ──────────────────────────────────────────────────────────────────
  {
    name: 'Rent payment (Hebrew)',
    patterns: ['שכירות', 'שכ"ד', 'שכד', 'דמי שכירות'],
    categoryName: 'Rent',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Rent payment (English)',
    patterns: ['house rent', 'apartment rent', ' rent '],
    categoryName: 'Rent',
    isEssential: true,
    isRecurring: true,
    confidence: 0.88,
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  {
    name: 'Israel Electric Corporation',
    patterns: ['חברת החשמל', 'electric corp', 'iec ', 'hashmal'],
    categoryName: 'Utilities',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Hagihon water',
    patterns: ['hagihon', 'הגיחון'],
    categoryName: 'Utilities',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Mei Avivim water',
    patterns: ['mei avivim', 'מי אביבים'],
    categoryName: 'Utilities',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Municipal tax (Arnona)',
    patterns: ['arnona', 'ארנונה'],
    categoryName: 'Utilities',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Natural gas',
    patterns: ['gas natural', 'גז טבעי', 'פזגז', 'pazgaz'],
    categoryName: 'Utilities',
    isEssential: true,
    isRecurring: true,
    confidence: 0.92,
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  {
    name: 'Maccabi HMO',
    patterns: ['maccabi', 'מכבי'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Clalit HMO',
    patterns: ['clalit', 'כללית'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Meuhedet HMO',
    patterns: ['meuhedet', 'מאוחדת'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Leumit HMO',
    patterns: ['leumit', 'לאומית'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: true,
    confidence: 0.93,
  },
  {
    name: 'Super-Pharm pharmacy',
    patterns: ['super-pharm', 'superpharm', 'super pharm', 'סופר פארם'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: false,
    confidence: 0.90,
  },
  {
    name: 'Be Pharm pharmacy',
    patterns: ['be pharm', 'be-pharm'],
    categoryName: 'Healthcare',
    isEssential: true,
    isRecurring: false,
    confidence: 0.90,
  },

  // ── Restaurants ───────────────────────────────────────────────────────────
  {
    name: "McDonald's",
    patterns: ["mcdonald", 'מקדונלד'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Burger King',
    patterns: ['burger king', 'בורגר קינג'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Aroma Espresso Bar',
    patterns: ['aroma ', 'ארומה'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Cafe Cafe',
    patterns: ['cafe cafe', 'קפה קפה'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Pizza Hut',
    patterns: ['pizza hut', 'פיצה האט'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: "Domino's Pizza",
    patterns: ["domino's", 'dominos', 'דומינוס'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },
  {
    name: 'Wolt food delivery',
    patterns: ['wolt'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: '10bis food delivery',
    patterns: ['10bis', 'תן ביס'],
    categoryName: 'Restaurants',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },

  // ── Entertainment / Subscriptions ─────────────────────────────────────────
  {
    name: 'Netflix streaming',
    patterns: ['netflix'],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: true,
    confidence: 0.97,
  },
  {
    name: 'Spotify music',
    patterns: ['spotify'],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: true,
    confidence: 0.97,
  },
  {
    name: 'Disney+',
    patterns: ['disney+', 'disneyplus'],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: true,
    confidence: 0.97,
  },
  {
    name: 'Apple services',
    patterns: ['apple.com/bill', 'apple services', 'itunes'],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: true,
    confidence: 0.90,
  },
  {
    name: 'YES satellite TV',
    patterns: ['yes+', 'yes tv', 'yes '],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: true,
    confidence: 0.88,
  },
  {
    name: 'Cinema City',
    patterns: ['cinema city', 'סינמה סיטי'],
    categoryName: 'Entertainment',
    isEssential: false,
    isRecurring: false,
    confidence: 0.95,
  },

  // ── Insurance ─────────────────────────────────────────────────────────────
  {
    name: 'Insurance payment (Hebrew)',
    patterns: ['ביטוח', 'פוליסה'],
    categoryName: 'Insurance',
    isEssential: true,
    isRecurring: true,
    confidence: 0.88,
  },
  {
    name: 'Clal Insurance',
    patterns: ['clal insurance', 'כלל ביטוח'],
    categoryName: 'Insurance',
    isEssential: true,
    isRecurring: true,
    confidence: 0.95,
  },
  {
    name: 'Harel Insurance',
    patterns: ['harel', 'הראל'],
    categoryName: 'Insurance',
    isEssential: true,
    isRecurring: true,
    confidence: 0.90,
  },
  {
    name: 'Phoenix Insurance',
    patterns: ['phoenix', 'הפניקס'],
    categoryName: 'Insurance',
    isEssential: true,
    isRecurring: true,
    confidence: 0.90,
  },
  {
    name: 'Migdal Insurance',
    patterns: ['migdal', 'מגדל'],
    categoryName: 'Insurance',
    isEssential: true,
    isRecurring: true,
    confidence: 0.90,
  },

  // ── Shopping ──────────────────────────────────────────────────────────────
  {
    name: 'H&M clothing',
    patterns: ['h&m', 'h & m'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Zara clothing',
    patterns: ['zara'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Castro clothing',
    patterns: ['castro', 'קסטרו'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Kravitz electronics',
    patterns: ['kravitz', 'קרביץ'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
  {
    name: 'Amazon online',
    patterns: ['amazon'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.88,
  },
  {
    name: 'AliExpress online',
    patterns: ['aliexpress', 'ali express'],
    categoryName: 'Shopping',
    isEssential: false,
    isRecurring: false,
    confidence: 0.93,
  },
];
