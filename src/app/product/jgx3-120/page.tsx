import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import ProductHero from "@/components/ProductHero";
import ProductGallery from "@/components/ProductGallery";
import ProductDetails from "@/components/ProductDetails";
import FeatureGrid from "@/components/FeatureGrid";
import SpecTable from "@/components/SpecTable";
import InTheBox from "@/components/InTheBox";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "JGX3-120 Laser Cannon 120W | LaserPlays",
  description:
    "JGX3-120 Laser Cannon — 120W output, 10m effective range, 18.5V dual battery system, active dual-fan cooling. Professional-grade laser equipment.",
  openGraph: {
    title: "JGX3-120 Laser Cannon 120W | LaserPlays",
    description:
      "120W laser output. 10m range. Dual battery system. Professional precision.",
    type: "website",
  },
};

export default function JGX3Page() {
  return (
    <main>
      <Navbar />
      <ProductHero />
      <ProductDetails />
      <ProductGallery />
      <FeatureGrid />
      <SpecTable />
      <InTheBox />
      <Footer />
    </main>
  );
}
