"use client";

import { COUNTRIES } from "@/constants/countries";
import { Input } from "@/components/ui/input";
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
  phonePlaceholder = "Phone number",
}: PhoneInputWithCountryProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Deduplicated full list
  const allCountries = COUNTRIES.filter(
    (country, index, self) =>
      self.findIndex((item) => item.value === country.value) === index,
  );

  const filteredCountries = (() => {
    const trimmed = search.trim();
    if (trimmed.length < 3) return allCountries;
    const lower = trimmed.toLowerCase();
    return allCountries.filter(
      (c) =>
        c.country.toLowerCase().includes(lower) ||
        c.value.includes(trimmed),
    );
  })();

  const selectedCountry = allCountries.find((c) => c.value === countryCode);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 60);
      return () => clearTimeout(t);
    } else {
      setSearch("");
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSelect = (value: string) => {
    setCountryCode(value);
    setOpen(false);
  };

  const isCountryValid = countryCode && countryCode !== "";
  const isPhoneValid = phoneNumber && phoneValid === true;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        {/* ── Country selector ── */}
        <div className="relative w-full sm:w-auto sm:flex-1">
          {/* Trigger button */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className={`
              w-full h-12 sm:h-11 px-3 rounded-lg border-2
              bg-[#152a4a] text-white text-sm
              flex items-center justify-between gap-2
              transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
              focus:ring-offset-[#0d1f3c] touch-manipulation
              ${
                isCountryValid
                  ? "border-green-500 focus:ring-green-500/40"
                  : "border-red-500 focus:ring-red-500/40"
              }
            `}
          >
            <span className={selectedCountry ? "text-white" : "text-slate-500"}>
              {selectedCountry ? selectedCountry.label : "Select Country"}
            </span>
            {/* Chevron */}
            <svg
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {open && (
            <div
              ref={dropdownRef}
              className="
                absolute left-0 top-[calc(100%+6px)] z-50
                w-full sm:min-w-[320px]
                bg-[#1a2a4a] text-white
                border border-[#2a3f6a]
                shadow-2xl rounded-xl overflow-hidden
              "
            >
              {/* Search box */}
              <div className="sticky top-0 z-10 bg-[#1a2a4a] border-b border-[#2a3f6a] px-3 py-3">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
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
                    ref={searchRef}
                    type="text"
                    value={search}
                    placeholder="Search country… (min 3 chars)"
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ fontSize: "16px" }}
                    className="
                      w-full pl-9 pr-9 py-2.5 rounded-lg
                      bg-[#0d1f3c] text-white text-sm
                      placeholder:text-slate-500
                      border border-[#2a3f6a]
                      focus:border-blue-500 focus:outline-none
                      transition-colors touch-manipulation
                    "
                  />
                  {search.length > 0 && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSearch("");
                        searchRef.current?.focus();
                      }}
                      className="
                        absolute right-2.5 top-1/2 -translate-y-1/2
                        w-6 h-6 flex items-center justify-center
                        text-slate-400 hover:text-white
                        transition-colors rounded-full hover:bg-white/10
                      "
                      aria-label="Clear search"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {search.trim().length > 0 && search.trim().length < 3 && (
                  <p className="text-xs text-amber-400/80 mt-2 pl-1">
                    Type {3 - search.trim().length} more character
                    {3 - search.trim().length !== 1 ? "s" : ""} to search…
                  </p>
                )}
              </div>

              {/* Country list */}
              <div className="max-h-[45vh] sm:max-h-56 overflow-y-auto overscroll-contain">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Country
                </div>

                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country, index) => (
                    <button
                      key={`${country.value}-${country.country}-${index}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(country.value);
                      }}
                      className={`
                        w-full text-left px-3 py-3 sm:py-2 text-sm
                        min-h-[44px] sm:min-h-0
                        transition-colors duration-100 touch-manipulation
                        ${
                          country.value === countryCode
                            ? "bg-blue-600/30 text-blue-200 font-medium"
                            : "text-slate-200 hover:bg-[#2a3f6a] hover:text-white active:bg-[#2a3f6a]"
                        }
                      `}
                    >
                      {country.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-sm text-slate-400 text-center">
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    No results for{" "}
                    <span className="text-white font-medium">"{search}"</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Phone number input ── */}
        <Input
          value={phoneNumber}
          onChange={(e) => {
            setPhoneNumber(e.target.value);
            validatePhone(e.target.value);
          }}
          placeholder={phonePlaceholder}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          style={{ fontSize: "16px" }}
          className={`
            w-full sm:flex-1 h-12 sm:h-11
            px-4 rounded-lg border-2
            bg-[#152a4a] text-white placeholder:text-slate-500
            text-sm transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-1
            focus:ring-offset-[#0d1f3c] touch-manipulation
            ${
              isPhoneValid
                ? "border-green-500 focus:ring-green-500/40"
                : "border-red-500 focus:ring-red-500/40"
            }
          `}
        />
      </div>
    </div>
  );
}