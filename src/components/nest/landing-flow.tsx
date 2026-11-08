import { useEffect, useState } from "react";
import { Check, ReceiptText, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const stages = [
  { label: "One bill", Icon: ReceiptText },
  { label: "Fair shares", Icon: Users },
  { label: "All square", Icon: Check },
];

export function LandingFlow() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const interval = window.setInterval(() => {
      if (!motion.matches && !document.hidden) setStage(value => (value + 1) % stages.length);
    }, 2600);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="landing-flow" role="group" aria-label="Bill splitting preview">
      {stages.map(({ label, Icon }, index) => (
        <div className="landing-flow-step" key={label}>
          {index > 0 && <span className="landing-flow-link" aria-hidden="true"><ArrowRight /></span>}
          <Button variant="ghost" className="landing-flow-control" aria-pressed={stage === index}
            onClick={() => setStage(index)}>
            <span className="landing-flow-symbol"><Icon /></span>
            <span>{label}</span>
          </Button>
        </div>
      ))}
    </div>
  );
}