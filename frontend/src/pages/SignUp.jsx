import { SignUp as ClerkSignUp } from "@clerk/clerk-react";

export default function SignUp() {
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
              Start Building<br />Today
            </h2>
            <p className="text-xl text-white/90 max-w-md leading-relaxed">
              Join thousands of teams using Intelliax to build and deploy AI agents at scale.
            </p>
            
            {/* Features */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/90 font-medium">No credit card required</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/90 font-medium">14-day free trial</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/90 font-medium">Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Sign Up Form */}
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

          {/* Sign Up Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">Get started with Intelliax today</p>
          </div>

          {/* Clerk Sign Up Component */}
          <ClerkSignUp 
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
            path="/signup"
            signInUrl="/signin"
            redirectUrl="/"
            afterSignUpUrl="/"
          />
          
          {/* Terms */}
          <p className="text-center text-xs text-gray-500 mt-8">
            By signing up, you agree to our{" "}
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
