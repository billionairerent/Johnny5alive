import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {APP_NAME}
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          Find strong-fit roles, tailor ATS-friendly resumes, generate grounded
          cover letters, and track every application — without faking
          qualifications or losing control.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
