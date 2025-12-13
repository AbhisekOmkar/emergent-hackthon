import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { CheckCircle2, Zap, Shield, Users } from "lucide-react";

export default function SignUp() {
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
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Join the future of <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Intelligent Automation</span>
            </h1>
            
            {/* Features List */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Instant Deployment</h3>
                  <p className="text-sm text-zinc-400">Launch agents in seconds, not days</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Enterprise Security</h3>
                  <p className="text-sm text-zinc-400">Bank-grade encryption & compliance</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Team Collaboration</h3>
                  <p className="text-sm text-zinc-400">Built for modern product teams</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="text-sm text-zinc-500">
            © 2025 Intelliax Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white lg:bg-zinc-50/50">
        <div className="w-full max-w-[400px] flex flex-col items-center bg-white lg:p-10 lg:rounded-2xl lg:shadow-xl lg:shadow-zinc-200/50 lg:border lg:border-zinc-100">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8 w-full">
            <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
            <p className="text-slate-500 mt-2">Start your 14-day free trial</p>
          </div>

          {/* Clerk Component */}
          <div className="w-full">
            <ClerkSignUp 
              appearance={{
                elements: {
                  rootBox: "w-full flex justify-center",
                  card: "w-full shadow-none border-0 p-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "w-full bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg h-10 font-medium transition-all",
                  socialButtonsBlockButtonText: "font-medium text-sm",
                  formButtonPrimary: "w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-10 font-medium transition-all shadow-sm hover:shadow-indigo-500/25",
                  formFieldInput: "w-full bg-white border border-zinc-200 text-zinc-900 rounded-lg h-10 px-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-400 box-border",
                  formFieldLabel: "text-zinc-700 text-sm font-medium mb-1.5",
                  footerActionLink: "text-indigo-600 hover:text-indigo-700 font-medium",
                  identityPreviewText: "text-zinc-700",
                  identityPreviewEditButton: "text-indigo-600 hover:text-indigo-700",
                  formFieldInputShowPasswordButton: "text-zinc-400 hover:text-zinc-600",
                  dividerLine: "bg-zinc-100",
                  dividerText: "text-zinc-400 text-xs uppercase tracking-wider bg-white px-2",
                  footer: "w-full bg-transparent border-t border-zinc-100 mt-6 pt-6 flex justify-center",
                  footerActionText: "text-zinc-500",
                  logoBox: "hidden",
                  main: "w-full gap-4",
                  form: "w-full gap-4"
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "blockButton",
                },
              }}
              routing="path"
              path="/signup"
              signInUrl="/signin"
              redirectUrl="/"
              afterSignUpUrl="/"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
