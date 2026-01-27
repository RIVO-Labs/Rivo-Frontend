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
    question: "What is RIVO and how does it work?",
    answer:
      "RIVO is a payment platform that simplifies account payable and payroll for Indonesian businesses. We enable companies to create QR invoices for suppliers and process batch payroll using IDRX stablecoin on Base. It's designed with familiar UX for Indonesian users while leveraging blockchain for transparency.",
    icon: "💰",
  },
  {
    question: "How do QR invoices work?",
    answer:
      "Companies create invoices with QR codes, similar to QRIS. Suppliers scan the QR code and click pay to settle using IDRX stablecoin. No need to copy wallet addresses or worry about errors. The familiar QR payment experience makes it easy for Indonesian suppliers to get paid quickly.",
    icon: "📱",
  },
  {
    question: "What is IDRX and why do you use it?",
    answer:
      "IDRX is a Rupiah-pegged stablecoin, meaning 1 IDRX ≈ 1 IDR. We use IDRX because it's designed for Indonesian businesses, eliminating currency conversion complexity. Payments settle on-chain in a currency that Indonesian users understand and trust.",
    icon: "🇮🇩",
  },
  {
    question: "How does batch payroll work?",
    answer:
      "You can select multiple employees, set their salaries in IDRX, and execute all payments with one click. The system processes all transfers simultaneously on Base blockchain. Employees receive IDRX directly to their wallets instantly, with full transparency and on-chain verification.",
    icon: "👥",
  },
  {
    question: "Do users need to understand blockchain?",
    answer:
      "Not at all! RIVO is designed with consumer-grade UX. Gas fees are sponsored, wallets are handled seamlessly with OnchainKit, and the interface feels like familiar Indonesian payment apps. Users interact with IDRX payments without needing to understand the underlying blockchain technology.",
    icon: "✨",
  },
  {
    question: "Is RIVO secure and reliable?",
    answer:
      "Yes. RIVO operates on Base, a secure Layer 2 blockchain. All transactions are transparent, immutable, and verifiable on-chain. We use audited smart contracts and sponsor gas fees to ensure smooth operations. Your IDRX payments are settled directly between parties without RIVO holding funds.",
    icon: "🛡️",
  },
  {
    question: "How does the AI assistant work?",
    answer:
      "The AI assistant helps you create invoices and payroll with natural language. For example, say 'Pay all developers 12M IDRX for January' and it will populate the form. However, AI only helps with data entry—you always have full manual control over payment execution.",
    icon: "⏰",
  },
  {
    question: "Can I integrate RIVO with my existing systems?",
    answer:
      "RIVO is designed as a standalone payment solution for account payable and payroll. While we focus on simple UX, all transactions are recorded on-chain for easy reconciliation with your existing accounting systems. API integration is planned for future releases.",
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
            Everything you need to know about RIVO's QR invoice system, IDRX payments, and how we're simplifying business payments for Indonesian companies.
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
