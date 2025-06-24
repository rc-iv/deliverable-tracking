interface ProposalItem {
  deliverable: {
    id: number;
    name: string;
    category: string;
    primaryCreator: string;
    retailPrice: number;
  };
  quantity: number;
  retailPrice: number;
  chargedPrice: number;
}

interface Proposal {
  items: ProposalItem[];
  total: number;
}

export function formatProposalAsText(proposal: Proposal): string {
  const { items, total } = proposal;
  
  // Calculate retail total for comparison
  const retailTotal = items.reduce((sum, item) => sum + (item.quantity * item.retailPrice), 0);
  const discount = retailTotal - total;
  const discountPercentage = retailTotal > 0 ? ((discount / retailTotal) * 100) : 0;
  
  let formattedText = `📋 **PROPOSAL**\n\n`;
  
  // Add timestamp
  formattedText += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  // Add line items
  formattedText += `**DELIVERABLES:**\n`;
  formattedText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  items.forEach((item, index) => {
    const lineTotal = item.quantity * item.chargedPrice;
    const retailLineTotal = item.quantity * item.retailPrice;
    const itemDiscount = retailLineTotal - lineTotal;
    
    formattedText += `**${index + 1}. ${item.deliverable.name}**\n`;
    formattedText += `   Category: ${item.deliverable.category}\n`;
    formattedText += `   Creator: ${item.deliverable.primaryCreator}\n`;
    formattedText += `   Quantity: ${item.quantity}\n`;
    formattedText += `   Price per unit: $${item.chargedPrice.toLocaleString()}`;
    
    // Show discount if applicable
    if (item.chargedPrice !== item.retailPrice) {
      formattedText += ` (was $${item.retailPrice.toLocaleString()})`;
    }
    
    formattedText += `\n   **Line Total: $${lineTotal.toLocaleString()}**`;
    
    // Show line item discount if applicable
    if (itemDiscount > 0) {
      formattedText += ` (saved $${itemDiscount.toLocaleString()})`;
    }
    
    formattedText += `\n\n`;
  });
  
  // Add summary
  formattedText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  formattedText += `**SUMMARY:**\n\n`;
  formattedText += `Retail Total: $${retailTotal.toLocaleString()}\n`;
  
  if (discount > 0) {
    formattedText += `Discount: -$${discount.toLocaleString()} (${discountPercentage.toFixed(1)}%)\n`;
  }
  
  formattedText += `**FINAL TOTAL: $${total.toLocaleString()}**\n\n`;
  
  // Add footer
  formattedText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  formattedText += `*This proposal was generated automatically by the Deliverable Tracking System.*\n`;
  formattedText += `*Proposal ID: ${Date.now()}*`;
  
  return formattedText;
}

export function formatProposalAsSimpleText(proposal: Proposal): string {
  const { items, total } = proposal;
  
  let formattedText = `PROPOSAL\n\n`;
  
  items.forEach((item, index) => {
    const lineTotal = item.quantity * item.chargedPrice;
    formattedText += `${index + 1}. ${item.deliverable.name} (${item.deliverable.category})\n`;
    formattedText += `   Qty: ${item.quantity} x $${item.chargedPrice.toLocaleString()} = $${lineTotal.toLocaleString()}\n\n`;
  });
  
  formattedText += `TOTAL: $${total.toLocaleString()}`;
  
  return formattedText;
} 