import { Hero } from "@/components/everrae/hero";
import { Features, Showcase } from "@/components/everrae/features";
import { HowItWorks, Templates, Pricing, FAQ, Footer } from "@/components/everrae/landing-sections";
import { ScrollMotion } from "@/components/everrae/scroll-motion";
import "./scroll-motion.css";
export default function Home(){
  return <div className="everrae"><ScrollMotion/><Hero/><Features/><Showcase/><HowItWorks/><Templates/><Pricing/><FAQ/><Footer/></div>;
}
