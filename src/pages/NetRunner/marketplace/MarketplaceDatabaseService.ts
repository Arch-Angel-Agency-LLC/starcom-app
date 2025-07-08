/**
 * MarketplaceDatabaseService.ts
 * 
 * Real database service for the Intelligence Exchange marketplace.
 * Provides persistent storage for listings, transactions, and tokenized assets.
 */

import { 
  IntelListingEntry, 
  IntelTransaction,
  ListingStatus
} from './IntelligenceExchange';
import { TokenizedIntel } from './TokenizationService';
import { IntelType } from '../tools/NetRunnerPowerTools';

// In-memory database simulation (in production, this would be SQLite, PostgreSQL, etc.)
class MarketplaceDatabase {
  private listings: Map<string, IntelListingEntry> = new Map();
  private transactions: Map<string, IntelTransaction> = new Map();
  private tokenizedAssets: Map<string, TokenizedIntel> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();
  private listingViews: Map<string, Set<string>> = new Map(); // listingId -> Set of userIds who viewed
  private userFavorites: Map<string, Set<string>> = new Map(); // userId -> Set of listingIds

  // Initialize with default admin user
  constructor() {
    this.userProfiles.set('admin', {
      id: 'admin',
      name: 'NetRunner Admin',
      email: 'admin@starcom.net',
      walletAddress: 'starcom:admin:wallet',
      rating: 5.0,
      totalSales: 0,
      totalPurchases: 0,
      joinedAt: new Date().toISOString(),
      isVerified: true,
      reputation: 1000
    });
  }

  // Listings operations
  createListing(listing: IntelListingEntry): boolean {
    try {
      this.listings.set(listing.id, listing);
      this.listingViews.set(listing.id, new Set());
      return true;
    } catch (error) {
      console.error('Failed to create listing:', error);
      return false;
    }
  }

  getListing(listingId: string): IntelListingEntry | null {
    return this.listings.get(listingId) || null;
  }

  updateListing(listingId: string, updates: Partial<IntelListingEntry>): boolean {
    try {
      const listing = this.listings.get(listingId);
      if (!listing) return false;

      const updatedListing = { ...listing, ...updates };
      this.listings.set(listingId, updatedListing);
      return true;
    } catch (error) {
      console.error('Failed to update listing:', error);
      return false;
    }
  }

  deleteListing(listingId: string): boolean {
    try {
      const deleted = this.listings.delete(listingId);
      this.listingViews.delete(listingId);
      return deleted;
    } catch (error) {
      console.error('Failed to delete listing:', error);
      return false;
    }
  }

  getUserListings(userId: string, status?: ListingStatus): IntelListingEntry[] {
    const userListings = Array.from(this.listings.values())
      .filter(listing => listing.sellerId === userId);
    
    if (status) {
      return userListings.filter(listing => listing.status === status);
    }
    
    return userListings;
  }

