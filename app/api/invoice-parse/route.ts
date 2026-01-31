import { NextResponse } from "next/server";

type InvoiceParseResult = {
  invoiceId?: string;
  vendorName?: string;
  payerName?: string;
  vendorAddress?: string;
  amount?: string;
  description?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: string;
};

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You extract invoice fields from images and return ONLY JSON. Fields: invoiceId, vendorName, payerName, vendorAddress, amount, description, issueDate, dueDate, lineItems. Use empty string if missing.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract invoice data and return JSON.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: errorText }, { status: 500 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "{}";

    let parsed: InvoiceParseResult = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    return NextResponse.json({ result: parsed });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to parse invoice" },
      { status: 500 }
    );
  }
}