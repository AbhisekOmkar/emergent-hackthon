import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

export default function SignUp() {
  return (
    <div className="min-h-screen flex bg-black">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/intelliax-logo.png" 
              alt="Intelliax" 
              className="h-14 w-auto"
            />
          </div>

          {/* Bottom Content */}
          <div className="space-y-6">
            <h2 className="text-5xl font-bold leading-tight">
              Start Building<br />Today
            </h2>
            <p className="text-xl text-white/80 max-w-md leading-relaxed">
              Join thousands of teams using Intelliax to build and deploy AI agents at scale.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#1a1a1a]">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <img 
              src="/intelliax-logo.png" 
              alt="Intelliax" 
              className="h-12 w-auto"
            />
          </div>

          {/* Clerk Sign Up Component - Full Component */}
          <ClerkSignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-0 p-0",
                headerTitle: "text-2xl font-bold text-white mb-2",
                headerSubtitle: "text-gray-400 text-sm",
                socialButtonsBlockButton: "bg-transparent border border-gray-700 text-white hover:bg-gray-800 hover:border-gray-600 rounded-lg h-12 font-medium transition-all",
                socialButtonsBlockButtonText: "font-medium",
                formButtonPrimary: "bg-white text-black hover:bg-gray-100 rounded-lg h-12 font-semibold transition-all",
                formFieldInput: "bg-transparent border border-gray-700 text-white rounded-lg h-12 px-4 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-500",
                formFieldLabel: "text-gray-400 text-sm font-medium mb-2",
                footerActionLink: "text-blue-400 hover:text-blue-300 font-medium",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                dividerLine: "bg-gray-700",
                dividerText: "text-gray-500 text-sm",
                footer: "bg-transparent border-t border-gray-800 mt-8 pt-4",
                footerActionText: "text-gray-400",
                logoBox: "hidden",
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
  );
}
