import { SignIn as ClerkSignIn } from "@clerk/clerk-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Video */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <iframe
            src="https://drive.google.com/file/d/1K8gNcui3wqtnW5YclI2xQScpR_9e-SNA/preview"
            className="w-full h-full"
            allow="autoplay; fullscreen"
            title="Intelliax Platform"
            style={{ border: 'none', pointerEvents: 'none' }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none"></div>

        {/* Content Overlay */}
        <div className="relative z-20 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/intelliax-logo.png" 
              alt="Intelliax" 
              className="h-12 w-auto"
            />
          </div>

          {/* Bottom Content */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Build Intelligent AI Agents
            </h2>
            <p className="text-lg text-white/90 max-w-md">
              Create, deploy, and manage powerful AI agents that automate workflows and enhance productivity.
            </p>
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
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Sign in to continue to Intelliax</p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="space-y-6">
            <ClerkSignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0 bg-transparent",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "w-full border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 font-semibold rounded-lg h-12 transition-all",
                  socialButtonsBlockButtonText: "font-semibold text-sm",
                  socialButtonsIconButton: "w-full border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 rounded-lg h-12 transition-all",
                  formButtonPrimary: "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-12 transition-all shadow-sm hover:shadow-md",
                  formFieldInput: "w-full border-2 border-gray-200 rounded-lg h-12 px-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-semibold transition-colors",
                  identityPreviewText: "text-gray-700",
                  formFieldLabel: "text-gray-700 font-semibold text-sm mb-2 block",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 text-sm px-2",
                  dividerRow: "my-6",
                  footer: "hidden",
                  formFieldRow: "mb-4",
                  otpCodeFieldInput: "border-2 border-gray-200 rounded-lg h-12",
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

            {/* Custom Footer */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </div>

          {/* Terms Footer */}
          <p className="text-center text-xs text-gray-500 mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
