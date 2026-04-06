"use client";

import { COUNTRIES } from "@/constants/countries";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";

interface PhoneInputWithCountryProps {
  countryCode: string;
  setCountryCode: (code: string) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  validatePhone: (phone: string) => void;
  phoneValid: boolean | null;
  phonePlaceholder?: string;
}

export default function PhoneInputWithCountry({
  countryCode,
  setCountryCode,
  phoneNumber,
  setPhoneNumber,
  validatePhone,
  phoneValid,
  phonePlaceholder = "Please enter mobile phone number",
}: PhoneInputWithCountryProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (countryCode) {
      setSearch("");
    }
  }, [countryCode]);

  // Re-focus search input after Radix tries to steal focus
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    } else {
      setSearch("");
    }
  }, [open]);

  const filteredCountries = (() => {
    const trimmed = search.trim();
    // Only filter when user has typed at least 3 characters
    if (trimmed.length < 3) {
      return COUNTRIES.filter(
        (country, index, self) =>
          self.findIndex((item) => item.value === country.value) === index
      );
    }
    const lower = trimmed.toLowerCase();
    return COUNTRIES.filter(
      (country, index, self) =>
        self.findIndex((item) => item.value === country.value) === index &&
        (country.country.toLowerCase().includes(lower) ||
          country.value.includes(trimmed))
    );
  })();

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Country Select */}
        <div className="flex-1">
          <Select
            value={countryCode}
            onValueChange={(value) => {
              setCountryCode(value);
              setOpen(false);
            }}
            open={open}
            onOpenChange={setOpen}
          >
            <SelectTrigger
              className={`w-full rounded-lg border-2 bg-[#152a4a] text-white text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0d1f3c] ${
                countryCode && countryCode !== ""
                  ? "border-green-500 focus:ring-green-500/40"
                  : "border-red-500 focus:ring-red-500/40"
              }`}
            >
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>

            <SelectContent
              position="popper"
              align="start"
              className="min-w-[var(--radix-select-trigger-width)] max-w-full bg-[#1a2a4a] text-white border border-[#2a3f6a] shadow-2xl rounded-xl overflow-hidden p-0"
            >
              {/* Search box */}
              <div className="sticky top-0 z-10 bg-[#1a2a4a] border-b border-[#2a3f6a] px-3 py-2.5">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    placeholder="Search country… (min 3 chars)"
                    onChange={(e) => setSearch(e.target.value)}
                    // Prevent Radix Select from intercepting keystrokes
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#0d1f3c] text-white text-sm placeholder:text-slate-500 border border-[#2a3f6a] focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  {search.length > 0 && (
                    <button
                      onClick={() => {
                        setSearch("");
                        inputRef.current?.focus();
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {search.length === 1 && (
                  <p className="text-xs text-amber-400/80 mt-1.5 pl-1">
                    Type one more character to search…
                  </p>
                )}
              </div>

              {/* List */}
              <div className="max-h-56 overflow-y-auto overscroll-contain">
                <SelectGroup>
                  <SelectLabel className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Country
                  </SelectLabel>
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country, index) => (
                      <SelectItem
                        key={`${country.value}-${country.country}-${index}`}
                        value={country.value}
                        className="
                          px-3 py-2 text-sm cursor-pointer
                          text-slate-200
                          hover:bg-[#2a3f6a] hover:text-white
                          focus:bg-[#2a3f6a] focus:text-white
                          data-[state=checked]:bg-blue-600/30
                          data-[state=checked]:text-blue-200
                          data-[state=checked]:font-medium
                          transition-colors duration-100
                          outline-none
                        "
                      >
                        {country.label}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-sm text-slate-400 text-center">
                      <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No countries found for "<span className="text-white">{search}</span>"
                    </div>
                  )}
                </SelectGroup>
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Phone number input */}
        <Input
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            validatePhone(e.target.value);
          }}
          placeholder={phonePlaceholder}
          type="tel"
          className={`flex-1 px-4 py-3 rounded-lg border-2 bg-[#152a4a] text-white placeholder:text-slate-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0d1f3c] ${
            phoneNumber && phoneValid === true
              ? "border-green-500 focus:ring-green-500/40"
              : "border-red-500 focus:ring-red-500/40"
          }`}
        />
      </div>
    </div>
  );
}