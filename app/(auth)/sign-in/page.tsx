"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ALLOWED_COUNTRY_CODES } from "@/constants/countryCodes";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { EyeIcon, EyeOffIcon } from "lucide-react";
export default function SignInPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("en");
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  const [phoneCountryDetected, setPhoneCountryDetected] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Validation states
  const [locationMismatch, setLocationMismatch] = useState<boolean | null>(
    null,
  );
  const [showTxPassword, setShowTxPassword] = useState(false);
  // Browser geolocation + reverse geocoding helpers
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
      );
      if (!res.ok) return null;
      const json = await res.json();
      const cc = json?.address?.country_code;
      return cc ? cc.toUpperCase() : null;
    } catch (e) {
      return null;
    }
  };

  const getCurrentPositionAsync = () =>
    new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
      }),
    );

  React.useEffect(() => {
    (async () => {
      if (typeof window !== "undefined" && "geolocation" in navigator) {
        try {
          const pos = await getCurrentPositionAsync();
          const cc = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (cc) setLocationCountry(cc);
        } catch (err) {
          // ignore; fallback to IP lookup on submit
        }
      }
    })();
  }, []);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);

  const router = useRouter();

  // Validation functions
  const validatePhone = (phone: string) => {
    const isValid = phone.trim().length >= 7 && /^\d+$/.test(phone);
    setPhoneValid(isValid);
    return isValid;
  };

  const validatePassword = (pass: string) => {
    const isValid = pass.length >= 6;
    setPasswordValid(isValid);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phoneNumber || !password)
      return setError("Please provide phone number and password");
    // Detect location: prefer browser geolocation (if available), otherwise fall back to IP lookup
    if (!locationCountry) {
      try {
        const res = await fetch("https://ipapi.co/json");
        if (res.ok) {
          const json = await res.json();
          setLocationCountry(json?.country || null);
        }
      } catch (err) {
        // ignoreJdelivery
      }

      // If still no country, try browser geolocation as a last resort
      if (
        !locationCountry &&
        typeof window !== "undefined" &&
        "geolocation" in navigator
      ) {
        try {
          const pos = await getCurrentPositionAsync();
          const cc = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          if (cc) setLocationCountry(cc);
        } catch (e) {
          // ignore
        }
      }
    }
    // auto-detect country code
    if (phoneNumber) {
      const auto = parsePhoneNumberFromString(`${countryCode}${phoneNumber}`);
      if (auto && auto.countryCallingCode) {
        const detected = `+${auto.countryCallingCode}`;
        if (detected !== countryCode) {
          setCountryCode(detected);
        }
        if (auto.country) setPhoneCountryDetected(auto.country);
      }
    }
    if (!ALLOWED_COUNTRY_CODES.includes(countryCode))
      return setError("Unsupported country code");
    const parsed = parsePhoneNumberFromString(`${countryCode}${phoneNumber}`);
    if (!parsed || parsed.countryCallingCode !== countryCode.replace("+", "")) {
      return setError("Phone number does not match country code");
    }

    // set mismatch flag if we can
    if (parsed && parsed.country && locationCountry) {
      setPhoneCountryDetected(parsed.country);
      setLocationMismatch(parsed.country !== locationCountry);
    } else {
      setLocationMismatch(null);
    }

    (async () => {
      setLoading(true);
      try {
        const contact = `${countryCode}${phoneNumber}`;
        const res = await signIn("credentials", {
          contact,
          password,
          countryCode: countryCode,
          redirect: false,
        });

        if (res?.error) {
          setError(res.error || "Sign in failed. Check your credentials.");
          return;
        }

        if (res?.ok) {
          router.push("/dashboard");
          return;
        }

        setError("Sign in did not complete. Please try again.");
      } catch (err: any) {
        setError(err?.message || "An error occurred during sign in.");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-[#1a2a4a] flex flex-col items-center justify-center pt-8 p-6">
      <div className="w-full max-w-md">
        <h1 className="text-white text-3xl font-bold text-center py-6 bg-[#0f1f3a] border-x border-[#2a4a7a]">
          Sign In
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a3a5a] border border-[#2a4a7a] rounded-b-lg p-6 space-y-4"
        >
          {/* Phone Number with Country Code */}
          <PhoneInputWithCountry
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            validatePhone={validatePhone}
            phoneValid={phoneValid}
          />

          {/* Password Field */}
          <div className="relative">
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              placeholder="Please enter password"
              type={showTxPassword ? "text" : "password"}
              className={`w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                password && passwordValid === true
                  ? "border-green-500"
                  : password
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowTxPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label={showTxPassword ? "Hide password" : "Show password"}
            >
              {showTxPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {passwordValid === false && (
              <p className="text-red-400 text-xs mt-1">
                Password must be at least 6 characters.
              </p>
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-[#1a3a5a] font-bold py-3 rounded hover:bg-gray-200 transition-colors duration-200 mt-6"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = "/register")}
            className="w-full bg-[#2a5a9a] text-white font-semibold py-2 rounded hover:bg-[#3a6aaa] transition-colors duration-200"
          >
            Register
          </button>

          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Forgot password?
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
