import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),rgba(255,255,255,0))]"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/intelliax-logo.png" 
              alt="Intelliax" 
              className="h-14 w-auto drop-shadow-lg"
            />
          </div>

          {/* Bottom Content */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight drop-shadow-md">
              Build Intelligent<br />AI Agents
            </h2>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Create, deploy, and manage powerful AI agents that automate workflows and enhance productivity.
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">500+</p>
                <p className="text-sm text-white/70">Active Agents</p>
              </div>
              <div>
                <p className="text-3xl font-bold">1M+</p>
                <p className="text-sm text-white/70">Conversations</p>
              </div>
              <div>
                <p className="text-3xl font-bold">99.9%</p>
                <p className="text-sm text-white/70">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img 
              src="/intelliax-logo.png" 
              alt="Intelliax" 
              className="h-12 w-auto"
            />
          </div>

          {/* Sign In Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to continue to Intelliax</p>
          </div>

          {/* Clerk Sign In Component */}
          <ClerkSignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-white shadow-none border-0 p-0",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl h-12 font-semibold transition-all shadow-sm",
                socialButtonsBlockButtonText: "font-semibold text-sm",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12 font-semibold transition-all shadow-md hover:shadow-lg",
                formFieldInput: "bg-white border-2 border-gray-200 text-gray-900 rounded-xl h-12 px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400",
                formFieldLabel: "text-gray-700 text-sm font-semibold mb-2",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold",
                identityPreviewText: "text-gray-900",
                identityPreviewEditButton: "text-blue-600 hover:text-blue-700",
                formFieldInputShowPasswordButton: "text-gray-500 hover:text-gray-700",
                dividerLine: "bg-gray-200",
                dividerText: "text-gray-500 text-sm",
                footer: "bg-white border-t border-gray-100 mt-8 pt-6",
                footerActionText: "text-gray-600",
                logoBox: "hidden",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            routing="path"
            path="/signin"
            signUpUrl="/signup"
            redirectUrl="/"
            afterSignInUrl="/"
          />
          
          {/* Terms */}
          <p className="text-center text-xs text-gray-500 mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
