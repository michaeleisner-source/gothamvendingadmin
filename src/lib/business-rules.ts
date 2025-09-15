import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface InventoryCheck {
  currentStock: number;
  afterTransaction: number;
  reorderPoint: number;
  belowReorderPoint: boolean;
  wouldGoNegative: boolean;
}

export interface PricingCheck {
  unitPrice: number;
  unitCost: number;
  margin: number;
  marginPercent: number;
  belowCost: boolean;
  lowMargin: boolean;
}

export interface InventoryValidationResult {
  validation: ValidationResult;
  inventory?: InventoryCheck;
}

export interface PricingValidationResult {
  validation: ValidationResult;
  pricing: PricingCheck;
}

// Business validation rules
export const BUSINESS_RULES = {
  MIN_PROFIT_MARGIN: 0.15, // 15% minimum margin
  REORDER_THRESHOLD: 3, // Default reorder point
  MAX_TRANSACTION_DAYS_BACK: 30, // Max days for backdated transactions
  MIN_PRICE: 0.01, // Minimum price in dollars
} as const;

/**
 * Validates inventory levels for a sale transaction
 */
export async function validateInventoryForSale(
  slotId: string,
  quantity: number
): Promise<InventoryValidationResult> {
  try {
    const { data: inventory, error } = await supabase
      .from('inventory_levels')
      .select('current_qty, reorder_point')
      .eq('slot_id', slotId)
      .maybeSingle();

    if (error) {
      return {
        validation: {
          isValid: false,
          message: `Failed to check inventory: ${error.message}`,
          severity: 'error'
        }
      };
    }

    if (!inventory) {
      return {
        validation: {
          isValid: false,
          message: 'No inventory record found for this slot. Set up inventory tracking first.',
          severity: 'error'
        }
      };
    }

    const currentStock = inventory.current_qty || 0;
    const afterTransaction = currentStock - quantity;
    const reorderPoint = inventory.reorder_point || BUSINESS_RULES.REORDER_THRESHOLD;
    
    const inventoryCheck: InventoryCheck = {
      currentStock,
      afterTransaction,
      reorderPoint,
      belowReorderPoint: afterTransaction <= reorderPoint,
      wouldGoNegative: afterTransaction < 0
    };

    if (afterTransaction < 0) {
      return {
        validation: {
          isValid: false,
          message: `Insufficient inventory. Current stock: ${currentStock}, requested: ${quantity}`,
          severity: 'error'
        },
        inventory: inventoryCheck
      };
    }

    if (afterTransaction <= reorderPoint) {
      return {
        validation: {
          isValid: true,
          message: `Sale will trigger reorder alert. Stock will be ${afterTransaction} (reorder point: ${reorderPoint})`,
          severity: 'warning'
        },
        inventory: inventoryCheck
      };
    }

    return {
      validation: {
        isValid: true,
        message: 'Inventory check passed',
        severity: 'info'
      },
      inventory: inventoryCheck
    };
  } catch (error: any) {
    return {
      validation: {
        isValid: false,
        message: `Inventory validation error: ${error.message}`,
        severity: 'error'
      }
    };
  }
}

/**
 * Validates pricing for business rules
 */
export function validatePricing(unitPrice: number, unitCost: number = 0): PricingValidationResult {
  const margin = Math.max(0, unitPrice - unitCost);
  const marginPercent = unitPrice > 0 ? (margin / unitPrice) : 0;
  
  const pricingCheck: PricingCheck = {
    unitPrice,
    unitCost,
    margin,
    marginPercent,
    belowCost: unitPrice < unitCost,
    lowMargin: marginPercent < BUSINESS_RULES.MIN_PROFIT_MARGIN
  };

  if (unitPrice < BUSINESS_RULES.MIN_PRICE) {
    return {
      validation: {
        isValid: false,
        message: `Price too low. Minimum price is $${BUSINESS_RULES.MIN_PRICE}`,
        severity: 'error'
      },
      pricing: pricingCheck
    };
  }

  if (unitCost > 0 && unitPrice < unitCost) {
    return {
      validation: {
        isValid: false,
        message: `Selling below cost! Price: $${unitPrice.toFixed(2)}, Cost: $${unitCost.toFixed(2)}`,
        severity: 'error'
      },
      pricing: pricingCheck
    };
  }

  if (unitCost > 0 && marginPercent < BUSINESS_RULES.MIN_PROFIT_MARGIN) {
    return {
      validation: {
        isValid: true,
        message: `Low margin warning: ${(marginPercent * 100).toFixed(1)}% (target: ${(BUSINESS_RULES.MIN_PROFIT_MARGIN * 100).toFixed(0)}%)`,
        severity: 'warning'
      },
      pricing: pricingCheck
    };
  }

  return {
    validation: {
      isValid: true,
      message: `Good margin: ${(marginPercent * 100).toFixed(1)}%`,
      severity: 'info'
    },
    pricing: pricingCheck
  };
}

/**
 * Validates transaction date
 */
export function validateTransactionDate(occurredAt: string): ValidationResult {
  const transactionDate = new Date(occurredAt);
  const now = new Date();
  const maxPastDate = new Date(now.getTime() - (BUSINESS_RULES.MAX_TRANSACTION_DAYS_BACK * 24 * 60 * 60 * 1000));

  if (transactionDate > now) {
    return {
      isValid: false,
      message: 'Transaction date cannot be in the future',
      severity: 'error'
    };
  }

  if (transactionDate < maxPastDate) {
    return {
      isValid: false,
      message: `Transaction date too far in the past (max ${BUSINESS_RULES.MAX_TRANSACTION_DAYS_BACK} days)`,
      severity: 'error'
    };
  }

  const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (24 * 60 * 60 * 1000));
  if (daysDiff > 1) {
    return {
      isValid: true,
      message: `Backdated transaction (${daysDiff} days ago)`,
      severity: 'warning'
    };
  }

  return {
    isValid: true,
    message: 'Transaction date is valid',
    severity: 'info'
  };
}

/**
 * Updates inventory levels after a sale
 */
export async function updateInventoryAfterSale(slotId: string, quantity: number): Promise<void> {
  try {
    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory_levels')
      .select('current_qty')
      .eq('slot_id', slotId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch inventory: ${fetchError.message}`);
    }

    const newQty = Math.max(0, (inventory.current_qty || 0) - quantity);
    
    const { error: updateError } = await supabase
      .from('inventory_levels')
      .update({ 
        current_qty: newQty,
        updated_at: new Date().toISOString()
      })
      .eq('slot_id', slotId);

    if (updateError) {
      throw new Error(`Failed to update inventory: ${updateError.message}`);
    }
  } catch (error: any) {
    throw new Error(`Inventory update failed: ${error.message}`);
  }
}

/**
 * Updates inventory levels after a restock
 */
export async function updateInventoryAfterRestock(slotId: string, quantity: number, unitCost?: number): Promise<void> {
  try {
    const updates: Record<string, any> = {
      current_qty: quantity,
      last_restocked_at: new Date().toISOString()
    };

    // Update average cost if provided
    if (unitCost && unitCost > 0) {
      // Get the product ID for this slot
      const { data: inventory } = await supabase
        .from('inventory_levels')
        .select('product_id')
        .eq('slot_id', slotId)
        .single();

      if (inventory?.product_id) {
        await supabase
          .from('products')
          .update({ cost: unitCost })
          .eq('id', inventory.product_id);
      }
    }

    const { error } = await supabase
      .from('inventory_levels')
      .update(updates)
      .eq('slot_id', slotId);

    if (error) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  } catch (error: any) {
    throw new Error(`Restock update failed: ${error.message}`);
  }
}