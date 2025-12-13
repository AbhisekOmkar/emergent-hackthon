import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { Sparkles } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Video */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
        {/* Video Background */}
        <div className="absolute inset-0">
          <iframe
            src="https://drive.google.com/file/d/1K8gNcui3wqtnW5YclI2xQScpR_9e-SNA/preview"
            className="w-full h-full object-cover"
            allow="autoplay"
            title="Intelliax Platform"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Intelliax</h1>
              <p className="text-sm text-white/80">AI Agent Platform</p>
            </div>
          </div>

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
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Intelliax</h1>
              <p className="text-sm text-gray-600">AI Agent Platform</p>
            </div>
          </div>

          {/* Clerk Sign In Component */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-600">Sign in to continue to Intelliax</p>
            </div>

            <ClerkSignIn 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0 p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "border-gray-200 hover:bg-gray-50 text-gray-700 font-medium",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg h-11",
                  formFieldInput: "border-gray-200 rounded-lg h-11",
                  footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
                  identityPreviewText: "text-gray-700",
                  formFieldLabel: "text-gray-700 font-medium",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500",
                },
              }}
              routing="path"
              path="/signin"
              signUpUrl="/signup"
              redirectUrl="/"
              afterSignInUrl="/"
            />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-6">
            By signing in, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
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
