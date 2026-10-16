/**
 * Every number the estimator shows a client, and the sum it does with them.
 *
 * Senior freelance rates in USD, checked against 2026 US market rates. Change
 * any of them here and the page follows. Each range is [low, high] dollars;
 * weeks are [low, high].
 */

export type Range = readonly [number, number]

export type SiteType = {
  id: string
  label: string
  description: string
  price: Range
  weeks: Range
  /** What its size is counted in; a one-pager has no size to ask about. */
  unit: "pages" | "screens" | null
}

export const SITE_TYPES: readonly SiteType[] = [
  {
    id: "landing",
    label: "One-page site",
    description: "A single scrolling page: who you are, what you do, how to reach you.",
    price: [2000, 3500],
    weeks: [1, 2],
    unit: null,
  },
  {
    id: "business",
    label: "Small business site",
    description: "A handful of pages built around your services and how customers find you.",
    price: [4000, 7000],
    weeks: [3, 5],
    unit: "pages",
  },
  {
    id: "cms",
    label: "Site you edit yourself",
    description: "Pages, news, team, menus — all yours to change, in an editor shaped around your content.",
    price: [7000, 12000],
    weeks: [5, 8],
    unit: "pages",
  },
  {
    id: "store",
    label: "Online store",
    description: "Products, cart and checkout, with payments, shipping and tax set up properly.",
    price: [9000, 18000],
    weeks: [6, 10],
    unit: "pages",
  },
  {
    id: "app",
    label: "Web app or custom tool",
    description: "Logins, dashboards, your own data — the thing a site builder can't do.",
    price: [15000, 35000],
    weeks: [8, 14],
    unit: "screens",
  },
]

export type Option = { id: string; label: string; price: Range; weeks: Range }

export const SIZES: readonly Option[] = [
  { id: "small", label: "Up to 5", price: [0, 0], weeks: [0, 0] },
  { id: "medium", label: "6 to 12", price: [1500, 3000], weeks: [1, 1] },
  { id: "large", label: "13 to 25", price: [3000, 6000], weeks: [1, 2] },
  { id: "huge", label: "More than 25", price: [6000, 12000], weeks: [2, 4] },
]

export const DESIGNS: readonly (Option & { description: string })[] = [
  {
    id: "ready",
    label: "I have a design",
    description: "Figma files or mockups, ready to build from.",
    price: [0, 0],
    weeks: [0, 0],
  },
  {
    id: "brand",
    label: "Design it around my brand",
    description: "You have a logo and colours; I design the site from them.",
    price: [1500, 3500],
    weeks: [1, 2],
  },
  {
    id: "scratch",
    label: "Brand and design from scratch",
    description: "Logo, type, colour and the site itself, made to fit together.",
    price: [4000, 8000],
    weeks: [2, 3],
  },
]

export type Feature = Option & {
  /** Site types that come with it built in. */
  includedIn?: readonly string[]
}

export const FEATURES: readonly Feature[] = [
  { id: "cms", label: "Edit it yourself (CMS)", price: [2000, 4000], weeks: [1, 1], includedIn: ["cms", "store"] },
  { id: "blog", label: "Blog or news", price: [800, 1800], weeks: [0, 1] },
  { id: "booking", label: "Booking or scheduling", price: [800, 2500], weeks: [0, 1] },
  { id: "payments", label: "Take payments", price: [3000, 7000], weeks: [1, 2], includedIn: ["store"] },
  { id: "accounts", label: "Member logins and accounts", price: [3000, 7000], weeks: [1, 2], includedIn: ["app"] },
  { id: "search", label: "Site search", price: [600, 1500], weeks: [0, 1] },
  { id: "languages", label: "More than one language", price: [2000, 5000], weeks: [1, 2] },
  { id: "integrations", label: "Hook up your tools (CRM, newsletter, calendar)", price: [800, 2500], weeks: [0, 1] },
  { id: "migration", label: "Move content from your old site", price: [1000, 3000], weeks: [0, 1] },
  { id: "motion", label: "Motion, interaction or 3D", price: [4000, 12000], weeks: [1, 2] },
]

/** Need it soon: everything compressed, at a premium for the reshuffled calendar. */
export const RUSH = { price: 1.25, weeks: 0.7 }

export type CarePlan = {
  id: string
  label: string
  monthly: number
  description: string
}

export const CARE_PLANS: readonly CarePlan[] = [
  {
    id: "essentials",
    label: "Essentials",
    monthly: 79,
    description: "Hosting, SSL, domain and DNS, daily backups, uptime monitoring and security updates.",
  },
  {
    id: "care",
    label: "Care",
    monthly: 299,
    description: "Everything in Essentials, plus up to 2 hours a month of edits and fixes, and a quarterly check-in.",
  },
  {
    id: "partner",
    label: "Partner",
    monthly: 899,
    description: "Everything in Care, plus up to 6 hours a month for new pages, features and improvements.",
  },
  {
    id: "self",
    label: "I'll host it myself",
    monthly: 0,
    description: "You get the code and the keys, and I walk your team through running it.",
  },
]

