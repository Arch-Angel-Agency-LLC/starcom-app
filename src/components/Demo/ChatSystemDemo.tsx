import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  HStack,
  Badge,
  useToast,
  Divider,
  Code,
  Container,
  FormControl,
  FormLabel,
  Switch,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tooltip,
} from '@chakra-ui/react';
import { ChatProviderType } from '../../lib/chat/ChatProviderFactory';

/**
 * ChatSystemDemo Component
 * 
 * A comprehensive visual demo of the Starcom chat system showing:
 * - Global Chat
 * - Group Chat
 * - Direct Messages
 * - Different providers (Gun, Nostr, Secure)
 * - Error handling
 * - Feature detection
 */
const ChatSystemDemo = () => {
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const [providerType, setProviderType] = useState<ChatProviderType>('gun');
  const [message, setMessage] = useState('');
  const [demoUser, setDemoUser] = useState('');
  const [dmTarget, setDmTarget] = useState('');
  const [channelName, setChannelName] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [testMode, setTestMode] = useState(false);
  
  // Get the chat context
  const chat = useChat();
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, logMessages]);
  
  // Add a log message
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    setLogMessages(prev => [...prev, `${type.toUpperCase()}: ${formattedMessage}`]);
    
    toast({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      description: message,
      status: type === 'error' ? 'error' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info',
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Connect to the selected provider
  const handleConnect = async () => {
    try {
      addLog(`Connecting to ${providerType} provider...`, 'info');
      
      await chat.connect({
        type: providerType,
        options: {
          userId: demoUser || `demo-user-${Date.now().toString(36)}`,
          userName: `Demo User (${providerType})`,
        }
      });
      
      addLog(`Connected to ${providerType} provider successfully`, 'success');
      
      // Join global chat channel by default
      await handleJoinGlobalChat();
      
    } catch (error) {
      addLog(`Failed to connect: ${error.message}`, 'error');
      console.error('Connection error:', error);
    }
  };
  
  // Disconnect from the current provider
  const handleDisconnect = async () => {
    try {
      await chat.disconnect();
      addLog('Disconnected successfully', 'success');
    } catch (error) {
      addLog(`Failed to disconnect: ${error.message}`, 'error');
    }
  };
  
  // Send a message in the current channel
  const handleSendMessage = async () => {
    if (!message.trim()) {
      addLog('Cannot send empty message', 'warning');
      return;
    }
    
    if (!chat.currentChannel) {
      addLog('No channel selected', 'warning');
      return;
    }
    
    try {
      await chat.sendMessage(message);
      setMessage('');
      addLog('Message sent successfully', 'success');
    } catch (error) {
      addLog(`Failed to send message: ${error.message}`, 'error');
    }
  };
  
  // Join the global chat channel
  const handleJoinGlobalChat = async () => {
    try {
      const globalChannelId = 'global-chat';
      
      // First try to join
      try {
        await chat.joinChannel(globalChannelId);
        addLog('Joined global chat', 'success');
      } catch (error) {
        // If joining fails, create the channel
        addLog('Global chat does not exist, creating...', 'info');
        await chat.createChannel('Global Chat', 'global', []);
        await chat.joinChannel(globalChannelId);
        addLog('Created and joined global chat', 'success');
      }
      
      chat.setCurrentChannel(globalChannelId);
    } catch (error) {
      addLog(`Failed to join global chat: ${error.message}`, 'error');
    }
  };
  
  // Create a new group chat
  const handleCreateGroupChat = async () => {
    if (!channelName.trim()) {
      addLog('Group name cannot be empty', 'warning');
      return;
    }
    
    try {
      const groupId = `group-${Date.now().toString(36)}`;
      await chat.createChannel(channelName, 'team', [demoUser]);
      await chat.joinChannel(groupId);
      chat.setCurrentChannel(groupId);
      addLog(`Created and joined group "${channelName}"`, 'success');
      setChannelName('');
    } catch (error) {
      addLog(`Failed to create group: ${error.message}`, 'error');
    }
  };
  
  // Start a direct message with another user
  const handleStartDM = async () => {
    if (!dmTarget.trim()) {
      addLog('DM target cannot be empty', 'warning');
      return;
    }
    
    try {
      const dmChannelId = `dm-${demoUser}-${dmTarget}`;
      
      try {
        await chat.joinChannel(dmChannelId);
      } catch (error) {
        await chat.createChannel(`DM with ${dmTarget}`, 'direct', [demoUser, dmTarget]);
        await chat.joinChannel(dmChannelId);
      }
      
      chat.setCurrentChannel(dmChannelId);
      addLog(`Started DM with ${dmTarget}`, 'success');
    } catch (error) {
      addLog(`Failed to start DM: ${error.message}`, 'error');
    }
  };
  
  // Run automated tests
  const runAutomatedTests = async () => {
    setTestMode(true);
    addLog('Starting automated tests...', 'info');
    
    try {
      // 1. Test connecting
      addLog('Test: Connecting to provider', 'info');
      if (!chat.isConnected) {
        await handleConnect();
      }
      
      // 2. Test global chat
      addLog('Test: Joining global chat', 'info');
      await handleJoinGlobalChat();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Test: Sending message to global chat', 'info');
      setMessage(`Test message from automated test at ${new Date().toISOString()}`);
      await handleSendMessage();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 3. Test group chat
      addLog('Test: Creating group chat', 'info');
      setChannelName(`Test Group ${Date.now().toString(36)}`);
      await handleCreateGroupChat();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Test: Sending message to group chat', 'info');
      setMessage(`Group test message at ${new Date().toISOString()}`);
      await handleSendMessage();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 4. Test DM
      addLog('Test: Starting DM', 'info');
      setDmTarget(`test-user-${Date.now().toString(36)}`);
      await handleStartDM();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addLog('Test: Sending DM', 'info');
      setMessage(`DM test message at ${new Date().toISOString()}`);
      await handleSendMessage();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 5. Test disconnecting
      addLog('Test: Disconnecting', 'info');
      await handleDisconnect();
      
      addLog('Automated tests completed successfully', 'success');
    } catch (error) {
      addLog(`Automated test failed: ${error.message}`, 'error');
    } finally {
      setTestMode(false);
    }
  };
  
  // Get appropriate color for chat type
  const getChatTypeColor = (channelId: string) => {
    if (channelId?.startsWith('global')) return 'green';
    if (channelId?.startsWith('group')) return 'blue';
    if (channelId?.startsWith('dm')) return 'purple';
    return 'gray';
  };
  
  // Get readable name for chat type
  const getChatTypeName = (channelId: string) => {
    if (channelId?.startsWith('global')) return 'Global';
    if (channelId?.startsWith('group')) return 'Group';
    if (channelId?.startsWith('dm')) return 'DM';
    return 'Unknown';
  };

  return (
    <Container maxW="container.xl" py={5}>
      <Heading mb={5}>Starcom Chat System Demo</Heading>
      <Text mb={5}>This demo allows you to test all three chat types (Global, Group, DM) with different providers.</Text>
      
      <Tabs variant="enclosed" mb={5}>
        <TabList>
          <Tab>Chat Interface</Tab>
          <Tab>Debug Logs</Tab>
          <Tab>System Info</Tab>
        </TabList>
        
        <TabPanels>
          <TabPanel>
            <Flex direction={{ base: 'column', md: 'row' }} gap={5}>
              {/* Left sidebar - Connection and channel options */}
              <Box width={{ base: '100%', md: '30%' }}>
                <VStack spacing={4} align="stretch">
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="md" mb={3}>Connection</Heading>
                    
                    <FormControl mb={3}>
                      <FormLabel>Provider</FormLabel>
                      <Select 
                        value={providerType}
                        onChange={(e) => setProviderType(e.target.value as ChatProviderType)}
                        isDisabled={chat.isConnected}
                      >
                        <option value="gun">Gun.js</option>
                        <option value="nostr">Nostr</option>
                        <option value="secure">Secure</option>
                      </Select>
                    </FormControl>
                    
                    <FormControl mb={3}>
                      <FormLabel>User ID</FormLabel>
                      <Input 
                        value={demoUser}
                        onChange={(e) => setDemoUser(e.target.value)}
                        placeholder="Enter user ID or leave empty for random"
                        isDisabled={chat.isConnected}
                      />
                    </FormControl>
                    
                    <HStack mt={4}>
                      <Button 
                        colorScheme="blue" 
                        onClick={handleConnect}
                        isDisabled={chat.isConnected}
                        isLoading={chat.isLoading}
                      >
                        Connect
                      </Button>
                      <Button 
                        colorScheme="red" 
                        onClick={handleDisconnect}
                        isDisabled={!chat.isConnected}
                      >
                        Disconnect
                      </Button>
                    </HStack>
                  </Box>
                  
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="md" mb={3}>Channels</Heading>
                    
                    <VStack spacing={3} align="stretch">
                      <Button 
                        colorScheme="green" 
                        onClick={handleJoinGlobalChat}
                        isDisabled={!chat.isConnected}
                      >
                        Join Global Chat
                      </Button>
                      
                      <Divider />
                      
                      <FormControl>
                        <FormLabel>Create Group Chat</FormLabel>
                        <Input 
                          value={channelName}
                          onChange={(e) => setChannelName(e.target.value)}
                          placeholder="Group name"
                          mb={2}
                          isDisabled={!chat.isConnected}
                        />
                        <Button 
                          colorScheme="blue" 
                          onClick={handleCreateGroupChat}
                          isDisabled={!chat.isConnected}
                          width="full"
                        >
                          Create Group
                        </Button>
                      </FormControl>
                      
                      <Divider />
                      
                      <FormControl>
                        <FormLabel>Start Direct Message</FormLabel>
                        <Input 
                          value={dmTarget}
                          onChange={(e) => setDmTarget(e.target.value)}
                          placeholder="Target user ID"
                          mb={2}
                          isDisabled={!chat.isConnected}
                        />
                        <Button 
                          colorScheme="purple" 
                          onClick={handleStartDM}
                          isDisabled={!chat.isConnected}
                          width="full"
                        >
                          Start DM
                        </Button>
                      </FormControl>
                    </VStack>
                  </Box>
                  
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="md" mb={3}>Automated Testing</Heading>
                    <Button 
                      colorScheme="orange" 
                      onClick={runAutomatedTests}
                      isDisabled={testMode}
                      width="full"
                    >
                      Run Tests
                    </Button>
                    <Text fontSize="sm" mt={2}>
                      This will automatically test all chat types with the selected provider.
                    </Text>
                  </Box>
                </VStack>
              </Box>
              
              {/* Right side - Chat display */}
              <Box width={{ base: '100%', md: '70%' }} borderWidth={1} borderRadius="md" p={4}>
                <Flex direction="column" height="60vh">
                  {/* Chat header */}
                  <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                      <Heading size="md">
                        {chat.currentChannel ? (
                          <>
                            <Badge colorScheme={getChatTypeColor(chat.currentChannel)} mr={2}>
                              {getChatTypeName(chat.currentChannel)}
                            </Badge>
                            {chat.currentChannel}
                          </>
                        ) : (
                          'No channel selected'
                        )}
                      </Heading>
                      <Text fontSize="sm">
                        {chat.isConnected ? (
                          <Badge colorScheme="green">Connected ({providerType})</Badge>
                        ) : (
                          <Badge colorScheme="red">Disconnected</Badge>
                        )}
                      </Text>
                    </Box>
                    
                    <Badge colorScheme="blue">
                      {chat.channels.length} Channels
                    </Badge>
                  </Flex>
                  
                  {/* Message display */}
                  <Box 
                    flex="1" 
                    overflowY="auto" 
                    borderWidth={1} 
                    borderRadius="md" 
                    p={3}
                    backgroundColor="gray.50"
                  >
                    {chat.currentChannel && chat.messages[chat.currentChannel]?.length > 0 ? (
                      chat.messages[chat.currentChannel].map((msg) => (
                        <Box 
                          key={msg.id} 
                          mb={2} 
                          p={2} 
                          borderRadius="md"
                          backgroundColor={msg.senderId === demoUser ? "blue.50" : "white"}
                          borderWidth={1}
                        >
                          <Flex justifyContent="space-between">
                            <Text fontWeight="bold">{msg.senderName}</Text>
                            <Text fontSize="xs" color="gray.500">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </Text>
                          </Flex>
                          <Text>{msg.content}</Text>
                        </Box>
                      ))
                    ) : (
                      <Text color="gray.500" textAlign="center" mt={10}>
                        {chat.currentChannel 
                          ? "No messages in this channel yet" 
                          : "Select a channel to see messages"}
                      </Text>
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                  
                  {/* Message input */}
                  <HStack mt={4}>
                    <Input 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      isDisabled={!chat.isConnected || !chat.currentChannel}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                    />
                    <Button 
                      colorScheme="blue" 
                      onClick={handleSendMessage}
                      isDisabled={!chat.isConnected || !chat.currentChannel}
                    >
                      Send
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            </Flex>
          </TabPanel>
          
          <TabPanel>
            <Box 
              height="60vh" 
              overflowY="auto" 
              borderWidth={1} 
              borderRadius="md" 
              p={4}
              fontFamily="monospace"
              fontSize="sm"
              backgroundColor="black"
              color="white"
            >
              {logMessages.length > 0 ? (
                logMessages.map((log, index) => (
                  <Text key={index} mb={1}>
                    {log.startsWith('ERROR') ? (
                      <span style={{ color: 'red' }}>{log}</span>
                    ) : log.startsWith('WARNING') ? (
                      <span style={{ color: 'yellow' }}>{log}</span>
                    ) : log.startsWith('SUCCESS') ? (
                      <span style={{ color: 'green' }}>{log}</span>
                    ) : (
                      <span style={{ color: 'cyan' }}>{log}</span>
                    )}
                  </Text>
                ))
              ) : (
                <Text color="gray.500">No logs yet</Text>
              )}
              <div ref={messagesEndRef} />
            </Box>
            <Button mt={3} onClick={() => setLogMessages([])}>Clear Logs</Button>
          </TabPanel>
          
          <TabPanel>
            <Accordion allowMultiple defaultIndex={[0]}>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Current Provider Details
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <VStack align="stretch" spacing={2}>
                    <HStack>
                      <Text fontWeight="bold" width="150px">Provider Type:</Text>
                      <Badge colorScheme="blue">{providerType}</Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold" width="150px">Connection Status:</Text>
                      <Badge colorScheme={chat.isConnected ? "green" : "red"}>
                        {chat.isConnected ? "Connected" : "Disconnected"}
                      </Badge>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold" width="150px">User ID:</Text>
                      <Code>{demoUser || "Not set"}</Code>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold" width="150px">Current Channel:</Text>
                      <Code>{chat.currentChannel || "None"}</Code>
                    </HStack>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Available Channels ({chat.channels.length})
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  {chat.channels.length > 0 ? (
                    <VStack align="stretch">
                      {chat.channels.map(channel => (
                        <HStack key={channel.id} borderWidth={1} p={2} borderRadius="md">
                          <Badge colorScheme={getChatTypeColor(channel.id)}>
                            {getChatTypeName(channel.id)}
                          </Badge>
                          <Text flex="1">{channel.name}</Text>
                          <Button 
                            size="sm" 
                            onClick={() => chat.setCurrentChannel(channel.id)}
                            colorScheme={chat.currentChannel === channel.id ? "green" : "blue"}
                          >
                            {chat.currentChannel === channel.id ? "Selected" : "Select"}
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  ) : (
                    <Text color="gray.500">No channels available</Text>
                  )}
                </AccordionPanel>
              </AccordionItem>
              
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left" fontWeight="bold">
                    Chat System Configuration
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel>
                  <VStack align="stretch" spacing={3}>
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="encryption" mb="0">
                        Encryption Enabled
                      </FormLabel>
                      <Switch 
                        id="encryption" 
                        isChecked={chat.provider?.isEncryptionEnabled?.() || false}
                        onChange={() => {
                          if (chat.provider?.setEncryptionEnabled) {
                            chat.provider.setEncryptionEnabled(
                              !chat.provider.isEncryptionEnabled()
                            );
                            addLog(
                              `Encryption ${chat.provider.isEncryptionEnabled() ? 'enabled' : 'disabled'}`,
                              'info'
                            );
                          }
                        }}
                        isDisabled={!chat.provider?.setEncryptionEnabled}
                      />
                    </FormControl>
                    
                    <Box>
                      <Text fontWeight="bold" mb={1}>Supported Features:</Text>
                      <Flex wrap="wrap" gap={2}>
                        {chat.provider?.getSupportedFeatures?.() ? (
                          chat.provider.getSupportedFeatures().map(feature => (
                            <Badge key={feature} colorScheme="green" m={1}>
                              {feature}
                            </Badge>
                          ))
                        ) : (
                          <Text color="gray.500">No provider connected</Text>
                        )}
                      </Flex>
                    </Box>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default ChatSystemDemo;
