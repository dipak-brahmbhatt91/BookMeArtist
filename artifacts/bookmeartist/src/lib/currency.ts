/**
 * Currency configuration — change this file to switch currency globally.
 *
 * symbol      : prefix shown before every price  (e.g. "₹", "$", "€")
 * code        : ISO 4217 code used in JSON-LD / meta  (e.g. "INR", "USD")
 * locale      : BCP 47 locale for number formatting  (e.g. "en-IN", "en-US")
 * maxBudget   : upper bound of the price-filter slider on the browse page
 * budgetStep  : slider step increment
 */
export const CURRENCY = {
  symbol: "₹",
  code: "INR",
  locale: "en-IN",
  maxBudget: 500_000,
  budgetStep: 5_000,
} as const;

/** Format a numeric price as a display string, e.g. 25000 → "₹25,000" */
export function formatPrice(amount: number): string {
  return `${CURRENCY.symbol}${amount.toLocaleString(CURRENCY.locale)}`;
}
