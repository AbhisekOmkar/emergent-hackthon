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

          {/* Powered By Footer */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-base text-zinc-400 mb-5 font-medium">
              Powered by
            </p>
            <div className="flex items-center gap-10">
              <img 
                src="https://customer-assets.emergentagent.com/job_71444cca-a516-4d2f-9222-616056355b0f/artifacts/3r30lby4_21f24c4d-1107-4dcf-97f2-9c2cc39feec3_1081x214-removebg-preview.png" 
                alt="Entrepreneurs First" 
                className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
              <img 
                src="https://customer-assets.emergentagent.com/job_71444cca-a516-4d2f-9222-616056355b0f/artifacts/50lbzk7p_Emergent-removebg-preview.png" 
                alt="Emergent" 
                className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
              />
              <img 
                src="https://customer-assets.emergentagent.com/job_71444cca-a516-4d2f-9222-616056355b0f/artifacts/zmr2g7rw_OpenAI_Logo.svg.png" 
                alt="OpenAI" 
                className="h-7 object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
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
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create Account</h2>
            <p className="text-sm text-slate-500 mt-2">Start your 14-day free trial</p>
          </div>

          {/* Clerk Component */}
          <ClerkSignUp 
            appearance={{
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
              variables: {
                colorPrimary: '#4f46e5',
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
                
                // Submit Button
                formButtonPrimary: "w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-indigo-500/25 mt-2",
                
                // Footer
                footer: "hidden",
                
                // Alerts/Errors
                alert: "bg-red-50 border border-red-100 text-red-600 rounded-lg p-3 text-sm mb-4",
                alertText: "text-red-600",
              }
            }}
            routing="path"
            path="/signup"
            signInUrl="/signin"
            redirectUrl="/"
            afterSignUpUrl="/"
          />
          
          {/* Custom Footer Links */}
          <div className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a href="/signin" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
