"use client";

import { ALLOWED_COUNTRY_CODES } from "@/constants/countryCodes";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";

// Eye icons
const EyeIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

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

  // Show/hide password states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTxPassword, setShowTxPassword] = useState(false);

  // Auto-populate invitation code from URL query param (?<code>)
  React.useEffect(() => {
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
          // ignore
        }
      }
    })();
  }, []);

  React.useEffect(() => {
    const randomPin = Math.floor(Math.random() * 9000000) + 1000000;
    setGeneratedPin(randomPin.toString());
  }, []);

  // Validation states
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [confirmValid, setConfirmValid] = useState<boolean | null>(null);
  const [txPasswordValid, setTxPasswordValid] = useState<boolean | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);

  const registerUser = useMutation(api.user.registerUser);
  const updateUser = useMutation(api.user.updateUserBalance);

  const lookForInvitationCode = useQuery(
    api.user.getUserByInvitationCode,
    invitationCode ? { invitationCde: invitationCode } : "skip",
  );

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

    let detectedCountry: string | null = null;
    if (!locationCountry) {
      try {
        const res = await fetch("https://ipapi.co/json");
        if (res.ok) {
          const json = await res.json();
          detectedCountry = json?.country || null;
          setLocationCountry(detectedCountry);
        }
      } catch (err) {
        // ignore
      }

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

    const parsed = phoneNumber
      ? parsePhoneNumberFromString(`${countryCode}${phoneNumber}`)
      : null;

    if (!locationCountry) {
      setError(
        "Unable to detect your location. Please allow location access or check your network.",
      );
      return;
    }
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
    }
    if (!validatePhone(phoneNumber)) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (!parsed || parsed.countryCallingCode !== countryCode.replace("+", "")) {
      setError("Phone number does not match country code");
      return;
    }

    if (parsed && parsed.country && locationCountry) {
      setPhoneCountryDetected(parsed.country);
      setLocationMismatch(parsed.country !== locationCountry);
    } else {
      setLocationMismatch(null);
    }

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
          {/* Phone Number with Country Code */}
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

          {/* Login Password */}
          <div className="relative">
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validatePassword(e.target.value);
                if (confirm) validateConfirm(confirm);
              }}
              placeholder="Please enter login password"
              type={showPassword ? "text" : "password"}
              className={`w-full px-4 py-3 pr-11 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                password && passwordValid === true
                  ? "border-green-500"
                  : password
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <input
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                validateConfirm(e.target.value);
              }}
              placeholder="Please enter confirmation password"
              type={showConfirm ? "text" : "password"}
              className={`w-full px-4 py-3 pr-11 rounded border-2 bg-[#152a4a] text-gray-400 placeholder-gray-500 text-sm focus:outline-none ${
                confirm && confirmValid === true
                  ? "border-green-500"
                  : confirm
                    ? "border-red-500"
                    : "border-gray-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
            {confirmValid === false && (
              <p className="text-red-400 text-xs mt-1">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Payment Password */}
          <div className="relative">
            <input
              value={txPassword}
              onChange={(e) => {
                setTxPassword(e.target.value);
                validateTxPassword(e.target.value);
              }}
              placeholder="Please enter payment password"
              type={showTxPassword ? "text" : "password"}
              className={`w-full px-4 py-3 pr-11 rounded border-2 bg-[#152a4a] text-white placeholder-gray-500 text-sm focus:outline-none ${
                txPassword && txPasswordValid === true
                  ? "border-green-500"
                  : txPassword
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
              onChange={(e) => setInvitationCode(e.target.value)}
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