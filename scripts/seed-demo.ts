/**
 * TalkScope Demo Seed Script
 * Run: npx ts-node --project tsconfig.json scripts/seed-demo.ts
 * Or:  npx tsx scripts/seed-demo.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_USER_ID = "user_39vlY625s0Maj4GvJp5vPJvB7xU";

const AGENTS = [
  { name: "Sarah Mitchell",  email: "sarah.mitchell@acmecorp.com",  team: "Sales Team A" },
  { name: "James Rodriguez", email: "james.rodriguez@acmecorp.com", team: "Sales Team A" },
  { name: "Anna Chen",       email: "anna.chen@acmecorp.com",       team: "Sales Team B" },
  { name: "Marcus Webb",     email: "marcus.webb@acmecorp.com",     team: "Sales Team B" },
  { name: "Olivia Carter",   email: "olivia.carter@acmecorp.com",   team: "Collections" },
  { name: "Daniel Park",     email: "daniel.park@acmecorp.com",     team: "Collections" },
  { name: "Emma Thompson",   email: "emma.thompson@acmecorp.com",   team: "Support" },
  { name: "Ryan Foster",     email: "ryan.foster@acmecorp.com",     team: "Support" },
];

const GOOD_TRANSCRIPTS = [
  `Agent: Good morning! Thank you for calling AcmeCorp, this is Sarah. How can I help you today?
Customer: Hi Sarah, I've been looking at your premium plan and I'm really interested but I want to make sure it's the right fit.
Agent: Absolutely, I'd love to help you figure that out. Can you tell me a bit about your current situation and what you're hoping to achieve?
Customer: We're a team of about 20 people and we're struggling with tracking our customer interactions efficiently.
Agent: That makes perfect sense. With 20 people, visibility and coordination are critical. Our premium plan gives you centralized dashboards, real-time alerts, and team performance tracking. Many of our clients your size saw a 30% improvement in response times within the first month.
Customer: That's impressive. What about onboarding? We don't have a dedicated IT team.
Agent: Great question. We have a dedicated onboarding specialist who will guide your team through setup — typically takes just 2 days. And our support team is available 7 days a week if any questions come up after that.
Customer: I'm sold. What are the next steps?
Agent: Wonderful! I'll send over a proposal today with the exact pricing for your team size, and we can schedule a quick call with your decision makers this week. Does Thursday work for you?
Customer: Thursday works perfectly. Thank you, Sarah!
Agent: My pleasure! Talk to you Thursday.`,

  `Agent: Hi, thank you for calling. This is Sarah, how can I assist you today?
Customer: Yes, I need to upgrade my current plan. We've grown quite a bit and the basic tier isn't cutting it anymore.
Agent: Congratulations on the growth! That's exciting. Let me pull up your account. I can see you've been with us for about 8 months — you're actually one of our power users on the basic plan.
Customer: Yeah, we love the product. We just need more capacity and the team analytics.
Agent: Perfect timing then. Our Growth plan would give you 10x the capacity you have now, plus full team analytics, coaching tools, and priority support. Based on your current usage, you'd actually save money per interaction at scale.
Customer: How much are we talking?
Agent: For your team size, it's $299 per month. Given your current overage charges, that's actually about $80 less than what you're paying now.
Customer: Wait, seriously? Let's do it right now then.
Agent: Absolutely! I'm processing the upgrade now. You'll have access to all premium features within the next 10 minutes. I'll also send you a quick guide on the new analytics dashboard.
Customer: Perfect. Thanks for making this easy.
Agent: Of course! That's what we're here for. Is there anything else I can help you with today?`,

  `Agent: AcmeCorp support, Sarah speaking. What can I help you with?
Customer: Hi, I'm evaluating your platform against two competitors. I need to make a decision by end of week.
Agent: I appreciate you considering us. What are the key factors driving your decision?
Customer: Mainly ease of use, integration with our CRM, and pricing. We're on Salesforce.
Agent: Perfect, we actually have a native Salesforce integration that takes about 20 minutes to set up. I can show you a live demo right now if you have 15 minutes?
Customer: Sure, let's do it.
Agent: Great. While I pull that up — what's the main pain point with your current solution?
Customer: Our agents spend too much time on manual reporting. It's killing productivity.
Agent: That's exactly what our automation engine solves. Most clients eliminate 80% of manual reporting in the first week. Let me show you how that works in the demo...
Customer: Wow, this is exactly what we need. Can you send me a proposal before Friday?
Agent: I'll have it in your inbox within the hour, tailored specifically to your Salesforce setup and team size. You'll also get a 14-day trial access so your team can test it before you commit.
Customer: That's perfect. I think we're going to move forward.`,
];

const AVERAGE_TRANSCRIPTS = [
  `Agent: Hello, AcmeCorp, how can I help?
Customer: Hi, I want to know more about your pricing.
Agent: Sure. We have three plans — Basic at $49, Growth at $199, and Enterprise which is custom.
Customer: What's the difference?
Agent: Basic gives you up to 5 users and core features. Growth gives you 25 users and more advanced analytics.
Customer: What about integrations?
Agent: We integrate with most major platforms. Salesforce, HubSpot, that kind of thing.
Customer: Okay. And there's a trial?
Agent: Yes, 14 days free.
Customer: Alright, I'll think about it.
Agent: Okay, let me know if you have questions.
Customer: Sure. Thanks.
Agent: No problem. Goodbye.`,

  `Agent: Thanks for calling, this is James. What's going on?
Customer: I've been having some trouble with the reporting feature. The numbers don't seem right.
Agent: Okay, what kind of trouble exactly?
Customer: The weekly summary is showing lower numbers than what I see in the daily reports.
Agent: That's probably a timezone issue. What timezone are you in?
Customer: Eastern. New York.
Agent: Yeah, so the weekly reports use UTC by default. You need to change the setting in your account preferences.
Customer: Where is that?
Agent: Go to Settings, then Account, then timezone preferences.
Customer: Okay I found it. Changing it now.
Agent: Cool, that should fix it.
Customer: Yeah it looks right now. Thanks.
Agent: No problem. Anything else?
Customer: No that's it.
Agent: Alright. Have a good day.`,
];

const BAD_TRANSCRIPTS = [
  `Agent: AcmeCorp, hold please.
Customer: Okay...
[3 minute hold]
Agent: Thanks for holding. What do you need?
Customer: I've been trying to cancel my subscription for two weeks. Nobody has helped me.
Agent: Okay. What's your account email?
Customer: It's johnson@techstart.com. I've called three times already.
Agent: I see you called before yeah. So you want to cancel?
Customer: Yes. And I want a refund for this month since I haven't been able to use it because of the bug you have.
Agent: I can cancel the account but refunds go through a different department.
Customer: Can you transfer me there?
Agent: They don't have a direct line. You have to email billing@acmecorp.com.
Customer: I've already emailed them twice. No response.
Agent: I don't have access to their queue so I can't check on that.
Customer: This is ridiculous. You're losing a customer because nobody can help me.
Agent: I understand it's frustrating. I'll put a note on your account.
Customer: A note? That's it?
Agent: That's what I can do from here.
Customer: Fine. Cancel the account.
Agent: Done. Is there anything else?
Customer: No. Never mind.`,

  `Agent: Hello?
Customer: Hi, is this AcmeCorp support?
Agent: Yeah. What's the issue?
Customer: I'm trying to set up the API integration and getting a 401 error.
Agent: Did you check the documentation?
Customer: Yes, I followed it exactly. Still getting the error.
Agent: What's your API key?
Customer: Should I really give that out?
Agent: I need it to troubleshoot.
Customer: Um, okay. It's sk-demo-xxxx-yyyy.
Agent: That looks like a test key. You need a production key.
Customer: Where do I get that?
Agent: In your dashboard under API settings.
Customer: I don't see API settings anywhere.
Agent: It might not be enabled on your plan.
Customer: Why didn't anyone tell me that when I signed up?
Agent: I don't know. You'd have to ask sales.
Customer: Can you help me get it enabled?
Agent: You'd need to upgrade your plan.
Customer: Can I talk to someone about that?
Agent: Sales is closed right now.
Customer: When do they open?
Agent: 9am EST I think.
Customer: You think?
Agent: Yeah, 9am EST.
Customer: Okay. Thanks I guess.`,
];

const SCORES = [
  { overall: 91, comm: 93, conv: 89, risk: 12, coaching: 15, strengths: '["Exceptional rapport building","Clear value articulation","Strong objection handling","Proactive next steps","Customer-centric language"]', weaknesses: '["Could probe deeper on budget constraints","Occasionally rushes to close"]', patterns: '["Consistently uses discovery questions","Always confirms next steps","Uses social proof effectively"]' },
  { overall: 85, comm: 87, conv: 84, risk: 18, coaching: 22, strengths: '["Good product knowledge","Friendly tone","Handles upgrades well"]', weaknesses: '["Sometimes too brief on feature explanations","Could improve on uncovering hidden objections"]', patterns: '["Strong on retention conversations","Good at identifying upsell opportunities"]' },
  { overall: 74, comm: 76, conv: 71, risk: 35, coaching: 42, strengths: '["Adequate product knowledge","Generally polite"]', weaknesses: '["Lacks energy and enthusiasm","Missed several buying signals","Did not attempt to close","Generic responses"]', patterns: '["Tends to give information without engaging","Misses emotional cues from customers"]' },
  { overall: 62, comm: 65, conv: 58, risk: 55, coaching: 68, strengths: '["Technically knowledgeable","Honest with customers"]', weaknesses: '["Poor discovery questioning","Does not handle objections well","Often ends calls without resolution","Monotone delivery"]', patterns: '["Frequently transfers calls unnecessarily","Struggles with complex situations"]' },
  { overall: 44, comm: 48, conv: 38, risk: 78, coaching: 85, strengths: '["Shows up and takes calls"]', weaknesses: '["Very poor empathy","Does not follow scripts","Causes customer escalations","No closing attempts","Negative language patterns"]', patterns: '["High correlation with customer complaints","Frequently causes churn risk"]' },
];

async function main() {
  console.log("🌱 Seeding demo account...");
  console.log("User ID:", DEMO_USER_ID);

  // Clean up existing demo data
  const existingOrg = await prisma.organization.findFirst({
    where: { clerkUserId: DEMO_USER_ID },
  });
  if (existingOrg) {
    console.log("Cleaning up existing demo data...");
    const teams = await prisma.team.findMany({ where: { organizationId: existingOrg.id }, select: { id: true } });
    const teamIds = teams.map(t => t.id);
    const agents = await prisma.agent.findMany({ where: { teamId: { in: teamIds } }, select: { id: true } });
    const agentIds = agents.map(a => a.id);
    await prisma.agentScoreHistory.deleteMany({ where: { agentId: { in: agentIds } } });
    await prisma.agentScore.deleteMany({ where: { agentId: { in: agentIds } } });
    await prisma.conversation.deleteMany({ where: { agentId: { in: agentIds } } });
    await prisma.patternReport.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.agent.deleteMany({ where: { teamId: { in: teamIds } } });
    await prisma.team.deleteMany({ where: { organizationId: existingOrg.id } });
    await prisma.organization.delete({ where: { id: existingOrg.id } });
  }

  // Create org
  const org = await prisma.organization.create({
    data: { name: "AcmeCorp Contact Center", clerkUserId: DEMO_USER_ID },
  });
  console.log("✅ Organization created:", org.name);

  // Create teams
  const teamNames = [...new Set(AGENTS.map(a => a.team))];
  const teamMap = new Map<string, string>();
  for (const name of teamNames) {
    const team = await prisma.team.create({ data: { name, organizationId: org.id } });
    teamMap.set(name, team.id);
  }
  console.log("✅ Teams created:", teamNames.length);

  // Create agents with conversations and scores
  for (let i = 0; i < AGENTS.length; i++) {
    const agentData = AGENTS[i];
    const agent = await prisma.agent.create({
      data: {
        name: agentData.name,
        email: agentData.email,
        teamId: teamMap.get(agentData.team)!,
      },
    });

    // Pick score profile based on agent index
    const scoreProfile = SCORES[Math.min(i, SCORES.length - 1)];

    // Create 12-15 conversations
    const convCount = 12 + (i % 4);
    for (let j = 0; j < convCount; j++) {
      let transcript: string;
      if (scoreProfile.overall >= 80) {
        transcript = GOOD_TRANSCRIPTS[j % GOOD_TRANSCRIPTS.length];
      } else if (scoreProfile.overall >= 60) {
        transcript = j % 3 === 0 ? GOOD_TRANSCRIPTS[0] : AVERAGE_TRANSCRIPTS[j % AVERAGE_TRANSCRIPTS.length];
      } else {
        transcript = j % 3 === 0 ? AVERAGE_TRANSCRIPTS[0] : BAD_TRANSCRIPTS[j % BAD_TRANSCRIPTS.length];
      }

      const daysAgo = j * 2;
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.conversation.create({
        data: {
          agentId: agent.id,
          transcript,
          score: scoreProfile.overall + (Math.random() * 10 - 5),
          createdAt,
        },
      });
    }

    // Create score
    await prisma.agentScore.create({
      data: {
        agentId: agent.id,
        windowSize: 30,
        overallScore: scoreProfile.overall,
        communicationScore: scoreProfile.comm,
        conversionScore: scoreProfile.conv,
        riskScore: scoreProfile.risk,
        coachingPriority: scoreProfile.coaching,
        strengths: scoreProfile.strengths,
        weaknesses: scoreProfile.weaknesses,
        keyPatterns: scoreProfile.patterns,
      },
    });

    // Create score history (last 8 weeks)
    for (let w = 7; w >= 0; w--) {
      const variance = (Math.random() * 12 - 6);
      const trendBoost = (7 - w) * (i < 4 ? 0.5 : -0.3);
      const histScore = Math.max(20, Math.min(99, scoreProfile.overall + variance + trendBoost - 8));
      await prisma.agentScoreHistory.create({
        data: {
          agentId: agent.id,
          score: histScore,
          windowSize: 30,
          createdAt: new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    console.log(`✅ Agent: ${agentData.name} (score: ${scoreProfile.overall})`);
  }

  console.log("\n🎉 Demo seed complete!");
  console.log("📊 Login with the demo account to see the data.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
