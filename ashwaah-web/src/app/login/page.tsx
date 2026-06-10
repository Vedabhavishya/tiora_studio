"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, User, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/db/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && step === "otp") {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer, step]);

  // Step 1: Handle Phone Input (Numeric only, max 10)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (error) setError("");
  };

  // Step 2: Handle OTP Input (Numeric only, max 6)
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    if (error) setError("");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setLoading(true);
    setError("");
    
    const isFirebaseEnabled = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    try {
      if (isFirebaseEnabled) {
        // Initialize invisible ReCAPTCHA verifier
        const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
        
        // Request Firebase OTP sending (requires E.164 phone format)
        const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier);
        setConfirmationResult(confirmation);
      } else {
        console.log("[DEV MODE] Firebase credentials missing. Falling back to mock OTP flow.");
      }
      
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      console.error("OTP Error:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setLoading(true);
    setError("");
    
    const isFirebaseEnabled = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    try {
      let idToken = null;

      if (isFirebaseEnabled) {
        if (!confirmationResult) {
          throw new Error("Verification session expired. Please request a new OTP.");
        }
        const result = await confirmationResult.confirm(otp);
        idToken = await result.user.getIdToken();
      }

      // Proactively set the session cookie client-side to prevent Playwright race conditions
      // where page.goto('/') is called immediately after clicking Verify.
      const cookieValue = idToken || phone;
      document.cookie = `auth_session=${cookieValue}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;

      // Sync session credentials with the backend
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, idToken }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }
      
      if (data.isNewUser) {
        setStep("profile");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, fullName }),
      });
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to save profile");
      }
      
      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error("Profile error:", err);
      setError(err.message || "Failed to complete profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4 selection:bg-brand-accent/30 font-inter">
      {/* Hidden container for Firebase Recaptcha */}
      <div id="recaptcha-container"></div>

      <div className="absolute top-8 left-8">
        <Link href="/" className="inline-flex items-center space-x-2 text-brand/60 hover:text-brand transition text-sm font-medium">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white border border-brand/10 rounded-2xl p-10 shadow-2xl border-t-8 border-t-brand-accent transform transition-all">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand flex items-center justify-center text-brand-accent font-bold text-3xl shadow-lg rotate-3 hover:rotate-0 transition-transform">
            A
          </div>
          <h2 className="text-3xl font-playfair font-bold text-brand mb-3">
            {step === "profile" ? "Welcome to Ashwaah" : "Sign In"}
          </h2>
          <p className="text-brand/60 text-sm leading-relaxed px-4">
            {step === "phone" && "Enter your 10-digit mobile number to access your custom fits."}
            {step === "otp" && `We've sent a 6-digit verification code to +91 ${phone}`}
            {step === "profile" && "One last step! Tell us your name to personalize your experience."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl text-center animate-pulse">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Number */}
        {step === "phone" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase mb-2 tracking-[0.2em] ml-1">Mobile Number</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 border-r border-brand/10 pr-3">
                  <Phone size={14} className="text-brand-accent" />
                  <span className="text-brand font-bold text-sm">+91</span>
                </div>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10 digits" 
                  className="w-full bg-brand/5 border-2 border-transparent focus:border-brand-accent/30 focus:bg-white rounded-xl py-4 pl-20 pr-4 text-brand font-bold tracking-widest placeholder:text-brand/20 placeholder:tracking-normal transition-all outline-none"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || phone.length !== 10} 
              className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase mb-2 tracking-[0.2em] ml-1">Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={18} />
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder="0 0 0 0 0 0" 
                  className="w-full bg-brand/5 border-2 border-transparent focus:border-brand-accent/30 focus:bg-white rounded-xl py-4 px-12 text-brand font-mono font-bold text-center text-2xl tracking-[0.5em] placeholder:text-brand/10 placeholder:tracking-normal transition-all outline-none"
                  required
                />
              </div>
              <div className="flex justify-between mt-4 px-1">
                <button type="button" onClick={() => setStep("phone")} className="text-xs text-brand/40 hover:text-brand font-bold transition-colors">Change Number</button>
                <button 
                  type="button" 
                  onClick={handleSendOTP}
                  disabled={timer > 0 || loading}
                  className={`text-xs font-bold ${timer > 0 ? "text-brand/30 cursor-not-allowed" : "text-brand-accent hover:underline"}`}
                >
                  {timer > 0 ? `Resend in ${timer}s` : "Resend Code"}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Verify & Login</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Profile Setup */}
        {step === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand/40 uppercase mb-2 tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-accent" size={18} />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Kapoor" 
                  className="w-full bg-brand/5 border-2 border-transparent focus:border-brand-accent/30 focus:bg-white rounded-xl py-4 px-12 text-brand font-bold transition-all outline-none"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading || !fullName.trim()} 
              className="w-full bg-brand text-white font-bold py-4 rounded-xl shadow-lg hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex justify-center items-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Complete Setup</span>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="mt-10 text-center text-[10px] text-brand/40 max-w-xs leading-relaxed uppercase tracking-widest font-bold">
        Secure login powered by Ashwaah. By continuing, you agree to our <a href="#" className="text-brand hover:underline">Terms</a> & <a href="#" className="text-brand hover:underline">Privacy</a>.
      </p>
    </div>
  );
}
