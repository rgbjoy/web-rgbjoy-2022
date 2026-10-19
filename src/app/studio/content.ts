import { SITE } from "../data/site"
import { CARE_PLANS, formatPrice, formatRange, formatWeeks, SITE_TYPES } from "./pricing"

/** The things that only get noticed when they're missing. */
export const DETAILS = [
  {
    title: "your email keeps working",
    text: "The records that keep your inbox and contact form out of spam (MX, SPF, DKIM, DMARC), set up right.",
  },
  {
    title: "your rankings come with you",
    text: "Every old address redirected to its new page, so Google and old links still land somewhere real.",
  },
  {
    title: "fast on one bar of signal",
    text: "Images sized for each screen, nothing loaded that isn't needed, tested on a real phone.",
  },
  {
    title: "everyone can use it",
    text: "Keyboard, screen readers, contrast and resizable text, checked by hand.",
  },
  {
    title: "found by search and assistants",
    text: "Structured data, a sitemap and plain-text versions, so search engines and AI tools describe you correctly.",
  },
  {
    title: "you own it",
    text: "Your domain, your accounts, your content. Nothing held hostage, and everything written down.",
  },
]

export const PROCESS = [
  { title: "talk", text: "A free call about what you need, who it's for and what isn't working now." },
  { title: "plan", text: "A written scope and a fixed price, so you know what you're getting before anything starts." },
  { title: "design", text: "You see it before it's built, and we change whatever doesn't feel right." },
  { title: "build", text: "A private preview link you can click through on your own phone as it comes together." },
  {
    title: "launch",
    text: "I register or move your domain, set up hosting, SSL, email records, redirects and analytics, and stay on hand all launch day.",
  },
  { title: "look after", text: "I host it and keep it healthy. When you need something, you email me, not a support queue." },
]

/**
 * The studio page as plain text, for llms.txt and the AI prompt guide, so an assistant can answer
 * questions about working together without opening the page. Built from the same data the page uses.
 */
export function studioMarkdown(author: string = SITE.author) {
  return [
    "## Studio",
    "",
    `${author} works with clients through the [studio](${SITE.url}/studio): a designer and engineer who builds with AI tools, without the slop. He decides what gets built, reads every line before it ships, tests it the way customers will use it, and looks after it once it's live. Sites are built to read well to people and to AI assistants.`,
    "",
    "### Every build includes",
    "",
    ...DETAILS.map((detail) => `- ${detail.title}: ${detail.text}`),
    "",
    "### How it works",
    "",
    ...PROCESS.map((step) => `- ${step.title}: ${step.text}`),
    "",
    "### Starting prices",
    "",
    "Estimates in USD before extra features, design work or a rush. The studio page has an estimator for a fuller price; the final price is fixed in a written scope after a free call.",
    "",
    ...SITE_TYPES.map((type) => `- ${type.label}: ${formatRange(type.price)}, ${formatWeeks(type.weeks)}. ${type.description}`),
    "",
    "### Hosting and care, monthly",
    "",
    ...CARE_PLANS.map((plan) => `- ${plan.label}: ${plan.monthly ? `${formatPrice(plan.monthly)}/mo` : "no monthly fee"}. ${plan.description}`),
    "",
  ].join("\n")
}
