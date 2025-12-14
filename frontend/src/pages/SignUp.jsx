import { SignUp as ClerkSignUp } from "@clerk/clerk-react";
import { Zap, Shield, Users } from "lucide-react";

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
          <div className="flex items-center">
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              IntelliAX
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
                className="h-12 object-contain brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
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
        {/* Mobile Logo */}
        <div className="lg:hidden flex justify-center mb-6">
          <span className="text-2xl font-bold text-slate-900">IntelliAX</span>
        </div>

        {/* Clerk Component Only */}
        <ClerkSignUp 
          appearance={{
            layout: {
              socialButtonsPlacement: "top",
              socialButtonsVariant: "blockButton",
              showOptionalFields: false,
            },
            variables: {
              colorPrimary: '#4f46e5',
              colorText: '#18181b',
              colorTextSecondary: '#71717a',
              colorBackground: '#ffffff',
              colorInputBackground: '#ffffff',
              colorInputText: '#18181b',
              fontFamily: 'Inter, system-ui, sans-serif',
              borderRadius: '0.75rem',
              spacingUnit: '1rem',
            },
            elements: {
              // Root & Card
              rootBox: "w-full max-w-[420px]",
              card: "w-full bg-white p-8 sm:p-10 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.05),0_4px_16px_rgba(0,0,0,0.08)]",
              
              // Header
              headerTitle: "text-2xl font-bold text-zinc-900 text-center",
              headerSubtitle: "text-sm text-zinc-500 text-center mt-2",
              
              // Social Buttons
              socialButtons: "w-full grid grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100",
              socialButtonsBlockButton: "w-full h-12 bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2",
              socialButtonsBlockButtonText: "font-medium text-sm text-zinc-700",
              socialButtonsBlockButtonArrow: "hidden",
              socialButtonsProviderIcon: "w-5 h-5",
              
              // Divider
              dividerRow: "w-full my-6 flex items-center gap-4",
              dividerLine: "flex-1 bg-zinc-200 h-px",
              dividerText: "text-zinc-400 text-xs font-medium uppercase tracking-wider",
              
              // Form
              form: "w-full space-y-4",
              formFieldRow: "w-full",
              formFieldLabel: "block text-zinc-700 text-sm font-medium mb-2",
              formFieldInput: "w-full h-12 px-4 bg-white border border-zinc-200 text-zinc-900 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-zinc-400 outline-none text-sm",
              formFieldAction: "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
              formFieldHintText: "text-xs text-zinc-500 mt-1",
              
              // Submit Button
              formButtonPrimary: "w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 mt-4",
              
              // Footer
              footer: "mt-6 text-center",
              footerActionText: "text-sm text-zinc-500",
              footerActionLink: "text-indigo-600 hover:text-indigo-700 font-medium ml-1",
              
              // Alerts
              alert: "w-full bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm",
              alertText: "text-red-700",
              
              // Other elements
              identityPreview: "w-full bg-zinc-50 rounded-lg p-4",
              identityPreviewText: "text-sm text-zinc-700",
              identityPreviewEditButton: "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
              formResendCodeLink: "text-indigo-600 hover:text-indigo-700 text-sm font-medium",
              otpCodeFieldInput: "w-12 h-12 text-center border border-zinc-200 rounded-lg text-lg font-semibold",
            }
          }}
          routing="path"
          path="/signup"
          signInUrl="/signin"
          fallbackRedirectUrl="/"
        />
      </div>
    </div>
  );
}
