"use client";

import { ALLOWED_COUNTRY_CODES } from "@/constants/countryCodes";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [txPassword, setTxPassword] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [telegram, setTelegram] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<string>("");
  const [locationCountry, setLocationCountry] = useState<string | null>(null);
  const [phoneCountryDetected, setPhoneCountryDetected] = useState<
    string | null
  >(null);
  const [locationMismatch, setLocationMismatch] = useState<boolean | null>(
    null,
  );

  // Auto-populate invitation code from URL query param (?<code>)
  React.useEffect(() => {
    // The URL format is /register?<CODE>, so the code is the first (and only) key
    // with no value. searchParams.keys() gives us that key.
    const firstKey = searchParams.keys().next().value;
    if (firstKey) {
      setInvitationCode(firstKey);
    }
  }, [searchParams]);

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
          // ignore; we'll fallback to IP lookup on submit
        }
      }
    })();
  }, []);

  React.useEffect(() => {
    // Generate random 7-digit PIN on component mount
    const randomPin = Math.floor(Math.random() * 9000000) + 1000000;
    setGeneratedPin(randomPin.toString());
  }, []);

  // Validation states
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [confirmValid, setConfirmValid] = useState<boolean | null>(null);
  const [txPasswordValid, setTxPasswordValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  // Use Convex mutation to register users (requires Convex dev/service running)
  const registerUser = useMutation(api.user.registerUser);
  const updateUser = useMutation(api.user.updateUserBalance);

  const lookForInvitationCode = useQuery(
    api.user.getUserByInvitationCode,
    invitationCode ? { invitationCde: invitationCode } : "skip",
  );
  // const user = useQuery(api.user.getUserByContact, { contact: phoneNumber });

  // Validation functions
  const validatePhone = (phone: string) => {
    const raw = `${countryCode}${phone}`;
    const parsed = parsePhoneNumberFromString(raw);
    const isValid = parsed ? parsed.isValid() : false;
    setPhoneValid(isValid);
    if (parsed && parsed.country) {
      setPhoneCountryDetected(parsed.country);
      if (locationCountry) {
        setLocationMismatch(parsed.country !== locationCountry);
      }
    }
    return isValid;
  };

  const validatePassword = (pass: string) => {
    const isValid = pass.length >= 6;
    setPasswordValid(isValid);
    return isValid;
  };

  const validateConfirm = (confirmPass: string) => {
    const isValid = confirmPass === password && confirmPass.length > 0;
    setConfirmValid(isValid);
    return isValid;
  };

  const validateTxPassword = (txPass: string) => {
    const isValid = txPass.length >= 6;
    setTxPasswordValid(isValid);
    return isValid;
  };

  const validateEmail = (emailStr: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(emailStr);
    setEmailValid(isValid);
    return isValid;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Try to detect user's country: prefer browser geolocation (permission-based), fallback to IP
    let detectedCountry: string | null = null;
    if (!locationCountry) {
      try {
        const res = await fetch("https://ipapi.co/json");
        if (res.ok) {
          const json = await res.json();
          detectedCountry = json?.country || null; // ISO 2-letter country code
          setLocationCountry(detectedCountry);
        }
      } catch (err) {
        // ignore
      }

      // If still no country from IP, try browser geolocation as last resort
      if (
        !detectedCountry &&
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

    // auto-detect country code from number if possible
    if (phoneNumber) {
      const auto = parsePhoneNumberFromString(`${countryCode}${phoneNumber}`);
      if (auto && auto.countryCallingCode) {
        const detected = `+${auto.countryCallingCode}`;
        if (detected !== countryCode) {
          setCountryCode(detected);
        }
        if (auto.country) {
          setPhoneCountryDetected(auto.country);
        }
      }
    }

    // parse phone early for validation and auto-allow decisions
    const parsed = phoneNumber
      ? parsePhoneNumberFromString(`${countryCode}${phoneNumber}`)
      : null;

    // Basic client-side validation
    // ensure we actually know the browser location
    if (!locationCountry) {
      setError(
        "Unable to detect your location. Please allow location access or check your network.",
      );
      return;
    }
    // verify code is in whitelist — but auto-allow if parsed phone country matches detected location
    if (!ALLOWED_COUNTRY_CODES.includes(countryCode)) {
      const phoneCountryMatchesLocation =
        parsed &&
        parsed.country &&
        locationCountry &&
        parsed.country === locationCountry;
      if (!phoneCountryMatchesLocation) {
        setError("Country code not supported");
        return;
      }
      // allow: add implied acceptance path when user's phone country matches detected location
    }
    if (!validatePhone(phoneNumber)) {
      setError("Please enter a valid phone number.");
      return;
    }
    // ensure number actually belongs to country
    if (!parsed || parsed.countryCallingCode !== countryCode.replace("+", "")) {
      setError("Phone number does not match country code");
      return;
    }

    // If we have both phone-country and detected IP country, set mismatch flag (non-blocking)
    if (parsed && parsed.country && locationCountry) {
      setPhoneCountryDetected(parsed.country);
      setLocationMismatch(parsed.country !== locationCountry);
    } else {
      setLocationMismatch(null);
    }

    // Enforce that phone country matches detected IP country
    if (locationMismatch === true) {
      setError(
        `Detected location ${locationCountry} does not match phone country ${phoneCountryDetected}. Please use a local phone number.`,
      );
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!validateConfirm(confirm)) {
      setError("Passwords do not match.");
      return;
    }
    if (!validateTxPassword(txPassword)) {
      setError("Transaction password must be at least 6 characters.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const contact = `${countryCode}${phoneNumber}`;
      const result: any = await registerUser({
        countryCode,
        password,
        confirmPassword: confirm,
        transactionPassword: txPassword,
        email,
        invitationCode,
        telegram,
        contact,
      });

      if (!result || !result.success) {
        setError(result?.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // On success, navigate to sign-in page
      router.push("/sign-in");
    } catch (err: any) {
      setError(err?.message || "Unexpected error during registration");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] flex flex-col items-center justify-center pb-10">
      <div className="w-full max-w-md mt-20">
        <h1 className="text-white text-3xl font-bold text-center py-6 bg-[#0f1f3a] border-x border-[#2a4a7a]">
          Register
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1a3a5a] border border-[#2a4a7a] rounded-b-lg p-6 space-y-4"
        >
          {/* Step 1: Phone Number with Country Code */}
          <PhoneInputWithCountry
            countryCode={countryCode}
            setCountryCode={setCountryCode}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            validatePhone={validatePhone}
            phoneValid={phoneValid}
          />

          {/* Email Address */}
          <div className="relative">
            <input
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              placeholder="Please enter email address"
              type="email"
              className={`w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                email && emailValid === true
                  ? "border-green-500"
                  : email
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
            {emailValid === false && (
              <p className="text-red-400 text-xs mt-1">
                Please enter a valid email address.
              </p>
            )}
          </div>

          {/* Step 2: Login Password */}
          <div className="relative">
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
                // Also revalidate confirm password when password changes
                if (confirm) {
                  validateConfirm(confirm);
                }
              }}
              placeholder="Please enter login password"
              type="password"
              className={`w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                password && passwordValid === true
                  ? "border-green-500"
                  : password
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <input
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                validateConfirm(e.target.value);
              }}
              placeholder="Please enter confirmation password"
              type="password"
              className={`w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-gray-400 placeholder-gray-500 text-sm focus:outline-none ${
                confirm && confirmValid === true
                  ? "border-green-500"
                  : confirm
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
            {confirmValid === false && (
              <p className="text-red-400 text-xs mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Step 3: Payment Password */}
          <div className="relative">
            <input
              value={txPassword}
              onChange={(e) => {
                setTxPassword(e.target.value);
                validateTxPassword(e.target.value);
              }}
              placeholder="Please enter payment password"
              type="password"
              className={`w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                txPassword && txPasswordValid === true
                  ? "border-green-500"
                  : txPassword
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />

            {txPasswordValid === false && (
              <p className="text-red-400 text-xs mt-1">
                Transaction password must be at least 6 characters.
              </p>
            )}
          </div>

          {/* Invitation Code */}
          <div className="relative">
            <input
              value={invitationCode}
              onChange={(e) => {
                setInvitationCode(e.target.value);
              }}
              placeholder="Please enter invitation code"
              type="text"
              className="w-full px-4 py-3 rounded border-2 bg-[#152a4a] text-white text-sm focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || locationMismatch === true}
            className="w-full bg-white text-[#1a3a5a] font-bold py-3 rounded hover:bg-gray-200 transition-colors duration-200 mt-6"
          >
            {loading ? "Registering..." : "Complete registration"}
          </button>

          <Link href="/sign-in" prefetch>
            <button
              type="button"
              className="w-full bg-[#2a5a9a] text-white font-semibold py-2 rounded hover:bg-[#3a6aaa] transition-colors duration-200"
            >
              Login
            </button>
          </Link>
        </form>
      </div>
    </div>
  );
}