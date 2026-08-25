/**
 * Which population the risk model judges a hospital's patients as.
 *
 * **The server is authoritative.** `Organization.region` is derived there from
 * the country, and nothing here is ever submitted — this copy exists only so
 * the onboarding form can show the consequence of a country as it is chosen,
 * rather than making someone save and go looking for it.
 *
 * The two must not drift, so a backend test
 * (`core/common/tests/test_regions.py`) compares this file against
 * `core/common/regions.py` and fails if a single country disagrees. If you edit
 * one, edit both.
 */

export type Region = "asia" | "africa" | "americas";

export const REGION_LABELS: Record<Region, string> = {
  asia: "Asia",
  africa: "Africa",
  americas: "Americas",
};

/** Countries the model has no training data for say so, rather than guessing. */
export const OUTSIDE_SUPPORTED = "Outside supported regions";

export const COUNTRY_REGION: Record<string, Region> = {
  // Asia
  Afghanistan: "asia",
  Armenia: "asia",
  Azerbaijan: "asia",
  Bahrain: "asia",
  Bangladesh: "asia",
  Cambodia: "asia",
  China: "asia",
  Cyprus: "asia",
  Georgia: "asia",
  India: "asia",
  Indonesia: "asia",
  Iran: "asia",
  Iraq: "asia",
  Israel: "asia",
  Japan: "asia",
  Jordan: "asia",
  Kazakhstan: "asia",
  Kuwait: "asia",
  Kyrgyzstan: "asia",
  Lebanon: "asia",
  Malaysia: "asia",
  Myanmar: "asia",
  Nepal: "asia",
  Oman: "asia",
  Pakistan: "asia",
  Palestine: "asia",
  Philippines: "asia",
  Qatar: "asia",
  "Saudi Arabia": "asia",
  Singapore: "asia",
  "South Korea": "asia",
  "Sri Lanka": "asia",
  Syria: "asia",
  Taiwan: "asia",
  Tajikistan: "asia",
  Thailand: "asia",
  Turkey: "asia",
  Turkmenistan: "asia",
  "United Arab Emirates": "asia",
  Uzbekistan: "asia",
  Vietnam: "asia",
  Yemen: "asia",
  // Africa
  Algeria: "africa",
  Cameroon: "africa",
  "Congo (DRC)": "africa",
  Egypt: "africa",
  Ethiopia: "africa",
  Ghana: "africa",
  Kenya: "africa",
  Libya: "africa",
  Mali: "africa",
  Morocco: "africa",
  Mozambique: "africa",
  Nigeria: "africa",
  Senegal: "africa",
  Somalia: "africa",
  "South Africa": "africa",
  Sudan: "africa",
  Tanzania: "africa",
  Tunisia: "africa",
  Uganda: "africa",
  Zambia: "africa",
  Zimbabwe: "africa",
  // Americas
  Argentina: "americas",
  Bolivia: "americas",
  Brazil: "americas",
  Canada: "americas",
  Chile: "americas",
  Colombia: "americas",
  "Costa Rica": "americas",
  Cuba: "americas",
  "Dominican Republic": "americas",
  Ecuador: "americas",
  "El Salvador": "americas",
  Guatemala: "americas",
  Honduras: "americas",
  Jamaica: "americas",
  Mexico: "americas",
  Nicaragua: "americas",
  Panama: "americas",
  Paraguay: "americas",
  Peru: "americas",
  "United States": "americas",
  Uruguay: "americas",
  Venezuela: "americas",
};

/** The label to show beside a chosen country. Empty when nothing is chosen yet. */
export function regionLabelFor(country: string | undefined): string {
  if (!country) return "";
  const region = COUNTRY_REGION[country.trim()];
  return region ? REGION_LABELS[region] : OUTSIDE_SUPPORTED;
}

export function isSupported(country: string | undefined): boolean {
  return Boolean(country && COUNTRY_REGION[country.trim()]);
}
