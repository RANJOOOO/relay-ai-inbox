import Anthropic from "@anthropic-ai/sdk";

export type Priority = "urgent" | "high" | "normal" | "low";
export type Category = "billing" | "bug" | "account" | "feature" | "refund" | "other";
export type Sentiment = "angry" | "neutral" | "happy";

export type Triage = {
  priority: Priority;
  category: Category;
  sentiment: Sentiment;
  summary: string;
  draftReply: string;
  source: "claude" | "rules";
};

export type TriageInput = {
  fromName: string;
  subject: string;
  body: string;
  workspaceName: string;
};

const PRIORITIES: Priority[] = ["urgent", "high", "normal", "low"];
const CATEGORIES: Category[] = ["billing", "bug", "account", "feature", "refund", "other"];
const SENTIMENTS: Sentiment[] = ["angry", "neutral", "happy"];

export function hasClaudeKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function triage(input: TriageInput): Promise<Triage> {
  if (hasClaudeKey()) {
    try {
      return await triageWithClaude(input);
    } catch (err) {
      console.error("Claude triage failed, falling back to rules", err);
    }
  }
  return triageWithRules(input);
}

async function triageWithClaude(input: TriageInput): Promise<Triage> {
  const client = new Anthropic();
  const system = `You triage inbound customer support email for ${input.workspaceName}.
Return ONLY a JSON object with these keys:
priority: one of urgent|high|normal|low (urgent = customer is blocked, data loss, security, or money wrongly taken; high = broken feature or angry customer; normal = question or request; low = praise, newsletter, spam).
category: one of billing|bug|account|feature|refund|other.
sentiment: one of angry|neutral|happy.
summary: one sentence, max 18 words, plain English, what the customer needs.
draftReply: a reply the support agent can send with at most one small edit. 60-120 words. Warm, direct, no corporate filler, no apologies longer than one short sentence. Use the customer's first name. Sign off as "${input.workspaceName} Support". If information is missing, ask for exactly one thing.`;

  const res = await client.messages.create({
    model: "claude-haiku-5-5",
    max_tokens: 600,
    system,
    messages: [
      {
        role: "user",
        content: `From: ${input.fromName}\nSubject: ${input.subject}\n\n${input.body}`,
      },
    ],
  });

  const text = res.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

  return {
    priority: PRIORITIES.includes(json.priority) ? json.priority : "normal",
    category: CATEGORIES.includes(json.category) ? json.category : "other",
    sentiment: SENTIMENTS.includes(json.sentiment) ? json.sentiment : "neutral",
    summary: String(json.summary ?? "").slice(0, 200),
    draftReply: String(json.draftReply ?? "").slice(0, 1500),
    source: "claude",
  };
}

// Deterministic fallback so the product works with no API key at all.
export function triageWithRules(input: TriageInput): Triage {
  const t = `${input.subject}\n${input.body}`.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));

  let category: Category = "other";
  if (has("refund", "money back", "charge back", "chargeback")) category = "refund";
  else if (has("invoice", "charged", "billing", "payment", "card", "subscription", "price")) category = "billing";
  else if (has("error", "crash", "bug", "broken", "doesn't work", "does not work", "500", "fails", "stuck")) category = "bug";
  else if (has("password", "login", "log in", "2fa", "locked out", "sign in", "account", "delete my")) category = "account";
  else if (has("feature", "would be great", "could you add", "wish", "suggestion", "integration")) category = "feature";

  let sentiment: Sentiment = "neutral";
  if (has("unacceptable", "ridiculous", "furious", "angry", "terrible", "worst", "!!", "disappointed", "cancel")) sentiment = "angry";
  else if (has("love", "thank you so much", "great job", "awesome", "amazing")) sentiment = "happy";

  let priority: Priority = "normal";
  if (has("urgent", "asap", "immediately", "production", "all our users", "data loss", "lost data", "security", "hacked", "charged twice", "double charged")) priority = "urgent";
  else if (category === "bug" || sentiment === "angry" || category === "refund") priority = "high";
  else if (sentiment === "happy" || has("unsubscribe", "newsletter", "partnership opportunity")) priority = "low";

  const first = input.fromName.split(" ")[0] || "there";
  const summaries: Record<Category, string> = {
    billing: "Customer has a question or problem with a charge or invoice.",
    bug: "Customer reports something in the product not working as expected.",
    account: "Customer needs help getting into or changing their account.",
    feature: "Customer is asking for a capability the product does not have yet.",
    refund: "Customer is asking for money back.",
    other: "General message that needs a human read.",
  };
  const replies: Record<Category, string> = {
    billing: `Hi ${first},\n\nThanks for flagging this. I've pulled up the charge on your account and I'm checking it against your plan now. Could you confirm the last four digits of the card so I can match the right transaction? As soon as I have that I'll either explain the line item or reverse it, usually within the hour.\n\n${input.workspaceName} Support`,
    bug: `Hi ${first},\n\nSorry about that, it should not be happening. I've reproduced the steps you described and passed it to the engineer on call. Could you tell me which browser and version you're on, so we can confirm the fix covers your setup? I'll update you here as soon as it's out.\n\n${input.workspaceName} Support`,
    account: `Hi ${first},\n\nHappy to help you get back in. For security I need to verify it's you: reply from the email address on the account, or send the last invoice number. Once I have that I'll reset access and you'll get a sign-in link within a few minutes.\n\n${input.workspaceName} Support`,
    feature: `Hi ${first},\n\nThat's a good idea, and you're not the first to ask. I've added your note to the request so the product team sees the exact use case. I can't promise a date, but I'll let you know the moment it ships. Is there a workaround you'd like me to suggest in the meantime?\n\n${input.workspaceName} Support`,
    refund: `Hi ${first},\n\nUnderstood. I've started the refund on my side; it usually lands back on the original card within 5 to 7 business days. You'll get a confirmation email once it's processed. If there's anything that would have changed your mind, I'd genuinely like to hear it.\n\n${input.workspaceName} Support`,
    other: `Hi ${first},\n\nThanks for getting in touch. I've read your message and I want to make sure I point you to the right person. Could you tell me a little more about what you're trying to do? I'll take it from there.\n\n${input.workspaceName} Support`,
  };

  return {
    priority,
    category,
    sentiment,
    summary: summaries[category],
    draftReply: replies[category],
    source: "rules",
  };
}
