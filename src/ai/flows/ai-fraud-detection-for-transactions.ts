'use server';
/**
 * @fileOverview This file implements a Genkit flow for AI-powered fraud detection.
 * It analyzes transaction patterns and user activity to identify and flag potential fraudulent transactions.
 *
 * - detectFraudForTransactions - A function that handles the fraud detection process for a given transaction.
 * - DetectFraudInput - The input type for the detectFraudForTransactions function.
 * - DetectFraudOutput - The return type for the detectFraudForTransactions function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input schema for fraud detection
const DetectFraudInputSchema = z.object({
  userId: z.string().describe('The unique identifier for the user initiating the transaction.'),
  transactionId: z.string().describe('The unique identifier for the transaction.'),
  amount: z.number().min(0).describe('The monetary amount of the transaction.'),
  currency: z.string().describe('The currency code of the transaction (e.g., "USD", "EUR").'),
  transactionType: z.enum(['credit', 'debit', 'transfer', 'withdrawal', 'deposit', 'purchase']).describe('The type of the financial transaction.'),
  timestamp: z.string().datetime().describe('The ISO 8601 formatted timestamp of when the transaction occurred.'),
  ipAddress: z.string().ip().describe('The IP address from which the transaction was initiated.'),
  deviceFingerprint: z.string().describe('A unique identifier or fingerprint of the device used for the transaction.'),
  geographicalData: z.object({
    country: z.string().describe('The country from where the transaction originated.'),
    city: z.string().describe('The city from where the transaction originated.'),
    lat: z.number().optional().describe('Optional: Latitude of the transaction origin.'),
    lon: z.number().optional().describe('Optional: Longitude of the transaction origin.'),
  }).optional().describe('Optional: Geographical data associated with the transaction origin.'),
  userHistorySummary: z.string().describe('A summarized text description of the user\'s past transaction and login behavior relevant to fraud detection (e.g., "first-time large transfer", "multiple failed login attempts from new locations", "consistent low-value transactions").'),
  accountAgeDays: z.number().int().min(0).describe('The age of the user account in days.'),
  paymentMethodDetails: z.string().optional().describe('Optional: Details about the payment method used, e.g., "newly added credit card", "known bank account".'),
});

export type DetectFraudInput = z.infer<typeof DetectFraudInputSchema>;

// Output schema for fraud detection results
const DetectFraudOutputSchema = z.object({
  isFraudulent: z.boolean().describe('True if the AI determines the transaction is likely fraudulent, false otherwise.'),
  fraudScore: z.number().min(0).max(1).describe('A confidence score from 0.0 (not fraudulent) to 1.0 (highly fraudulent) indicating the likelihood of fraud.'),
  reasoning: z.string().describe('A detailed explanation of the AI\'s reasoning for its fraud detection decision, including specific patterns or indicators.'),
  detectedIndicators: z.array(z.string()).describe('A list of specific fraud indicators identified (e.g., "unusual transaction amount", "new device detected", "geographic anomaly", "suspicious user behavior").'),
});

export type DetectFraudOutput = z.infer<typeof DetectFraudOutputSchema>;

// Wrapper function to be called from Next.js
export async function detectFraudForTransactions(input: DetectFraudInput): Promise<DetectFraudOutput> {
  return aiFraudDetectionFlow(input);
}

// Define the prompt for the AI model
const fraudDetectionPrompt = ai.definePrompt({
  name: 'fraudDetectionPrompt',
  input: { schema: DetectFraudInputSchema },
  output: { schema: DetectFraudOutputSchema },
  prompt: `You are an expert financial fraud detection system for the Vantage Engine platform. Your primary goal is to analyze transaction requests and identify potential fraudulent activity based on provided data.
You need to be highly vigilant for patterns indicating fraud, such as:
-   Unusual transaction amounts or types for the user.
-   Transactions from new or suspicious IP addresses or devices.
-   Geographical anomalies (e.g., transaction initiated far from usual locations).
-   Rapid sequence of transactions.
-   New payment methods or recently changed account details.
-   Behavioral patterns summarized from user history (e.g., first-time large transfer, multiple failed login attempts from new locations).
-   Very new accounts making high-risk transactions.

Analyze the following transaction details and user behavior summary. Provide a clear decision on whether the transaction is fraudulent, a confidence score, a detailed reasoning, and a list of specific indicators that led to your conclusion.

Transaction Details:
-   User ID: {{{userId}}}
-   Transaction ID: {{{transactionId}}}
-   Amount: {{{amount}}} {{{currency}}}
-   Type: {{{transactionType}}}
-   Timestamp: {{{timestamp}}}
-   IP Address: {{{ipAddress}}}
-   Device Fingerprint: {{{deviceFingerprint}}}
{{#if geographicalData}}
-   Geographical Data: Country: {{{geographicalData.country}}}, City: {{{geographicalData.city}}}
{{/if}}
-   Account Age: {{{accountAgeDays}}} days
{{#if paymentMethodDetails}}
-   Payment Method: {{{paymentMethodDetails}}}
{{/if}}

User Behavior Summary:
{{{userHistorySummary}}}

Based on this information, determine if the transaction is fraudulent.
Provide your response in a JSON object adhering strictly to the DetectFraudOutputSchema.`,
});

// Define the Genkit flow
const aiFraudDetectionFlow = ai.defineFlow(
  {
    name: 'aiFraudDetectionFlow',
    inputSchema: DetectFraudInputSchema,
    outputSchema: DetectFraudOutputSchema,
  },
  async (input) => {
    // Call the prompt with the input data
    const { output } = await fraudDetectionPrompt(input);

    // Return the output from the prompt
    return output!;
  }
);
