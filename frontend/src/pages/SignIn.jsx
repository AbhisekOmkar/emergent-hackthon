import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { CheckCircle2 } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex bg-white font-sans text-slate-900">
      {/* Left Side - Dark Premium Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#09090b] text-white flex-col justify-between p-12 lg:p-16">
        {/* Abstract Ambient Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-500/10 blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Intelliax
            </span>
          </div>

          {/* Main Text */}
          <div className="space-y-8 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              The operating system for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">AI Agents</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Build, deploy, and orchestrate intelligent agents that work alongside your team. Enterprise-grade reliability meets cutting-edge capability.
            </p>
            
            {/* Features/Stats */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Enterprise Ready</span>
                </div>
                <p className="text-sm text-zinc-500 pl-7">SOC2 Type II compliant security</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">99.99% Uptime</span>
                </div>
                <p className="text-sm text-zinc-500 pl-7">Reliability you can trust</p>
              </div>
            </div>
          </div>

          {/* Testimonial or Footer */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-sm text-zinc-500">
              Trusted by forward-thinking companies worldwide
            </p>
            <div className="flex gap-6 mt-4 opacity-50 grayscale mix-blend-screen">
              <div className="h-6 w-20 bg-white/20 rounded"></div>
              <div className="h-6 w-20 bg-white/20 rounded"></div>
              <div className="h-6 w-20 bg-white/20 rounded"></div>
              <div className="h-6 w-20 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white lg:bg-zinc-50/30">
        <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.05)]">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-2">Enter your credentials to access your account</p>
          </div>

          {/* Clerk Component */}
          <ClerkSignIn 
            appearance={{
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
              variables: {
                colorPrimary: '#4f46e5', // indigo-600
                fontFamily: 'inherit',
                borderRadius: '0.5rem',
              },
              elements: {
                // Main containers
                rootBox: "w-full",
                card: "w-full shadow-none border-0 p-0 bg-transparent gap-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                
                // Social Buttons
                socialButtonsBlockButton: "w-full min-h-[44px] bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2",
                socialButtonsBlockButtonText: "font-medium text-sm text-zinc-700",
                socialButtonsBlockButtonArrow: "hidden",
                
                // Divider
                dividerRow: "my-6",
                dividerLine: "bg-zinc-100 h-[1px]",
                dividerText: "text-zinc-400 text-xs font-medium uppercase tracking-wider bg-white px-2",
                
                // Form Fields
                formFieldRow: "mb-4 block",
                formFieldLabel: "block text-zinc-700 text-sm font-medium mb-1.5",
                formFieldInput: "w-full h-11 px-3 bg-white border border-zinc-200 text-zinc-900 rounded-lg focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-400 outline-none block box-border",
                formFieldAction: "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
                
                // Submit Button
                formButtonPrimary: "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-indigo-500/25 mt-2",
                
                // Footer
                footer: "hidden", // Hiding default footer to reduce clutter, layout issues
                
                // Alerts/Errors
                alert: "bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 text-sm mb-4",
                alertText: "text-red-600",
              }
            }}
            routing="path"
            path="/signin"
            signUpUrl="/signup"
            redirectUrl="/"
            afterSignInUrl="/"
          />
          
          {/* Custom Footer Links */}
          <div className="mt-6 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
