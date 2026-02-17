import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AGENTS = [
  "agent_1",
  "agent_2",
  "agent_3",
  "agent_4",
  "agent_5",
  "agent_6",
  "agent_7",
  "agent_8",
  "agent_9",
  "agent_10",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const GOOD_SALES = [
  "Agent identified needs, built value, handled objections, and closed successfully.",
  "Clear discovery, strong trust, customer agreed to premium plan upgrade.",
  "Agent summarized next steps, confirmed terms, and secured customer commitment.",
];

const BAD_SALES = [
  "Agent rushed, missed needs, no clear value - customer declined.",
  "Weak objection handling, price concern unresolved, deal lost.",
  "Agent did not ask clarifying questions, customer stayed uncertain and left.",
];

const ANGRY = [
  "Customer angry about duplicate charge, agent slow to clarify and did not give a timeline.",
  "Escalation risk - customer threatens to cancel due to billing confusion.",
  "Customer asks for refund, agent provides vague steps and no confirmation.",
];

const SUPPORT_GOOD = [
  "Issue diagnosed quickly, clear explanation, customer satisfied.",
  "Agent calm, structured, resolved issue efficiently and confirmed resolution.",
  "Agent verified identity, offered options, and closed with reassurance.",
];

const SUPPORT_BAD = [
  "Agent vague, unclear steps, customer still confused.",
  "Problem not fully resolved, frustration remains and customer asks to escalate.",
  "Agent repeated script, did not address root cause, customer loses trust.",
];

const UPSALE = [
  "Agent identified usage growth and offered upgrade successfully.",
  "Customer accepted add-on after value explanation.",
  "Agent proposed a higher tier with clear ROI, customer agreed.",
];

const MISSED = [
  "Upsell opportunity missed - customer hinted need for higher plan, agent ignored.",
  "Agent failed to probe deeper into customer's goal and did not offer options.",
  "Customer asked about features, agent did not connect them to a plan upgrade.",
];

const TYPES: string[][] = [
  GOOD_SALES,
  BAD_SALES,
  ANGRY,
  SUPPORT_GOOD,
  SUPPORT_BAD,
  UPSALE,
  MISSED,
];

function makeTranscript(text: string) {
  return [
    "Chat transcript (simulation):",
    "",
    "Customer: Hi, I need help with my account.",
    `Agent: ${text}`,
    "Customer: Ok. What happens next?",
    "Agent: I will confirm the next steps and follow up if needed.",
    "",
    "End of transcript.",
  ].join("\n");
}

async function run() {
  let created = 0;

  for (const agentId of AGENTS) {
    const count = 10 + Math.floor(Math.random() * 6); // 10-15

    for (let i = 0; i < count; i++) {
      const bucket = pick(TYPES);
      const text = pick(bucket);

      // spread timestamps a bit so "latest" ordering looks realistic
      const minutesAgo = Math.floor(Math.random() * 60 * 24 * 10); // up to ~10 days
     

      await prisma.conversation.create({
        data: {
          agentId,
          transcript: makeTranscript(text),
          reportJson: null,
          
        } as any, // (если createdAt не разрешен в модели, Prisma ругнется - тогда уберем)
      });

      created++;
    }
  }

  console.log("Created conversations:", created);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
