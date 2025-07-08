/**
 * TransactionService.ts
 * 
 * This module provides functionality for handling Intelligence Exchange marketplace transactions,
 * including purchases, sales, and transaction history.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  IntelListingEntry, 
  IntelTransaction 
} from './IntelligenceExchange';
import { processTransaction } from './TokenizationService';
import { marketplaceDB } from './MarketplaceDatabaseService';

// Transaction result interface
interface TransactionResult {
  success: boolean;
  transaction?: IntelTransaction;
  error?: string;
  transferSuccess?: boolean;
  transactionId?: string;
}

// Current user info (would normally come from auth system)
const currentUser = {
  id: 'current-user-id',
  name: 'NetRunner',
  wallet: 'wallet-address-123'
};

/**
 * Create a purchase transaction for an intelligence listing
 */
export async function purchaseListing(
  listing: IntelListingEntry
): Promise<TransactionResult> {
  // Validate listing availability
  if (listing.status !== 'active') {
    return {
      success: false,
      error: `Listing is not available for purchase (status: ${listing.status})`
    };
  }
  
  // Create transaction record
  const now = new Date().toISOString();
  const transaction: IntelTransaction = {
    id: uuidv4(),
    listingId: listing.id,
    intelReportId: listing.intelReportId,
    buyerId: currentUser.id,
    sellerId: listing.sellerId,
    price: listing.price,
    status: 'pending',
    createdAt: now,
    transferMethod: 'direct'
  };
  
  try {
    // Save transaction to database
    const saveResult = marketplaceDB.createTransaction(transaction);
    if (!saveResult) {
      return {
        success: false,
        error: 'Failed to create transaction record'
      };
    }

    // Process the transaction through the blockchain
    const result = await processTransaction(transaction);
    
    if (result.success) {
      // Update transaction with completion details
      const completedTransaction: IntelTransaction = {
        ...transaction,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      // Update transaction in database
      marketplaceDB.updateTransaction(transaction.id, {
        status: 'completed',
        completedAt: completedTransaction.completedAt
      });

      // Update listing status to sold
      marketplaceDB.updateListing(listing.id, { status: 'sold' });
      
      return {
        success: true,
        transaction: completedTransaction,
        transferSuccess: true,
        transactionId: result.transactionId
      };
    } else {
      // Update transaction status to cancelled (indicating failure)
      marketplaceDB.updateTransaction(transaction.id, {
        status: 'cancelled',
        completedAt: new Date().toISOString()
      });

      return {
        success: false,
        transaction,
        error: result.error || 'Transaction failed on the blockchain'
      };
    }
  } catch (error) {
    // Update transaction status to cancelled (indicating failure)
    marketplaceDB.updateTransaction(transaction.id, {
      status: 'cancelled',
      completedAt: new Date().toISOString()
    });

    return {
      success: false,
      transaction,
      error: `Transaction processing error: ${(error as Error).message}`
    };
  }
}

/**
 * Get a user's transaction history
 */
export function getUserTransactions(
  userId: string = currentUser.id,
  filter?: 'buying' | 'selling' | 'all'
): IntelTransaction[] {
  let transactions: IntelTransaction[];
  
  if (filter === 'buying') {
    transactions = marketplaceDB.getUserTransactions(userId, 'buyer');
  } else if (filter === 'selling') {
    transactions = marketplaceDB.getUserTransactions(userId, 'seller');
  } else {
    transactions = marketplaceDB.getUserTransactions(userId);
  }
  
  // Sort by creation date (newest first)
  return transactions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get details of a specific transaction
 */
export function getTransactionDetails(transactionId: string): IntelTransaction | null {
  return marketplaceDB.getTransaction(transactionId);
}

/**
 * Cancel a pending transaction
 */
export async function cancelTransaction(transactionId: string): Promise<boolean> {
  const transaction = marketplaceDB.getTransaction(transactionId);
  
  if (!transaction) {
    return false;
  }
  
  if (transaction.status !== 'pending') {
    return false; // Can only cancel pending transactions
  }
  
  // Update transaction status to cancelled
  return marketplaceDB.updateTransaction(transactionId, {
    status: 'cancelled',
    completedAt: new Date().toISOString()
  });
}

/**
 * Dispute a completed transaction
 */
export async function disputeTransaction(
  transactionId: string,
  reason: string
): Promise<boolean> {
  const transaction = marketplaceDB.getTransaction(transactionId);
  
  if (!transaction) {
    return false;
  }
  
  if (transaction.status !== 'completed') {
    return false; // Can only dispute completed transactions
  }
  
  // Update transaction status to disputed
  const updateResult = marketplaceDB.updateTransaction(transactionId, {
    status: 'disputed'
  });
  
  if (updateResult) {
    // In a real implementation, this would:
    // 1. Create a dispute record with the reason
    // 2. Notify relevant parties
    // 3. Initiate dispute resolution process
    console.log(`Transaction ${transactionId} disputed: ${reason}`);
  }
  
  return updateResult;
}

/**
 * Get marketplace stats for a user
 */
export function getUserMarketStats(userId: string = currentUser.id): {
  totalSales: number;
  totalPurchases: number;
  activeSales: number;
  totalEarned: number;
  totalSpent: number;
  averageRating: number;
  recentTransactions: IntelTransaction[];
} {
  const allTransactions = marketplaceDB.getUserTransactions(userId);
  const purchases = allTransactions.filter(t => t.buyerId === userId && t.status === 'completed');
  const sales = allTransactions.filter(t => t.sellerId === userId && t.status === 'completed');
  
  const totalSpent = purchases.reduce((sum, t) => sum + t.price, 0);
  const totalEarned = sales.reduce((sum, t) => sum + t.price, 0);
  
  // Get active sales (listings that are still active) 
  // Since searchListings doesn't support sellerId filter, we'll get all listings and filter
  const allListings = marketplaceDB.searchListings({});
  const userListings = allListings.filter(l => l.sellerId === userId);
  const activeSales = userListings.filter(l => l.status === 'active').length;
  
  // Get recent transactions (last 5)
  const recentTransactions = allTransactions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    totalSales: sales.length,
    totalPurchases: purchases.length,
    activeSales,
    totalEarned,
    totalSpent,
    averageRating: 4.3, // This would come from user profile in a real implementation
    recentTransactions
  };
}