  searchListings(criteria: {
    query?: string;
    intelTypes?: string[];
    classification?: string[];
    priceRange?: { min: number; max: number };
    status?: ListingStatus;
    sortBy?: 'price' | 'date' | 'rating' | 'views';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): IntelListingEntry[] {
    let results = Array.from(this.listings.values());

    // Filter by status (default to active)
    if (criteria.status) {
      results = results.filter(listing => listing.status === criteria.status);
    } else {
      results = results.filter(listing => listing.status === 'active');
    }

    // Text search
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(listing =>
        listing.title.toLowerCase().includes(query) ||
        listing.summary.toLowerCase().includes(query) ||
        listing.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by intel types
    if (criteria.intelTypes && criteria.intelTypes.length > 0) {
      results = results.filter(listing =>
        criteria.intelTypes!.some(type => listing.intelTypes.includes(type as IntelType))
      );
    }

    // Filter by classification
    if (criteria.classification && criteria.classification.length > 0) {
      results = results.filter(listing =>
        criteria.classification!.includes(listing.classification)
      );
    }

    // Filter by price range
    if (criteria.priceRange) {
      results = results.filter(listing =>
        listing.price >= criteria.priceRange!.min &&
        listing.price <= criteria.priceRange!.max
      );
    }

    // Sort results
    if (criteria.sortBy) {
      const sortOrder = criteria.sortOrder || 'desc';
      results.sort((a, b) => {
        let aValue: number | Date, bValue: number | Date;
        
        switch (criteria.sortBy) {
          case 'price':
            aValue = a.price;
            bValue = b.price;
            break;
          case 'date':
            aValue = new Date(a.listedAt);
            bValue = new Date(b.listedAt);
            break;
          case 'rating':
            aValue = a.sellerRating;
            bValue = b.sellerRating;
            break;
          case 'views':
            aValue = a.views;
            bValue = b.views;
            break;
          default:
            return 0;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });
    }

    // Apply pagination
    if (criteria.offset) {
      results = results.slice(criteria.offset);
    }
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  incrementViews(listingId: string, userId: string): boolean {
    try {
      const listing = this.listings.get(listingId);
      if (!listing) return false;

      // Track unique views
      const views = this.listingViews.get(listingId) || new Set();
      if (!views.has(userId)) {
        views.add(userId);
        this.listingViews.set(listingId, views);
        
        // Update listing view count
        listing.views = views.size;
        this.listings.set(listingId, listing);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to increment views:', error);
      return false;
    }
  }

  // Transactions operations
  createTransaction(transaction: IntelTransaction): boolean {
    try {
      this.transactions.set(transaction.id, transaction);
      return true;
    } catch (error) {
      console.error('Failed to create transaction:', error);
      return false;
    }
  }

  getTransaction(transactionId: string): IntelTransaction | null {
    return this.transactions.get(transactionId) || null;
  }

  updateTransaction(transactionId: string, updates: Partial<IntelTransaction>): boolean {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) return false;

      const updatedTransaction = { ...transaction, ...updates };
      this.transactions.set(transactionId, updatedTransaction);
      return true;
    } catch (error) {
      console.error('Failed to update transaction:', error);
      return false;
    }
  }

  getUserTransactions(userId: string, role?: 'buyer' | 'seller'): IntelTransaction[] {
    return Array.from(this.transactions.values()).filter(transaction => {
      if (role === 'buyer') return transaction.buyerId === userId;
      if (role === 'seller') return transaction.sellerId === userId;
      return transaction.buyerId === userId || transaction.sellerId === userId;
    });
  }

  getListingTransactions(listingId: string): IntelTransaction[] {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.listingId === listingId);
  }

  // Tokenized assets operations
  createTokenizedAsset(asset: TokenizedIntel): boolean {
    try {
      this.tokenizedAssets.set(asset.tokenId, asset);
      return true;
    } catch (error) {
      console.error('Failed to create tokenized asset:', error);
      return false;
    }
  }

  getTokenizedAsset(tokenId: string): TokenizedIntel | null {
    return this.tokenizedAssets.get(tokenId) || null;
  }

  updateTokenizedAsset(tokenId: string, updates: Partial<TokenizedIntel>): boolean {
    try {
      const asset = this.tokenizedAssets.get(tokenId);
      if (!asset) return false;

      const updatedAsset = { ...asset, ...updates };
      this.tokenizedAssets.set(tokenId, updatedAsset);
      return true;
    } catch (error) {
      console.error('Failed to update tokenized asset:', error);
      return false;
    }
  }

  getUserTokenizedAssets(userId: string): TokenizedIntel[] {
    return Array.from(this.tokenizedAssets.values())
      .filter(asset => asset.owner === userId);
  }

  // User profile operations
  createUserProfile(profile: UserProfile): boolean {
    try {
      this.userProfiles.set(profile.id, profile);
      this.userFavorites.set(profile.id, new Set());
      return true;
    } catch (error) {
      console.error('Failed to create user profile:', error);
      return false;
    }
  }

  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  updateUserProfile(userId: string, updates: Partial<UserProfile>): boolean {
    try {
      const profile = this.userProfiles.get(userId);
      if (!profile) return false;

      const updatedProfile = { ...profile, ...updates };
      this.userProfiles.set(userId, updatedProfile);
      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }

  // Favorites operations
  addToFavorites(userId: string, listingId: string): boolean {
    try {
      const favorites = this.userFavorites.get(userId) || new Set();
      favorites.add(listingId);
      this.userFavorites.set(userId, favorites);

      // Update listing favorites count
      const listing = this.listings.get(listingId);
      if (listing) {
        listing.favorites = this.getFavoritesCount(listingId);
        this.listings.set(listingId, listing);
      }

      return true;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    }
  }

  removeFromFavorites(userId: string, listingId: string): boolean {
    try {
      const favorites = this.userFavorites.get(userId);
      if (!favorites) return false;

      favorites.delete(listingId);
      this.userFavorites.set(userId, favorites);

      // Update listing favorites count
      const listing = this.listings.get(listingId);
      if (listing) {
        listing.favorites = this.getFavoritesCount(listingId);
        this.listings.set(listingId, listing);
      }

      return true;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    }
  }

  getUserFavorites(userId: string): string[] {
    const favorites = this.userFavorites.get(userId);
    return favorites ? Array.from(favorites) : [];
  }

  private getFavoritesCount(listingId: string): number {
    let count = 0;
    this.userFavorites.forEach(favorites => {
      if (favorites.has(listingId)) count++;
    });
    return count;
  }

  // Analytics and statistics
  getMarketplaceStats(): MarketplaceStats {
    const listings = Array.from(this.listings.values());
    const transactions = Array.from(this.transactions.values());

    const activeListings = listings.filter(l => l.status === 'active').length;
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const totalVolume = completedTransactions.reduce((sum, t) => sum + t.price, 0);
    const averagePrice = completedTransactions.length > 0 ? totalVolume / completedTransactions.length : 0;

    // Get top categories
    const categoryCount = new Map<string, number>();
    listings.forEach(listing => {
      listing.categories?.forEach(category => {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    const topCategories = Array.from(categoryCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent activity
    const recentActivity = transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(t => ({
        type: 'transaction',
        timestamp: t.createdAt,
        description: `Transaction ${t.id} for ${t.price} tokens`
      }));

    return {
      totalListings: listings.length,
      activeListings,
      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length,
      totalVolume,
      averagePrice,
      topCategories,
      recentActivity
    };
  }

  // Import/export for data persistence
  exportData(): {
    listings: IntelListingEntry[];
    transactions: IntelTransaction[];
    tokenizedAssets: TokenizedIntel[];
    userProfiles: UserProfile[];
  } {
    return {
      listings: Array.from(this.listings.values()),
      transactions: Array.from(this.transactions.values()),
      tokenizedAssets: Array.from(this.tokenizedAssets.values()),
      userProfiles: Array.from(this.userProfiles.values())
    };
  }

  importData(data: {
    listings?: IntelListingEntry[];
    transactions?: IntelTransaction[];
    tokenizedAssets?: TokenizedIntel[];
    userProfiles?: UserProfile[];
  }): boolean {
    try {
      if (data.listings) {
        data.listings.forEach(listing => this.listings.set(listing.id, listing));
      }
      if (data.transactions) {
        data.transactions.forEach(tx => this.transactions.set(tx.id, tx));
      }
      if (data.tokenizedAssets) {
        data.tokenizedAssets.forEach(asset => this.tokenizedAssets.set(asset.tokenId, asset));
      }
      if (data.userProfiles) {
        data.userProfiles.forEach(profile => this.userProfiles.set(profile.id, profile));
      }
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  // Utility methods for testing
  clearAllData(): void {
    this.listings.clear();
    this.transactions.clear();
    this.tokenizedAssets.clear();
    this.userProfiles.clear();
    this.listingViews.clear();
    this.userFavorites.clear();
    
    // Re-initialize with default admin user
    this.userProfiles.set('admin', {
      id: 'admin',
      name: 'NetRunner Admin',
      email: 'admin@starcom.net',
      walletAddress: 'starcom:admin:wallet',
      rating: 5.0,
      totalSales: 0,
      totalPurchases: 0,
      joinedAt: new Date().toISOString(),
      isVerified: true,
      reputation: 1000
    });
  }
}

// User profile interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
  rating: number;
  totalSales: number;
  totalPurchases: number;
  joinedAt: string;
  isVerified: boolean;
  reputation: number;
  bio?: string;
  avatar?: string;
}

// Marketplace statistics interface
export interface MarketplaceStats {
  totalListings: number;
  activeListings: number;
  totalTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  averagePrice: number;
  topCategories: { name: string; count: number }[];
  recentActivity: { type: string; timestamp: string; description: string }[];
}

// Singleton database instance
export const marketplaceDB = new MarketplaceDatabase();
