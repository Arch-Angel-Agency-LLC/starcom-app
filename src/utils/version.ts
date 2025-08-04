/**
 * Version management utilities for Starcom App
 */

import packageJson from '../../package.json';

// Deployment tracking (update this when deploying manually)
export const DEPLOYMENT_INFO = {
  // Update this manually when deploying
  deployedVersion: '0.1.0',
  deployedDate: '2025-08-04',
  environment: 'production' as 'development' | 'staging' | 'production'
};

/**
 * Get current app version from package.json
 */
export const getAppVersion = (): string => {
  return packageJson.version;
};

/**
 * Get deployed version info
 */
export const getDeployedVersion = (): string => {
  return DEPLOYMENT_INFO.deployedVersion;
};

/**
 * Get deployment date
 */
export const getDeploymentDate = (): string => {
  return DEPLOYMENT_INFO.deployedDate;
};

/**
 * Get formatted version display
 */
export const getVersionDisplay = (): string => {
  const version = getAppVersion();
  const date = new Date(DEPLOYMENT_INFO.deployedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  return `v${version} • ${date}`;
};

/**
 * Check if there's a version mismatch (newer code available)
 */
export const hasVersionMismatch = (): boolean => {
  return getAppVersion() !== getDeployedVersion();
};

/**
 * Get version status for display
 */
export const getVersionStatus = (): {
  currentVersion: string;
  deployedVersion: string;
  hasUpdate: boolean;
  deploymentDate: string;
  formattedDisplay: string;
} => {
  const currentVersion = getAppVersion();
  const deployedVersion = getDeployedVersion();
  const hasUpdate = hasVersionMismatch();
  const deploymentDate = getDeploymentDate();
  const formattedDisplay = getVersionDisplay();

  return {
    currentVersion,
    deployedVersion,
    hasUpdate,
    deploymentDate,
    formattedDisplay
  };
};
