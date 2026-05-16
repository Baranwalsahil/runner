import Hero from "../components/landing/Hero.jsx";
import FeatureGrid from "../components/landing/FeatureGrid.jsx";
import MapPreview from "../components/landing/MapPreview.jsx";
import CtaBanner from "../components/landing/CtaBanner.jsx";

export default function Landing() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <MapPreview />
      <CtaBanner />
    </>
  );
}
