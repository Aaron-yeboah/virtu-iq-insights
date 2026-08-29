export type CountryCode = "GH" | "NG";

export interface CountryInfo {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  example: string;
  localLength: number;
}

export const COUNTRIES: Record<CountryCode, CountryInfo> = {
  GH: {
    code: "GH",
    name: "Ghana",
    dialCode: "+233",
    flag: "🇬🇭",
    example: "024 123 4567",
    localLength: 10,
  },
  NG: {
    code: "NG",
    name: "Nigeria",
    dialCode: "+234",
    flag: "🇳🇬",
    example: "0803 123 4567",
    localLength: 11,
  },
};

const GH_PREFIXES: Record<string, string> = {
  // MTN Ghana
  "024": "MTN",
  "054": "MTN",
  "055": "MTN",
  "059": "MTN",
  "053": "MTN",
  // Telecel Ghana (formerly Vodafone)
  "020": "Telecel",
  "050": "Telecel",
  // AT (AirtelTigo)
  "027": "AT",
  "057": "AT",
  "026": "AT",
  "056": "AT",
};

const NG_PREFIXES: Record<string, string> = {
  // MTN Nigeria
  "0803": "MTN",
  "0806": "MTN",
  "0813": "MTN",
  "0816": "MTN",
  "0810": "MTN",
  "0814": "MTN",
  "0903": "MTN",
  "0906": "MTN",
  "0703": "MTN",
  "0706": "MTN",
  "0704": "MTN",
  "0913": "MTN",
  "0916": "MTN",
  // Airtel Nigeria
  "0802": "Airtel",
  "0808": "Airtel",
  "0812": "Airtel",
  "0708": "Airtel",
  "0701": "Airtel",
  "0902": "Airtel",
  "0901": "Airtel",
  "0904": "Airtel",
  "0907": "Airtel",
  "0912": "Airtel",
  // Glo (Globacom)
  "0805": "Glo",
  "0807": "Glo",
  "0815": "Glo",
  "0811": "Glo",
  "0705": "Glo",
  "0905": "Glo",
  "0915": "Glo",
  // 9mobile (Etisalat)
  "0809": "9mobile",
  "0817": "9mobile",
  "0818": "9mobile",
  "0909": "9mobile",
  "0908": "9mobile",
};

export interface PhoneValidationResult {
  isValid: boolean;
  country: CountryCode;
  nationalNumber: string; // e.g. "0552231466" or "08031234567"
  formattedDisplay: string; // e.g. "055 223 1466" or "0803 123 4567"
  e164Digits: string; // e.g. "233552231466" or "2348031234567"
  syntheticEmail: string; // e.g. "233552231466@phone.virtu-iq.live"
  telco: string | null;
  error?: string;
}

/**
 * Normalizes and validates a phone number for Ghana or Nigeria.
 */
export function validateMobileNumber(
  rawInput: string,
  selectedCountry: CountryCode = "GH",
): PhoneValidationResult {
  const digits = rawInput.trim().replace(/\D/g, "");

  // Auto-detect country if input includes international prefix
  let country: CountryCode = selectedCountry;
  let cleanDigits = digits;

  if (digits.startsWith("233")) {
    country = "GH";
    cleanDigits = "0" + digits.slice(3);
  } else if (digits.startsWith("234")) {
    country = "NG";
    cleanDigits = "0" + digits.slice(3);
  } else if (!cleanDigits.startsWith("0") && cleanDigits.length > 0) {
    cleanDigits = "0" + cleanDigits;
  }

  const countryInfo = COUNTRIES[country];

  if (country === "GH") {
    // Ghana validation
    if (cleanDigits.length < 10) {
      return {
        isValid: false,
        country: "GH",
        nationalNumber: cleanDigits,
        formattedDisplay: formatGhanaNumber(cleanDigits),
        e164Digits: "233" + cleanDigits.slice(1),
        syntheticEmail: `233${cleanDigits.slice(1)}@phone.virtu-iq.live`,
        telco: null,
        error: "Ghana phone numbers must have 10 digits (e.g. 024 123 4567).",
      };
    }

    const national10 = cleanDigits.slice(0, 10);
    const prefix3 = national10.slice(0, 3);
    const telco = GH_PREFIXES[prefix3] ?? null;

    if (!telco) {
      return {
        isValid: false,
        country: "GH",
        nationalNumber: national10,
        formattedDisplay: formatGhanaNumber(national10),
        e164Digits: "233" + national10.slice(1),
        syntheticEmail: `233${national10.slice(1)}@phone.virtu-iq.live`,
        telco: null,
        error: `Prefix "${prefix3}" is not a recognized Ghana mobile network (MTN, Telecel, AT).`,
      };
    }

    const e164 = "233" + national10.slice(1);
    return {
      isValid: true,
      country: "GH",
      nationalNumber: national10,
      formattedDisplay: formatGhanaNumber(national10),
      e164Digits: e164,
      syntheticEmail: `${e164}@phone.virtu-iq.live`,
      telco,
    };
  } else {
    // Nigeria validation
    if (cleanDigits.length < 11) {
      return {
        isValid: false,
        country: "NG",
        nationalNumber: cleanDigits,
        formattedDisplay: formatNigeriaNumber(cleanDigits),
        e164Digits: "234" + cleanDigits.slice(1),
        syntheticEmail: `234${cleanDigits.slice(1)}@phone.virtu-iq.live`,
        telco: null,
        error: "Nigeria phone numbers must have 11 digits (e.g. 0803 123 4567).",
      };
    }

    const national11 = cleanDigits.slice(0, 11);
    const prefix4 = national11.slice(0, 4);
    const telco = NG_PREFIXES[prefix4] ?? null;

    if (!telco) {
      return {
        isValid: false,
        country: "NG",
        nationalNumber: national11,
        formattedDisplay: formatNigeriaNumber(national11),
        e164Digits: "234" + national11.slice(1),
        syntheticEmail: `234${national11.slice(1)}@phone.virtu-iq.live`,
        telco: null,
        error: `Prefix "${prefix4}" is not a recognized Nigeria mobile network (MTN, Airtel, Glo, 9mobile).`,
      };
    }

    const e164 = "234" + national11.slice(1);
    return {
      isValid: true,
      country: "NG",
      nationalNumber: national11,
      formattedDisplay: formatNigeriaNumber(national11),
      e164Digits: e164,
      syntheticEmail: `${e164}@phone.virtu-iq.live`,
      telco,
    };
  }
}

