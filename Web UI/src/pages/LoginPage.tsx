import { useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  onAuthStateChanged,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { useFlashMessage } from "../components/FlashMessageContext";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const { flashMessage, setFlashMessage } = useFlashMessage();

  const [countryCode, setCountryCode] = useState("91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-login if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate(from, { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate, from]);

  // Show any flash message once
  useEffect(() => {
    if (location.state?.message && location.state?.type) {
      setFlashMessage({
        type: location.state.type,
        message: location.state.message,
      });
      window.history.replaceState({}, document.title);
      return;
    }

    const stored =
      sessionStorage.getItem("logoutMessage") ||
      sessionStorage.getItem("redirectMessage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFlashMessage(parsed);
      } catch {
        console.error("Invalid session flash message");
      }
      sessionStorage.removeItem("logoutMessage");
      sessionStorage.removeItem("redirectMessage");
    }
  }, [location.state, setFlashMessage]);

  // Cleanup reCAPTCHA
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const setupRecaptcha = async () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = undefined;
    }

    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
        callback: () => console.log("reCAPTCHA solved"),
        "expired-callback": () => console.warn("reCAPTCHA expired; retry."),
      }
    );

    await window.recaptchaVerifier.render();
  };

  const sendOtp = async () => {
    if (phoneNumber.trim().length < 6) {
      setFlashMessage({
        type: "danger",
        message: "Enter a valid phone number.",
      });
      return;
    }

    const fullPhone = `+${countryCode}${phoneNumber}`;
    try {
      setLoading(true);
      const response = await fetch(
        `https://us-central1-uniblu-production.cloudfunctions.net/api/check-phone?phoneNumber=${encodeURIComponent(
          fullPhone
        )}`
      );
      const result = await response.json();

      if (!result.exists) {
        setFlashMessage({
          type: "danger",
          message: "Phone number not registered. Please contact admin.",
        });
        return;
      }

      await setupRecaptcha();
      const appVerifier = window.recaptchaVerifier!;
      const confirmation = await signInWithPhoneNumber(
        auth,
        fullPhone,
        appVerifier
      );

      setConfirmationResult(confirmation);
      setStep("otp");
      setFlashMessage({
        type: "success",
        message: "OTP sent successfully! Check your messages.",
      });
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      setFlashMessage({
        type: "danger",
        message:
          error.code === "auth/too-many-requests"
            ? "Too many OTP attempts. Please wait or use a test number."
            : error.message || "Failed to send OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!confirmationResult) return;

    try {
      setLoading(true);
      await confirmationResult.confirm(otp);
      setFlashMessage({ type: "success", message: "Login successful!" });
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setFlashMessage({
        type: "danger",
        message: "Invalid OTP. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "40px" }}>
      <div id="recaptcha-container" style={{ display: "none" }}></div>

      <div
        className="card p-4 shadow"
        style={{ maxWidth: 400, margin: "0 auto" }}
      >
        <h4 className="text-center mb-4">Login via Phone</h4>

        {loading && (
          <div className="d-flex justify-content-center my-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {!loading && step === "phone" && (
          <>
            <div className="d-flex mb-3 align-items-center">
              <div style={{ width: "30%", marginRight: "8px" }}>
                <PhoneInput
                  country={"in"}
                  value={countryCode}
                  onChange={(value: string) => setCountryCode(value)}
                  enableSearch
                  inputStyle={{
                    width: "100%",
                    paddingLeft: "48px",
                    fontSize: "0.9rem",
                  }}
                  buttonStyle={{
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: 4,
                    borderBottomLeftRadius: 4,
                    fontSize: "0.9rem",
                  }}
                  dropdownStyle={{ maxHeight: "200px", overflowY: "auto" }}
                  disableCountryCode
                  disableDropdown={false}
                  specialLabel=""
                />
              </div>

              <input
                type="tel"
                className="form-control"
                placeholder="Phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{ width: "70%", fontSize: "1rem" }}
              />
            </div>

            <button className="btn btn-primary w-100" onClick={sendOtp}>
              Send OTP
            </button>
          </>
        )}

        {!loading && step === "otp" && (
          <>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button className="btn btn-success w-100" onClick={verifyOtp}>
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
