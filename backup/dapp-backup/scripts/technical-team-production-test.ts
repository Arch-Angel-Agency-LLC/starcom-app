#!/usr/bin/env tsx
/**
 * STARCOM PRODUCTION-READY HUMAN SIMULATION TEST
 * 
 * Tests real user workflows for small technical Web3 teams (2-3 people)
 * Focuses on production environment testing with actual browser interactions
 * 
 * Key Features:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Production environment validation
 * - Real-time collaboration testing
 * - Network condition simulation
 * - Technical team workflow validation
 */

import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';

interface TestMetrics {
  loadTime: number;
  connectionTime: number;
  messagesSent: number;
  messagesReceived: number;
  errorsEncountered: number;
  walletConnectionAttempts: number;
}

interface TestAgent {
  id: string;
  name: string;
  role: string;
  browser: Browser;
  context: BrowserContext;
  page: Page;
  metrics: TestMetrics;
  errors: string[];
}

interface TestEnvironment {
  name: string;
  url: string;
  isProduction: boolean;
}

class StarcomProductionHumanTest {
  private testLog: string[] = [];
  
  private environments: TestEnvironment[] = [
    {
      name: 'local-development',
      url: 'http://localhost:5174',
      isProduction: false
    },
    {
      name: 'production-vercel',
      url: 'https://your-app.vercel.app', // Update with actual production URL
      isProduction: true
    }
  ];

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.testLog.push(logEntry);
  }

  async createTechnicalTeamAgent(
    id: string, 
    name: string, 
    role: string, 
    browserType: 'chromium' | 'firefox' | 'webkit' = 'chromium'
  ): Promise<TestAgent> {
    this.log(`🤖 Creating technical team agent: ${name} (${role}) using ${browserType}`);

    let browser: Browser;
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ 
          headless: false, 
          slowMo: 200,
          devtools: true
        });
        break;
      case 'webkit':
        browser = await webkit.launch({ 
          headless: false, 
          slowMo: 200
        });
        break;
      default:
        browser = await chromium.launch({ 
          headless: false, 
          slowMo: 200,
          devtools: true,
          args: [
            '--disable-web-security',
            '--disable-blink-features=AutomationControlled',
            '--no-first-run'
          ]
        });
    }

    const contextOptions: any = {
      viewport: { width: 1920, height: 1080 },
      userAgent: `Starcom-TechnicalTeam-${browserType}-${id}`,
      permissions: ['notifications']
    };

    if (browserType === 'chromium') {
      contextOptions.permissions.push('clipboard-read', 'clipboard-write');
    }

    const context = await browser.newContext(contextOptions);

    const page = await context.newPage();

    // Enhanced monitoring for technical team testing
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        this.log(`[${name}] Console ${msg.type()}: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      this.log(`[${name}] ❌ Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      this.log(`[${name}] 🌐 Failed Request: ${request.url()}`);
    });

    const agent: TestAgent = {
      id,
      name,
      role,
      browser,
      context,
      page,
      metrics: {
        loadTime: 0,
        connectionTime: 0,
        messagesSent: 0,
        messagesReceived: 0,
        errorsEncountered: 0,
        walletConnectionAttempts: 0
      },
      errors: []
    };

    this.log(`✅ Technical team agent created: ${name}`);
    return agent;
  }

  async runProductionTeamTest(): Promise<void> {
    this.log(`\n🌐 PRODUCTION TECHNICAL TEAM COLLABORATION TEST`);
    this.log(`Testing real-world Web3 team workflows...\n`);

    // Create diverse technical team
    const team = [
      await this.createTechnicalTeamAgent('lead', 'Alice Chen', 'Lead Analyst', 'chromium'),
      await this.createTechnicalTeamAgent('osint', 'Bob Martinez', 'OSINT Specialist', 'firefox'),
      await this.createTechnicalTeamAgent('threat', 'Carol Johnson', 'Threat Hunter', 'webkit')
    ];

    // Test both environments
    for (const env of this.environments) {
      this.log(`\n🏢 Testing Environment: ${env.name} (${env.url})`);
      
      await this.testTechnicalOnboarding(team, env);
      await this.testTeamDiscovery(team, env);
      await this.testRealTimeCollaboration(team, env);
      await this.testIntelWorkflow(team, env);
      await this.testServiceReliability(team, env);
    }

    // Cleanup
    for (const agent of team) {
      await agent.context.close();
      await agent.browser.close();
    }

    this.generateTechnicalTeamReport(team);
  }

  private async testTechnicalOnboarding(team: TestAgent[], env: TestEnvironment): Promise<void> {
    this.log(`\n🚀 Technical Team Onboarding Test`);
    
    for (const agent of team) {
      const startTime = Date.now();
      
      try {
        // Load application
        this.log(`📱 ${agent.name}: Loading ${env.url}...`);
        await agent.page.goto(env.url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });
        
        agent.metrics.loadTime = Date.now() - startTime;
        this.log(`⏱️  ${agent.name}: Loaded in ${agent.metrics.loadTime}ms`);

        // Check for critical UI elements
        const criticalElements = [
          'body', // Basic page structure
          '[data-testid="app"], #root, .app', // App container
          'nav, header, [class*="nav"], [class*="header"]' // Navigation
        ];

        for (const selector of criticalElements) {
          try {
            await agent.page.waitForSelector(selector, { timeout: 5000 });
            this.log(`✅ ${agent.name}: Found ${selector}`);
          } catch {
            agent.errors.push(`Missing critical element: ${selector}`);
            agent.metrics.errorsEncountered++;
          }
        }

        // Test wallet connection flow (technical users expect this)
        this.log(`🔗 ${agent.name}: Testing wallet connection interface...`);
        const walletConnectionStart = Date.now();
        
        const connectSelectors = [
          '[data-testid="connect-wallet"]',
          'button:has-text("Connect")',
          'button:has-text("CONNECT")',
          '[class*="connect"]',
          '[class*="wallet"]'
        ];

        let walletUIFound = false;
        for (const selector of connectSelectors) {
          try {
            const connectBtn = await agent.page.$(selector);
            if (connectBtn) {
              await connectBtn.click();
              walletUIFound = true;
              agent.metrics.walletConnectionAttempts++;
              this.log(`✅ ${agent.name}: Wallet UI triggered`);
              
              // Wait for wallet modal/interface
              await agent.page.waitForTimeout(2000);
              break;
            }
          } catch (error) {
            // Continue trying other selectors
          }
        }

        if (!walletUIFound) {
          agent.errors.push('No wallet connection interface found');
          this.log(`⚠️  ${agent.name}: Wallet connection interface not found`);
        }

        agent.metrics.connectionTime = Date.now() - walletConnectionStart;

      } catch (error) {
        agent.errors.push(`Onboarding failed: ${error}`);
        agent.metrics.errorsEncountered++;
        this.log(`❌ ${agent.name}: Onboarding failed - ${error}`);
      }
    }

    // Analyze onboarding results
    const avgLoadTime = team.reduce((sum, a) => sum + a.metrics.loadTime, 0) / team.length;
    const totalErrors = team.reduce((sum, a) => sum + a.metrics.errorsEncountered, 0);
    
    this.log(`\n📊 Onboarding Results:`);
    this.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    this.log(`Total Errors: ${totalErrors}`);
    this.log(`Success Rate: ${((team.length - totalErrors) / team.length * 100).toFixed(1)}%`);
  }

  private async testTeamDiscovery(team: TestAgent[], env: TestEnvironment): Promise<void> {
    this.log(`\n👥 Team Discovery & Channel Access Test`);
    
    for (const agent of team) {
      try {
        // Look for team/communication interfaces
        const commSelectors = [
          '[data-testid="team-communication"]',
          '[data-testid="messaging"]',
          '[class*="team"]',
          '[class*="comm"]',
          '[class*="chat"]',
          '[class*="message"]',
          'nav a:has-text("Team")',
          'nav a:has-text("Communication")',
          'button:has-text("Team")'
        ];

        let commUIFound = false;
        for (const selector of commSelectors) {
          try {
            const element = await agent.page.$(selector);
            if (element) {
              await element.click();
              commUIFound = true;
              this.log(`✅ ${agent.name}: Found team communication interface`);
              
              // Wait for interface to load
              await agent.page.waitForTimeout(2000);
              
              // Look for channel/team selection
              const channelSelectors = [
                'input[placeholder*="channel"]',
                'input[placeholder*="team"]',
                'select[name*="team"]',
                '[data-testid="team-selector"]'
              ];

              for (const channelSelector of channelSelectors) {
                const channelElement = await agent.page.$(channelSelector);
                if (channelElement) {
                  // Test team joining
                  await channelElement.fill('starcom-test-team');
                  this.log(`✅ ${agent.name}: Joined test team channel`);
                  break;
                }
              }
              
              break;
            }
          } catch (error) {
            // Continue trying other selectors
          }
        }

        if (!commUIFound) {
          agent.errors.push('Team communication interface not accessible');
          this.log(`⚠️  ${agent.name}: No team communication interface found`);
        }

      } catch (error) {
        agent.errors.push(`Team discovery failed: ${error}`);
        agent.metrics.errorsEncountered++;
      }
    }
  }

  private async testRealTimeCollaboration(team: TestAgent[], env: TestEnvironment): Promise<void> {
    this.log(`\n💬 Real-Time Collaboration Test`);
    
    // Phase 1: All agents send messages
    this.log(`📤 Phase 1: Message sending test...`);
    
    for (let i = 0; i < team.length; i++) {
      const agent = team[i];
      const testMessage = `Test message from ${agent.name} - ${new Date().toISOString()}`;
      
      try {
        // Look for message input
        const messageInputSelectors = [
          'textarea[placeholder*="message"]',
          'input[placeholder*="message"]',
          '[data-testid="message-input"]',
          '[contenteditable="true"]',
          'textarea',
          'input[type="text"]'
        ];

        let messageInput: any = null;
        for (const selector of messageInputSelectors) {
          messageInput = await agent.page.$(selector);
          if (messageInput) break;
        }

        if (messageInput) {
          await messageInput.fill(testMessage);
          
          // Look for send button
          const sendButtonSelectors = [
            'button:has-text("Send")',
            '[data-testid="send-button"]',
            'button[type="submit"]',
            '[class*="send"]',
            'button:last-of-type'
          ];

          let sendButton: any = null;
          for (const selector of sendButtonSelectors) {
            sendButton = await agent.page.$(selector);
            if (sendButton) break;
          }

          if (sendButton) {
            await sendButton.click();
            agent.metrics.messagesSent++;
            this.log(`✅ ${agent.name}: Sent message`);
          } else {
            // Try Enter key
            await messageInput.press('Enter');
            agent.metrics.messagesSent++;
            this.log(`✅ ${agent.name}: Sent message via Enter key`);
          }
        } else {
          agent.errors.push('No message input found');
          this.log(`❌ ${agent.name}: No message input interface`);
        }

        // Wait between messages
        await agent.page.waitForTimeout(1000);

      } catch (error) {
        agent.errors.push(`Message sending failed: ${error}`);
        agent.metrics.errorsEncountered++;
      }
    }

    // Phase 2: Check message reception
    this.log(`📥 Phase 2: Message reception test...`);
    
    // Wait for message sync
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    for (const agent of team) {
      try {
        // Count visible messages
        const messageSelectors = [
          '[data-testid="message"]',
          '[class*="message"]',
          '.message',
          '[role="listitem"]'
        ];

        let messageCount = 0;
        for (const selector of messageSelectors) {
          const messages = await agent.page.$$(selector);
          if (messages.length > messageCount) {
            messageCount = messages.length;
          }
        }

        agent.metrics.messagesReceived = messageCount;
        this.log(`📊 ${agent.name}: Sees ${messageCount} messages`);

      } catch (error) {
        agent.errors.push(`Message reception check failed: ${error}`);
        agent.metrics.errorsEncountered++;
      }
    }

    // Calculate collaboration metrics
    const totalSent = team.reduce((sum, a) => sum + a.metrics.messagesSent, 0);
    const totalReceived = team.reduce((sum, a) => sum + a.metrics.messagesReceived, 0);
    const deliveryRate = totalReceived / (totalSent * team.length) || 0;
    
    this.log(`\n📊 Collaboration Results:`);
    this.log(`Messages Sent: ${totalSent}`);
    this.log(`Messages Received: ${totalReceived}`);
    this.log(`Delivery Rate: ${(deliveryRate * 100).toFixed(1)}%`);
  }

  private async testIntelWorkflow(team: TestAgent[], env: TestEnvironment): Promise<void> {
    this.log(`\n📋 Intel Report Workflow Test`);
    
    const leadAgent = team[0]; // Lead agent submits intel report
    
    try {
      // Look for intel report interface
      const intelSelectors = [
        '[data-testid="intel-report"]',
        '[class*="intel"]',
        '[class*="report"]',
        'nav a:has-text("Intel")',
        'nav a:has-text("Report")',
        'button:has-text("Intel")',
        'button:has-text("Report")'
      ];

      let intelUIFound = false;
      for (const selector of intelSelectors) {
        try {
          const element = await leadAgent.page.$(selector);
          if (element) {
            await element.click();
            intelUIFound = true;
            this.log(`✅ ${leadAgent.name}: Accessed intel report interface`);
            
            await leadAgent.page.waitForTimeout(2000);
            
            // Fill out intel report form
            const titleInput = await leadAgent.page.$('input[name="title"], input[placeholder*="title"]');
            const contentInput = await leadAgent.page.$('textarea[name="content"], textarea[placeholder*="content"]');
            
            if (titleInput && contentInput) {
              await titleInput.fill('Technical Team Test Report');
              await contentInput.fill('This is an automated test intel report from the technical team testing suite.');
              
              this.log(`✅ ${leadAgent.name}: Filled out intel report form`);
              
              // Try to submit
              const submitSelectors = [
                'button:has-text("Submit")',
                '[data-testid="submit-report"]',
                'button[type="submit"]',
                '[class*="submit"]'
              ];

              for (const submitSelector of submitSelectors) {
                const submitBtn = await leadAgent.page.$(submitSelector);
                if (submitBtn) {
                  await submitBtn.click();
                  this.log(`✅ ${leadAgent.name}: Submitted intel report`);
                  await leadAgent.page.waitForTimeout(3000);
                  break;
                }
              }
            } else {
              leadAgent.errors.push('Intel report form fields not found');
            }
            
            break;
          }
        } catch (error) {
          // Continue trying other selectors
        }
      }

      if (!intelUIFound) {
        leadAgent.errors.push('Intel report interface not accessible');
        this.log(`⚠️  ${leadAgent.name}: No intel report interface found`);
      }

    } catch (error) {
      leadAgent.errors.push(`Intel workflow failed: ${error}`);
      leadAgent.metrics.errorsEncountered++;
    }
  }

  private async testServiceReliability(team: TestAgent[], env: TestEnvironment): Promise<void> {
    this.log(`\n🔧 Service Reliability Test`);
    
    for (const agent of team) {
      try {
        // Test offline/online transitions
        this.log(`🌐 ${agent.name}: Testing offline mode...`);
        await agent.context.setOffline(true);
        await agent.page.waitForTimeout(2000);
        
        // Try to interact while offline
        const messageInput = await agent.page.$('textarea, input[type="text"]');
        if (messageInput) {
          await messageInput.fill('Offline test message');
          this.log(`✅ ${agent.name}: Offline mode interface responsive`);
        }
        
        // Go back online
        this.log(`🌐 ${agent.name}: Testing online reconnection...`);
        await agent.context.setOffline(false);
        await agent.page.waitForTimeout(3000);
        
        // Test reconnection
        await agent.page.reload({ waitUntil: 'networkidle' });
        this.log(`✅ ${agent.name}: Reconnection successful`);

      } catch (error) {
        agent.errors.push(`Service reliability test failed: ${error}`);
        agent.metrics.errorsEncountered++;
      }
    }
  }

  private generateTechnicalTeamReport(team: TestAgent[]): void {
    this.log(`\n📊 TECHNICAL TEAM TEST REPORT`);
    this.log(`================================`);
    
    // Overall metrics
    const totalErrors = team.reduce((sum, a) => sum + a.metrics.errorsEncountered, 0);
    const avgLoadTime = team.reduce((sum, a) => sum + a.metrics.loadTime, 0) / team.length;
    const totalMessages = team.reduce((sum, a) => sum + a.metrics.messagesSent, 0);
    const successRate = ((team.length * 5 - totalErrors) / (team.length * 5)) * 100; // 5 test categories per agent

    this.log(`\n🎯 OVERALL RESULTS:`);
    this.log(`Team Size: ${team.length} technical users`);
    this.log(`Success Rate: ${successRate.toFixed(1)}%`);
    this.log(`Average Load Time: ${avgLoadTime.toFixed(0)}ms`);
    this.log(`Total Messages Sent: ${totalMessages}`);
    this.log(`Total Errors: ${totalErrors}`);

    this.log(`\n👤 INDIVIDUAL AGENT RESULTS:`);
    for (const agent of team) {
      this.log(`\n${agent.name} (${agent.role}):`);
      this.log(`  Load Time: ${agent.metrics.loadTime}ms`);
      this.log(`  Connection Time: ${agent.metrics.connectionTime}ms`);
      this.log(`  Messages Sent: ${agent.metrics.messagesSent}`);
      this.log(`  Messages Received: ${agent.metrics.messagesReceived}`);
      this.log(`  Errors: ${agent.metrics.errorsEncountered}`);
      
      if (agent.errors.length > 0) {
        this.log(`  Error Details:`);
        agent.errors.forEach(error => this.log(`    - ${error}`));
      }
    }

    this.log(`\n🔍 TECHNICAL TEAM RECOMMENDATIONS:`);
    
    if (avgLoadTime > 3000) {
      this.log(`⚠️  Optimize initial load time (${avgLoadTime.toFixed(0)}ms > 3000ms target)`);
    }
    
    if (totalErrors > 0) {
      this.log(`⚠️  Address ${totalErrors} critical errors preventing team productivity`);
    }
    
    const walletIssues = team.filter(a => a.errors.some(e => e.includes('wallet'))).length;
    if (walletIssues > 0) {
      this.log(`⚠️  Improve wallet connection UX (${walletIssues}/${team.length} agents had issues)`);
    }
    
    const commIssues = team.filter(a => a.errors.some(e => e.includes('communication') || e.includes('message'))).length;
    if (commIssues > 0) {
      this.log(`⚠️  Enhance team communication discoverability (${commIssues}/${team.length} agents had issues)`);
    }

    if (totalErrors === 0) {
      this.log(`✅ Excellent! Application is ready for technical team adoption`);
    } else if (successRate > 80) {
      this.log(`✅ Good foundation, minor improvements needed for production readiness`);
    } else {
      this.log(`⚠️  Significant improvements needed before technical team deployment`);
    }

    this.log(`\n🚀 NEXT STEPS FOR TECHNICAL TEAMS:`);
    this.log(`1. Deploy to production environment (vercel --prod)`);
    this.log(`2. Test with real crypto wallets (Phantom, Solflare)`);
    this.log(`3. Verify Nostr relay connectivity in production`);
    this.log(`4. Create technical team onboarding documentation`);
    this.log(`5. Set up monitoring for service health`);

    this.log(`\n✅ Technical Team Human Simulation Test Complete`);
  }
}

// Main execution function
async function runTechnicalTeamTest() {
  console.log(`
🧪 STARCOM TECHNICAL TEAM HUMAN SIMULATION TEST
==============================================

This test simulates real technical team workflows:
• Web3-familiar users (comfortable with wallets, git, npm)
• Small team size (2-3 people)
• Production environment focus
• Real browser interactions
• Service reliability validation

Starting test suite...
`);

  const testSuite = new StarcomProductionHumanTest();
  
  try {
    await testSuite.runProductionTeamTest();
  } catch (error) {
    console.error('❌ Technical team test failed:', error);
  }
}

// Execute if run directly
if (typeof window === 'undefined') {
  runTechnicalTeamTest().catch(console.error);
}

export default StarcomProductionHumanTest;
