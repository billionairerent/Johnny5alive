import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[size];

  return (
    <Link href="/" className={`${textSize} font-bold tracking-tight`}>
      <span className="text-brand-600">Auto</span>
      <span className="text-gray-900">Apply</span>
      <span className="text-brand-600">AI</span>
    </Link>
  );
}
