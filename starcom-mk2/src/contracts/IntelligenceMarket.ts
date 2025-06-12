import { BrowserProvider, Contract } from 'ethers';
import IntelligenceMarketABI from './IntelligenceMarketABI.json';

const CONTRACT_ADDRESS = '0xYourContractAddressHere';

export const getIntelligenceMarketContract = async (provider: BrowserProvider) => {
  const signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, IntelligenceMarketABI, signer);
};

export const buyAsset = async (
  provider: BrowserProvider,
  assetId: string,
  price: bigint
) => {
  const contract = await getIntelligenceMarketContract(provider);
  const tx = await contract.buyAsset(assetId, { value: price });
  await tx.wait();
  return tx;
};

export const sellAsset = async (
  provider: BrowserProvider,
  assetId: string,
  price: bigint
) => {
  const contract = await getIntelligenceMarketContract(provider);
  const tx = await contract.sellAsset(assetId, price);
  await tx.wait();
  return tx;
};

export const listAsset = async (
  provider: BrowserProvider,
  name: string,
  price: bigint
): Promise<void> => {
  try {
    const contract = await getIntelligenceMarketContract(provider);
    const tx = await contract.listAsset(name, price);
    await tx.wait();
    console.log(`Asset listed: ${name} for price: ${price}`);
  } catch (error) {
    console.error('Error listing asset:', error);
    throw error;
  }
};

export const purchaseAsset = async (
  provider: BrowserProvider,
  assetId: number
): Promise<void> => {
  try {
    const contract = await getIntelligenceMarketContract(provider);
    const tx = await contract.purchaseAsset(assetId);
    await tx.wait();
    console.log(`Asset purchased: ${assetId}`);
  } catch (error) {
    console.error('Error purchasing asset:', error);
    throw error;
  }
};

export const getAssetDetails = async (
  provider: BrowserProvider,
  assetId: number
): Promise<any> => {
  try {
    const contract = await getIntelligenceMarketContract(provider);
    const asset = await contract.assets(assetId);
    console.log(`Asset details:`, asset);
    return asset;
  } catch (error) {
    console.error('Error fetching asset details:', error);
    throw error;
  }
};