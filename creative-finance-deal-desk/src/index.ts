/**
 * Creative Finance Deal Desk OS — public entry point.
 *
 * Re-exports the workflow modules, webhook handlers, adapters, and types
 * so host applications (Express, Lambda, Vercel, etc.) can import the
 * pieces they need from a single package.
 */

export * from "./config";

// types
export * from "./types/seller";
export * from "./types/buyer";
export * from "./types/scoredLead";
export * from "./types/dealMatch";
export * from "./types/closerPacket";
export * from "./types/followupTask";

// lib
export * from "./lib/logger";
export * from "./lib/promptLoader";
export * from "./lib/schemaValidator";
export * from "./lib/dateUtils";
export * from "./lib/textUtils";

// llm
export * from "./llm/client";
export * from "./llm/classifySeller";
export * from "./llm/classifyBuyer";
export * from "./llm/scoreLead";
export * from "./llm/nextQuestion";
export * from "./llm/generateScript";
export * from "./llm/packageDeal";
export * from "./llm/followupPlan";
export * from "./llm/riskCheck";

// adapters
export * from "./adapters/airtableAdapter";
export * from "./adapters/twilioAdapter";
export * from "./adapters/gmailAdapter";
export * from "./adapters/storageAdapter";
export * from "./adapters/webhookAdapter";

// workflows
export * from "./workflows/intakeSellerWorkflow";
export * from "./workflows/intakeBuyerWorkflow";
export * from "./workflows/scoreSellerWorkflow";
export * from "./workflows/scoreBuyerWorkflow";
export * from "./workflows/matchDealWorkflow";
export * from "./workflows/handoffCloserWorkflow";
export * from "./workflows/dailyFollowupWorkflow";

// api
export * from "./api/sellerWebhook";
export * from "./api/buyerWebhook";
export * from "./api/matchWebhook";
export * from "./api/followupWebhook";
