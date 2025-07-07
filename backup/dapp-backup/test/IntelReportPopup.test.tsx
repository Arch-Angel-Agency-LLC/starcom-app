import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntelReportPopup from '../src/components/Intel/IntelReportPopup';
import { WalletProvider } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';

// Mock wallet adapters
const mockWallets: any[] = [];
const mockConnection = new Connection('http://localhost:8899');

describe('IntelReportPopup', () => {
  const MockWalletWrapper = ({ children }: { children: React.ReactNode }) => (
    <WalletProvider wallets={mockWallets} autoConnect={false}>
      {children}
    </WalletProvider>
  );

  it('should render the Intel Report form', () => {
    const mockOnClose = vi.fn();
    
    render(
      <MockWalletWrapper>
        <IntelReportPopup onClose={mockOnClose} />
      </MockWalletWrapper>
    );

    expect(screen.getByText('Create Intelligence Report')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Content')).toBeInTheDocument();
    expect(screen.getByText('Submit Report')).toBeInTheDocument();
  });

  it('should have proper form structure', () => {
    const mockOnClose = vi.fn();
    
    render(
      <MockWalletWrapper>
        <IntelReportPopup onClose={mockOnClose} />
      </MockWalletWrapper>
    );

    // Check for required form fields
    expect(screen.getByPlaceholderText('Title')).toHaveAttribute('required');
    expect(screen.getByPlaceholderText('Content')).toHaveAttribute('required');
    expect(screen.getByPlaceholderText('Latitude')).toHaveAttribute('required');
    expect(screen.getByPlaceholderText('Longitude')).toHaveAttribute('required');
  });

  it('should have wallet and minting section', () => {
    const mockOnClose = vi.fn();
    
    render(
      <MockWalletWrapper>
        <IntelReportPopup onClose={mockOnClose} />
      </MockWalletWrapper>
    );

    expect(screen.getByText('Wallet & Blockchain')).toBeInTheDocument();
    expect(screen.getByText('Mint SPL Token')).toBeInTheDocument();
    expect(screen.getByText('Mint Intel Report NFT')).toBeInTheDocument();
  });
});
