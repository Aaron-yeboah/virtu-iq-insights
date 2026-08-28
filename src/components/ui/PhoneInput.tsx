import { useState, useId } from "react";
import { ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { COUNTRIES, CountryCode, validateMobileNumber, formatGhanaNumber, formatNigeriaNumber } from "@/lib/phone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string, validation: ReturnType<typeof validateMobileNumber>) => void;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PhoneInput({
  id: propId,
  label = "Phone number",
  value,
  onChange,
  required = false,
  autoFocus = false,
  disabled = false,
  className,
}: PhoneInputProps) {
  const generatedId = useId();
  const inputId = propId ?? generatedId;

  const [country, setCountry] = useState<CountryCode>("GH");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const countryInfo = COUNTRIES[country];
  const validation = validateMobileNumber(value, country);

  const handleInputChange = (rawVal: string) => {
    const digitsOnly = rawVal.replace(/\D/g, "");
    let formatted = digitsOnly;
    if (country === "GH") {
      formatted = formatGhanaNumber(digitsOnly);
    } else {
      formatted = formatNigeriaNumber(digitsOnly);
    }
    const valResult = validateMobileNumber(formatted, country);
    onChange(formatted, valResult);
  };

  const handleSelectCountry = (c: CountryCode) => {
    setCountry(c);
    setDropdownOpen(false);
    const digitsOnly = value.replace(/\D/g, "");
    let formatted = digitsOnly;
    if (c === "GH") {
      formatted = formatGhanaNumber(digitsOnly);
    } else {
      formatted = formatNigeriaNumber(digitsOnly);
    }
    const valResult = validateMobileNumber(formatted, c);
    onChange(formatted, valResult);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={inputId}>{label}</Label>
        {value.length > 0 && validation.telco && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            {validation.telco}
          </span>
        )}
      </div>

      <div className="relative flex rounded-xl border border-input bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        {/* Country Selector Dropdown Trigger */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex h-11 items-center gap-1.5 rounded-l-xl border-r border-border bg-secondary/50 px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus:outline-none"
            aria-label="Select Country"
          >
            <span className="text-base">{countryInfo.flag}</span>
            <span className="font-mono text-xs font-semibold text-muted-foreground">{countryInfo.dialCode}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute top-full left-0 z-50 mt-1.5 w-44 rounded-xl border border-border bg-popover p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                {(["GH", "NG"] as CountryCode[]).map((cCode) => {
                  const c = COUNTRIES[cCode];
                  const isSelected = cCode === country;
                  return (
                    <button
                      key={cCode}
                      type="button"
                      onClick={() => handleSelectCountry(cCode)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                      </div>
                      <span className={cn("font-mono font-semibold", isSelected ? "text-primary-foreground/90" : "text-muted-foreground")}>
                        {c.dialCode}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Formatted Phone Input */}
        <Input
          id={inputId}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={`e.g. ${countryInfo.example}`}
          className="h-11 rounded-l-none border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-sm"
        />
      </div>

      {/* Validation Message */}
      {value.length > 0 && !validation.isValid && validation.error && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{validation.error}</span>
        </p>
      )}
    </div>
  );
}
