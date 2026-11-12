import { useState } from "react";
import { ArrowRight, Check, CheckCircle2, ReceiptText, RotateCcw, Utensils, House, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import usdcLogo from "@/assets/tokens/usdc.png.asset.json";

const EXAMPLES = [
  { label: "Dinner", total: 120, icon: Utensils },
  { label: "Rent", total: 1800, icon: House },
  { label: "Trip", total: 480, icon: Plane },
];

/** Interactive illustration only — never writes wallet or contract state. */
export function HeroProduct() {
  const [example, setExample] = useState(0);
  const [stage, setStage] = useState<"bill" | "split" | "receipt">("bill");
  const selected = EXAMPLES[example];
  const share = selected.total / 3;
  return (
    <div className="hero-product-stage hero-experience" aria-label="Interactive settlement example">
      <div className="hero-product" data-stage={stage}>
        <div className="hero-product-heading flex items-center justify-between gap-3">
          <div className="hero-example-tabs flex gap-1" aria-label="Example expenses">
            {EXAMPLES.map((item, index) => <Button key={item.label} variant="ghost" size="sm" aria-pressed={example === index} onClick={() => { setExample(index); setStage("bill"); }}><item.icon className="h-3.5 w-3.5" />{item.label}</Button>)}
          </div>
          <span className="hero-example-label"><span />Example workspace</span>
        </div>
        <div className="hero-example-body">
          <div className="hero-example-amount">
            <p className="text-xs text-muted-foreground">{stage === "receipt" ? "Everyone’s square" : `${selected.label} for three`}</p>
            <p className="hero-example-total font-display font-semibold tabular-nums">{selected.total.toLocaleString()}<span>.00</span></p>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><img src={usdcLogo.url} alt="USDC" className="h-6 w-6" /> USDC</p>
            <p className="hero-example-members"><span className="hero-example-people" aria-hidden="true"><span>Y</span><span>M</span><span>L</span></span>3 members</p>
          </div>
          <div className="hero-example-result" aria-live="polite">
            {stage === "receipt" ? <div className="hero-mini-receipt" key="receipt">
              <div className="flex items-center justify-between"><ReceiptText className="h-5 w-5" /><span className="hero-receipt-stamp"><CheckCircle2 className="h-4 w-4" /> ALL SQUARE</span></div>
              <p className="mt-4 font-display text-lg font-semibold">Good times. No loose ends.</p>
              <div className="mt-4 flex justify-between border-t border-dashed border-border pt-3 text-xs"><span>3 people · {selected.label}</span><span>{selected.total}.00 USDC</span></div>
              <p className="mt-3 text-[10px] text-muted-foreground">Example receipt · No funds moved</p>
            </div> : <table className="hero-example-shares" key={stage}>
              <caption className="sr-only">{selected.label} example member allocations in USDC</caption>
              <thead><tr><th scope="col">Member</th><th scope="col">{stage === "bill" ? "Paid · USDC" : "Share · USDC"}</th></tr></thead>
              <tbody>{["You", "Maya", "Leo"].map((name, index) => <tr key={name}>
                <th scope="row"><span className="hero-member"><span className="hero-share-avatar">{name[0]}</span><span>{name}<small>{index === 0 ? "Expense payer" : "Member"}</small></span></span></th>
                <td><span className="hero-share-value">{stage === "bill" ? (index === 0 ? selected.total.toFixed(2) : "—") : share.toFixed(2)}{stage === "split" && <Check className="h-3.5 w-3.5 text-success" />}</span></td>
              </tr>)}</tbody>
            </table>}
          </div>
        </div>
        <div className="hero-example-footer">
          <div className="hero-example-progress" aria-label={`Step ${stage === "bill" ? 1 : stage === "split" ? 2 : 3} of 3`}><span data-active={stage === "bill"}>01 <span>One bill</span></span><span data-active={stage === "split"}>02 <span>Fair shares</span></span><span data-active={stage === "receipt"}>03 <span>All square</span></span></div>
          <Button className="rounded-full bg-foreground text-background hover:bg-foreground/90" onClick={() => setStage(stage === "bill" ? "split" : stage === "split" ? "receipt" : "bill")}>
            {stage === "bill" ? "Split this bill" : stage === "split" ? "Preview settlement" : "Try again"}{stage === "receipt" ? <RotateCcw /> : <ArrowRight />}
          </Button>
        </div>
      </div>
    </div>
  );
}
