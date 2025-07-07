import React, { useState } from 'react';
import { Shield, Search, Eye, ArrowRightLeft, LineChart, Database, Tag, AlertTriangle, FileText } from 'lucide-react';
import styles from './BlockchainPanel.module.css';
import { useBlockchainAnalysis, BlockchainSearchType } from '../../hooks/useBlockchainAnalysis';
import ErrorDisplay from '../common/ErrorDisplay';

interface BlockchainPanelProps {
  data?: Record<string, unknown>;
  panelId: string;
}

/**
 * Blockchain Analysis Panel
 * 
 * Provides tools for cryptocurrency and blockchain investigation
 */
const BlockchainPanel: React.FC<BlockchainPanelProps> = () => {
  // State for search input
  const [searchInput, setSearchInput] = useState('');
  
  // Use blockchain analysis hook
  const blockchain = useBlockchainAnalysis();
  
  // Search type options
  const searchTypeOptions: Record<BlockchainSearchType, { icon: React.ReactNode, title: string }> = {
    wallet: { icon: <Eye size={14} />, title: 'Wallet analysis' },
    transaction: { icon: <ArrowRightLeft size={14} />, title: 'Transaction flow' },
    history: { icon: <LineChart size={14} />, title: 'Historical analysis' },
    smartContract: { icon: <Database size={14} />, title: 'Smart contract scan' },
    flow: { icon: <Tag size={14} />, title: 'Transaction flow' }
  };
  
  // Handle search
  const handleSearch = () => {
    if (searchInput.trim()) {
      blockchain.executeSearch(searchInput, blockchain.searchType);
    }
  };
  
  // Handle type change
  const handleTypeChange = (type: BlockchainSearchType) => {
    blockchain.setSearchType(type);
    
    if (blockchain.query) {
      blockchain.executeSearch(blockchain.query, type);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Render wallet info
  const renderWalletInfo = () => {
    if (!blockchain.data || !blockchain.isWalletInfo(blockchain.data)) return null;
    
    const walletData = blockchain.data;
    
    return (
      <div className={styles.walletInfo}>
        <div className={styles.infoHeader}>
          <h3>Wallet Analysis</h3>
          {walletData.alertLevel && walletData.alertLevel !== 'none' && (
            <div className={`${styles.alertBadge} ${styles[`alert${walletData.alertLevel}`]}`}>
              <AlertTriangle size={12} />
              {walletData.alertLevel.toUpperCase()} RISK
            </div>
          )}
        </div>
        
        <div className={styles.addressBar}>
          <FileText size={14} />
          <span className={styles.address}>{walletData.address}</span>
          <span className={styles.network}>{walletData.network}</span>
        </div>
        
        <div className={styles.walletStats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Balance</span>
            <span className={styles.statValue}>{walletData.balance}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Value (USD)</span>
            <span className={styles.statValue}>${walletData.valueUSD.toLocaleString()}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Transactions</span>
            <span className={styles.statValue}>{walletData.transactions}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>First Seen</span>
            <span className={styles.statValue}>
              {new Date(walletData.firstSeen).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Last Active</span>
            <span className={styles.statValue}>
              {new Date(walletData.lastActive).toLocaleDateString()}
            </span>
          </div>
          {walletData.riskScore !== undefined && (
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Risk Score</span>
              <span className={styles.statValue}>{walletData.riskScore.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {walletData.tags && walletData.tags.length > 0 && (
          <div className={styles.tagContainer}>
            {walletData.tags.map((tag, index) => (
              <span key={index} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
        
        {walletData.tokens && walletData.tokens.length > 0 && (
          <div className={styles.tokensSection}>
            <h4>Token Holdings</h4>
            <div className={styles.tokensList}>
              {walletData.tokens.map((token, index) => (
                <div key={index} className={styles.tokenItem}>
                  <div className={styles.tokenName}>{token.name} ({token.symbol})</div>
                  <div className={styles.tokenAmount}>{token.amount}</div>
                  <div className={styles.tokenValue}>${token.valueUSD.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render transactions
  const renderTransactions = () => {
    if (!blockchain.data || !blockchain.isTransactions(blockchain.data)) return null;
    
    const transactions = blockchain.data;
    
    return (
      <div className={styles.transactions}>
        <h3>Transaction Results</h3>
        <div className={styles.transactionsList}>
          {transactions.map((tx, index) => (
            <div key={index} className={styles.transactionItem}>
              <div className={styles.txHeader}>
                <span className={styles.txHash}>{tx.hash.substring(0, 10)}...</span>
                <span className={styles.txNetwork}>{tx.network}</span>
                <span className={`${styles.txStatus} ${styles[tx.status]}`}>{tx.status}</span>
              </div>
              
              <div className={styles.txDetails}>
                <div className={styles.txAddresses}>
                  <div className={styles.txFrom}>From: {tx.from.substring(0, 12)}...</div>
                  <div className={styles.txTo}>To: {tx.to.substring(0, 12)}...</div>
                </div>
                
                <div className={styles.txValues}>
                  <div className={styles.txValue}>
                    Value: {tx.value}
                  </div>
                  <div className={styles.txValueUsd}>
                    ${tx.valueUSD.toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className={styles.txFooter}>
                <span className={styles.txTime}>
                  {new Date(tx.timestamp).toLocaleString()}
                </span>
                {tx.method && (
                  <span className={styles.txMethod}>{tx.method}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Analyzing blockchain data...</p>
      </div>
    );
  };
  
  // Render content based on state
  const renderContent = () => {
    if (blockchain.isLoading) {
      return renderLoading();
    }
    
    if (blockchain.error) {
      return (
        <div className={styles.errorWrapper}>
          <ErrorDisplay 
            error={blockchain.error}
            onRetry={() => blockchain.search()}
            onDismiss={() => blockchain.clearSearch()}
            className={styles.blockchainError}
          />
        </div>
      );
    }
    
    if (blockchain.data) {
      if (blockchain.isWalletInfo(blockchain.data)) {
        return renderWalletInfo();
      }
      
      if (blockchain.isTransactions(blockchain.data)) {
        return renderTransactions();
      }
      
      // Add more renderers for other data types here
      // For now, we'll focus on these two main views
    }
    
    // Default placeholder
    return (
      <div className={styles.placeholder}>
        <Shield size={40} />
        <div className={styles.placeholderText}>
          <h3>Blockchain Intelligence</h3>
          <p>Enter a wallet address or transaction hash to begin analysis</p>
          <p>Premium features require authentication</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.blockchainPanel}>
      <div className={styles.searchContainer}>
        <div className={styles.searchField}>
          <input 
            type="text" 
            className={styles.searchInput} 
            placeholder="Enter wallet address, transaction hash, or ENS name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button 
            className={styles.searchButton} 
            onClick={handleSearch}
            disabled={blockchain.isLoading}
          >
            {blockchain.isLoading ? (
              <div className={styles.buttonSpinner}></div>
            ) : (
              <Search size={14} />
            )}
          </button>
        </div>
        <div className={styles.searchOptions}>
          {Object.entries(searchTypeOptions).map(([type, { icon, title }]) => (
            <button 
              key={type}
              className={`${styles.optionButton} ${blockchain.searchType === type ? styles.activeOption : ''}`}
              title={title}
              onClick={() => handleTypeChange(type as BlockchainSearchType)}
              disabled={blockchain.isLoading}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.blockchainContent}>
        {renderContent()}
      </div>
    </div>
  );
};

export default BlockchainPanel;