/**
 * Formats digits in real time for Ghana: 055 223 1466
 */
export function formatGhanaNumber(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 10);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)} ${clean.slice(3)}`;
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
}

/**
 * Formats digits in real time for Nigeria: 0803 123 4567
 */
export function formatNigeriaNumber(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 11);
  if (clean.length <= 4) return clean;
  if (clean.length <= 7) return `${clean.slice(0, 4)} ${clean.slice(4)}`;
  return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
}

/**
 * Checks whether an email string is a synthetic phone-login email.
 */
export function isSyntheticPhoneEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim().toLowerCase();
  if (
    clean.includes("@phone.virtu-iq.live") ||
    clean.includes("@virtu-iq.live") ||
    clean.includes("@virtu.live") ||
    clean.includes("@phone.virtu.live") ||
    clean.includes("@phone.virtu-iq") ||
    clean.includes("@virtu")
  ) {
    return true;
  }
  // Any email where the part before @ is purely numbers and domain has 'phone' or 'virtu'
  return /^(\+?\d{7,15})@.*(virtu|phone).*/i.test(clean);
}

/**
 * Extracts and formats the phone number from a synthetic email or raw phone string.
 * e.g. "233552231466@phone.virtu-iq.live" -> "055 223 1466"
 * e.g. "0552231466@phone.virtu-iq.live" -> "055 223 1466"
 * e.g. "552231466@phone.virtu-iq.live" -> "055 223 1466"
 * e.g. "2348031234567@phone.virtu-iq.live" -> "0803 123 4567"
 * Returns null if the input is not a synthetic phone email.
 */
export function extractPhoneFromSyntheticEmail(email?: string | null): string | null {
  if (!email || typeof email !== "string" || !isSyntheticPhoneEmail(email)) return null;
  const rawLocal = (email.split("@")[0] ?? "").replace(/\D/g, "");
  if (!rawLocal) return null;

  // Ghana with country code (233XXXXXXXXX -> 12 digits)
  if (rawLocal.startsWith("233") && rawLocal.length === 12) {
    const local = "0" + rawLocal.slice(3);
    return formatGhanaNumber(local);
  }
  // Nigeria with country code (234XXXXXXXXXX -> 13 digits)
  if (rawLocal.startsWith("234") && rawLocal.length === 13) {
    const local = "0" + rawLocal.slice(3);
    return formatNigeriaNumber(local);
  }
  // Ghana without country code (0XXXXXXXXX -> 10 digits)
  if (rawLocal.length === 10 && rawLocal.startsWith("0")) {
    return formatGhanaNumber(rawLocal);
  }
  // Ghana 9 digits missing leading 0 (XXXXXXXXX -> 9 digits)
  if (rawLocal.length === 9) {
    return formatGhanaNumber("0" + rawLocal);
  }
  // Nigeria without country code (0XXXXXXXXXX -> 11 digits)
  if (rawLocal.length === 11 && rawLocal.startsWith("0")) {
    return formatNigeriaNumber(rawLocal);
  }
  // Nigeria 10 digits missing leading 0 (XXXXXXXXXX -> 10 digits and starts with 7, 8, 9)
  if (rawLocal.length === 10 && /^[789]/.test(rawLocal)) {
    return formatNigeriaNumber("0" + rawLocal);
  }

  // Fallback: format if 10 or 11 digits
  if (rawLocal.length === 10) return formatGhanaNumber(rawLocal);
  if (rawLocal.length === 11) return formatNigeriaNumber(rawLocal);

  return rawLocal;
}

/**
 * Returns a human-friendly display string for an email/phone.
 * If the email is a synthetic phone email, returns the formatted phone number (e.g. "055 223 1466").
 * Otherwise, returns the real email (or fallback).
 */
export function displayEmailOrPhone(
  email?: string | null,
  phone?: string | null,
  fallback = "—"
): string {
  if (phone && phone.trim().length > 0) {
    return phone.trim();
  }
  if (!email || typeof email !== "string") return fallback;
  const extracted = extractPhoneFromSyntheticEmail(email);
  if (extracted) return extracted;
  return email.trim();
}

/**
 * Returns a clean user display label from full_name, email, phone, or default.
 * If the name is missing and email is synthetic, formats it as the phone number instead of displaying "@virtu.live".
 */
export function displayUserName(
  fullName?: string | null,
  email?: string | null,
  phone?: string | null,
  fallback = "Member"
): string {
  if (fullName && fullName.trim().length > 0) {
    return fullName.trim();
  }
  return displayEmailOrPhone(email, phone, fallback);
}

/**
 * Cleans any value for frontend display. If it's a synthetic email string, strips the domain and formats the phone number.
 */
export function cleanDisplayValue(value: unknown): unknown {
  if (typeof value === "string") {
    const extracted = extractPhoneFromSyntheticEmail(value);
    if (extracted) return extracted;
  }
  return value;
}