export type Selection = {
  type: string
  size: string
  design: string
  features: readonly string[]
  rush: boolean
  care: string
}

export const DEFAULT_SELECTION: Selection = {
  // The first answer is the client's own: nothing chosen until they choose.
  type: "",
  size: "small",
  design: "brand",
  features: [],
  rush: false,
  care: "care",
}

/** The questions, in the order they're asked. A one-pager has no size to ask about. */
export type Step = "type" | "size" | "design" | "features" | "timing" | "care"

export function stepsFor(typeId: string): Step[] {
  const unit = SITE_TYPES.find((item) => item.id === typeId)?.unit
  return ["type", ...(unit ? (["size"] as const) : []), "design", "features", "timing", "care"]
}

/**
 * The selection as far as it's been confirmed: an unconfirmed step counts as
 * the choice that adds nothing, so the running total never prices an answer
 * the client hasn't given.
 */
export function confirmedOnly(selection: Selection, confirmed: ReadonlySet<Step>): Selection {
  return {
    ...selection,
    size: confirmed.has("size") ? selection.size : SIZES[0].id,
    design: confirmed.has("design") ? selection.design : DESIGNS[0].id,
    features: confirmed.has("features") ? selection.features : [],
    rush: confirmed.has("timing") && selection.rush,
  }
}

export type Line = { label: string; price: Range }

export type Estimate = {
  lines: Line[]
  price: Range
  weeks: Range
  care: CarePlan
}

const find = <T extends { id: string }>(list: readonly T[], id: string) =>
  list.find((item) => item.id === id) ?? list[0]

export const isIncluded = (feature: Feature, type: string) => feature.includedIn?.includes(type) ?? false

/** Ranges read better rounded: to $250 under five figures, to $500 above. */
function roundRange([low, high]: Range): Range {
  const step = (n: number) => (n < 10000 ? 250 : 500)
  return [Math.floor(low / step(low)) * step(low), Math.ceil(high / step(high)) * step(high)]
}

export function estimate(selection: Selection): Estimate {
  const type = find(SITE_TYPES, selection.type)
  const lines: Line[] = [{ label: type.label, price: type.price }]
  const weeks = [...type.weeks]
  const add = (label: string, option: Option) => {
    if (option.price[1] > 0) lines.push({ label, price: option.price })
    weeks[0] += option.weeks[0]
    weeks[1] += option.weeks[1]
  }

  if (type.unit) {
    const size = find(SIZES, selection.size)
    add(`${size.label} ${type.unit}`, size)
  }
  const design = find(DESIGNS, selection.design)
  add(design.label, design)
  for (const feature of FEATURES) {
    if (selection.features.includes(feature.id) && !isIncluded(feature, type.id)) add(feature.label, feature)
  }

  let low = lines.reduce((sum, line) => sum + line.price[0], 0)
  let high = lines.reduce((sum, line) => sum + line.price[1], 0)
  if (selection.rush) {
    low *= RUSH.price
    high *= RUSH.price
    weeks[0] = Math.max(1, Math.round(weeks[0] * RUSH.weeks))
    weeks[1] = Math.max(weeks[0], Math.round(weeks[1] * RUSH.weeks))
  }

  return {
    lines,
    price: roundRange([low, high]),
    weeks: [weeks[0], weeks[1]],
    care: find(CARE_PLANS, selection.care),
  }
}

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatPrice = (n: number) => dollars.format(n)
export const formatRange = ([low, high]: Range) =>
  low === high ? formatPrice(low) : `${formatPrice(low)}–${formatPrice(high)}`
export const formatWeeks = ([low, high]: Range) =>
  low === high ? `${low} week${low === 1 ? "" : "s"}` : `${low}–${high} weeks`

/** The estimate as plain text, attached to the message it's sent with. Its first line is its title. */
export function describe(selection: Selection, result: Estimate): string {
  const type = find(SITE_TYPES, selection.type)
  const included = FEATURES.filter((feature) => isIncluded(feature, type.id)).map((feature) => feature.label)
  return [
    "Website estimate",
    "",
    ...result.lines.map((line) => `- ${line.label}: ${formatRange(line.price)}`),
    ...(included.length ? [`- Included: ${included.join(", ")}`] : []),
    ...(selection.rush ? ["- Needed soon"] : []),
    "",
    `Estimated build: ${formatRange(result.price)}, about ${formatWeeks(result.weeks)}`,
    result.care.monthly
      ? `Hosting & care: ${result.care.label}, ${formatPrice(result.care.monthly)}/month`
      : `Hosting: ${result.care.label}`,
  ].join("\n")
}
