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
