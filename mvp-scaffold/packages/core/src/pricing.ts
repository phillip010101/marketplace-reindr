export type LeadPricingInput = {
  basePrice: number;
  requestedServicesCount: number;
  hasBudget: boolean;
  urgency?: string;
};

export function calculateLeadPrice(input: LeadPricingInput): number {
  let price = input.basePrice;

  if (input.requestedServicesCount >= 2) {
    price *= 1.3;
  }

  if (input.requestedServicesCount >= 4) {
    price *= 1.6;
  }

  if (input.hasBudget) {
    price *= 1.1;
  }

  if (input.urgency === 'this_week' || input.urgency === 'urgent') {
    price *= 1.2;
  }

  return Math.round(price);
}
