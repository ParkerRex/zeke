import { Hero } from "@/components/hero";
import { SectionFive } from "@/components/section-five";
import { SectionFour } from "@/components/section-four";
import { SectionOne } from "@/components/section-one";
import { SectionSeven } from "@/components/section-seven";
import { SectionSix } from "@/components/section-six";
import { SectionThree } from "@/components/section-three";
import { SectionTwo } from "@/components/section-two";
import SectionStories from "./section-stories";
import { SectionVideo } from "./section-video";
import { SourceLogos } from "./testimonials";

export function StartPage() {
  return (
    <>
      <Hero />
      <SectionStories />
      <SectionOne />
      <SectionTwo />
      <SectionThree />
      <SectionFour />
      <SectionFive />
      <SectionSix />
      <SectionSeven />
      <SectionVideo />
      <SourceLogos />
    </>
  );
}
