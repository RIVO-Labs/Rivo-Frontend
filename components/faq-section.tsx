"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RiQuestionAnswerLine,
  RiSearchLine,
  RiArrowRightLine,
} from "react-icons/ri";
import Link from "next/link";

const faqs = [
  {
    question: "What is Rivo and how does it work?",
    answer:
      "Rivo is a platform for programmable work agreements on the Lisk blockchain. We create smart contracts that automatically execute payroll and milestone payments for global freelance teams. Your work agreement becomes code that enforces itself—no trust required.",
    icon: "📝",
  },
  {
    question: "How does escrow protect both parties?",
    answer:
      "When a company creates an agreement, they deposit funds into an escrow smart contract on Lisk. These funds are locked on-chain and cannot be withdrawn unilaterally. Freelancers are guaranteed payment when milestones are completed, and companies are protected because funds only release upon approval or predefined conditions.",
    icon: "🔒",
  },
  {
    question: "What happens if there's a dispute?",
    answer:
      "If a dispute occurs, the agreement enters a DISPUTED status and all funds remain locked on-chain. Neither party can withdraw funds unilaterally. Rivo doesn't judge who's right—we simply enforce the rules agreed upon at the start. Disputes can be resolved manually off-platform or through arbitration (future feature).",
    icon: "⚖️",
  },
  {
    question: "How do freelancers receive payment?",
    answer:
      "Freelancers receive payments in stablecoin (USDC) directly to their wallet. There's no bank transfer, no currency conversion, and no delays. Payments are settled instantly on the Lisk blockchain. The freelancer has full control of their funds—non-custodial and permissionless.",
    icon: "💰",
  },
  {
    question: "Why use blockchain for work agreements?",
    answer:
      "Blockchain provides trust minimization, automatic enforcement, transparency, and non-custodial funds. Traditional platforms control your money and can change rules. With Rivo, agreements execute automatically based on code, funds are held by smart contracts (not us), and all activity is recorded on-chain and immutable.",
    icon: "⛓️",
  },
  {
    question: "Is my money safe?",
    answer:
      "Yes. Funds are locked in audited smart contracts on the Lisk blockchain. Rivo never holds your funds—they're secured by code, not by a company. You can verify the smart contract yourself. All transactions are transparent on-chain, and only authorized actions (based on agreement rules) can release funds.",
    icon: "🛡️",
  },
  {
    question: "What if the company doesn't approve my milestone?",
    answer:
      "Agreements can include auto-release rules. For example: 'If no approval within 7 days, payment auto-releases.' This prevents companies from ghosting freelancers. Rules are coded into the smart contract at creation time and execute automatically—no human intervention needed.",
    icon: "⏰",
  },
  {
    question: "Can I cancel an agreement?",
    answer:
      "Agreement cancellation depends on the terms set at creation. Both parties can mutually agree to cancel and split remaining escrow. Unilateral cancellation may be allowed based on predefined conditions (e.g., no progress after 7 days). All rules are transparent and enforced by the smart contract.",
    icon: "❌",
  },
];


export function FaqSection() {
  return (
    <section className="py-24 relative bg-gradient-to-b from-muted/50 to-background">
      <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/25"></div>

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-3">
            SUPPORT
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about Rivo's programmable work agreements and how blockchain-powered escrow protects both companies and freelancers.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto bg-card rounded-xl border shadow-sm overflow-hidden px-8 py-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="border-b last:border-0 px-1"
                >
                  <AccordionTrigger className="text-left py-5 hover:no-underline group duration-300">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary shrink-0">
                        <span className="text-lg">{faq.icon}</span>
                      </div>
                      <span className="text-lg font-medium group-hover:text-primary transition-colors duration-300">
                        {faq.question}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pl-11">
                    <div className="pb-1">{faq.answer}</div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-muted rounded-xl p-8 max-w-3xl mx-auto">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <RiQuestionAnswerLine className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">
              Our dedicated support team is here to help you with any other
              questions you might have.
            </p>
            <Link href="mailto:anthonyef09@gmail.com">
              <Button className="px-6">
                Contact Support
                <RiArrowRightLine className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
