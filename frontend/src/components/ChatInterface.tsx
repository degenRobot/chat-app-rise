'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '@/providers/WebSocketProvider';
import { useChatAppContract } from '@/hooks/useChatAppContract';
import { Card } from '@/components/ui/card';
import { toast } from '@/lib/toast-manager';
import { useAccount } from 'wagmi';

// Import modular components
import { RegistrationForm } from './chat/RegistrationForm';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';
import { KarmaFeed, type KarmaUpdate } from './chat/KarmaFeed';
import { TopicSelector } from './chat/TopicSelector';
import type { Message } from './chat/MessageItem';

interface ChatInterfaceProps {
  address: string;
}

export function ChatInterface({ address }: ChatInterfaceProps) {
  const [username, setUsername] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<number>(-1); // -1 means show all topics
  const [topics, setTopics] = useState<{ id: number; name: string }[]>([{ id: 0, name: 'General' }]);
  const hasJustRegisteredRef = useRef(false);
  
  // Removed transaction confirmation state - using toasts instead
  
  const { connector } = useAccount();
  
  // Get raw events from WebSocket provider
  const { contractEvents, isConnected } = useWebSocket();
  
  // Get contract functions first
  const { 
    checkRegistration, 
    registerUser, 
    sendMessage: sendContractMessage,
    sendMessageToTopic,
    likeMessage,
    dislikeMessage,
    getUserId,
    getTopicId,
    getTopics,
    createTopic,
    getTopicRating,
    getUserTopicRating,
    rateTopic
  } = useChatAppContract();
  
  // Process messages from contract events
  const messages: Message[] = contractEvents
    .filter(event => event.decoded && event.eventName === 'MessageSentToTopic')
    .filter(event => {
      // Filter by selected topic if not showing all
      if (selectedTopic === -1) return true; // Show all topics
      
      // For topic 0 (General), match both empty string and "General"
      if (selectedTopic === 0) {
        const msgTopic = event.args?.topic || '';
        return msgTopic === '' || msgTopic === 'General';
      }
      
      const msgTopic = event.args?.topic || '';
      const topicName = topics.find(t => t.id === selectedTopic)?.name || '';
      return msgTopic === topicName;
    })
    .map(event => ({
      user: event.args?.user || '',
      userId: event.args?.userId || '',
      message: event.args?.message || '',
      msgId: event.args?.msgId?.toString() || '0',
      topic: event.args?.topic || '',
      txHash: event.transactionHash || '',
      timestamp: event.timestamp || new Date()
    }));
    
  // Process user registrations (commented out as we handle registration state directly now)
  // const userRegistrations = contractEvents
  //   .filter(event => event.decoded && event.eventName === 'UserRegistered')
  //   .map(event => ({
  //     user: event.args?.user || '',
  //     userId: event.args?.userId || '',
  //     txHash: event.transactionHash || '',
  //     timestamp: event.timestamp || new Date()
  //   }));
    
  // Process karma updates  
  const karmaUpdates: KarmaUpdate[] = contractEvents
    .filter(event => event.decoded && event.eventName === 'KarmaChanged')
    .map(event => ({
      user: event.args?.user || '',
      userId: event.args?.userId || '',
      karma: event.args?.karma?.toString() || '0',
      txHash: event.transactionHash || '',
      timestamp: event.timestamp || new Date()
    }));

  // Track processed topic events to avoid duplicates
  const [processedTopicEvents, setProcessedTopicEvents] = useState<Set<string>>(new Set());
  
  // Process topic creations to update the topic list
  useEffect(() => {
    const topicCreatedEvents = contractEvents.filter(
      event => event.decoded && event.eventName === 'TopicCreated'
    );
    
    topicCreatedEvents.forEach(event => {
      const eventKey = `${event.transactionHash}-${event.logIndex}`;
      if (!processedTopicEvents.has(eventKey)) {
        const newTopicId = Number(event.args?.topicId || 0);
        const newTopicName = event.args?.topic || '';
        
        // Check if this topic is already in our list
        const topicExists = topics.some(t => t.id === newTopicId);
        
        if (!topicExists && newTopicName) {
          // Add the new topic to our list
          setTopics(prev => [...prev, { id: newTopicId, name: newTopicName }]);
          setProcessedTopicEvents(prev => new Set([...prev, eventKey]));
        }
      }
    });
  }, [contractEvents, processedTopicEvents, topics]);

  // Check if user is registered on initial load
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (address && !hasJustRegisteredRef.current && !isRegistered) {
        console.log('🔍 Checking registration for address:', address);
        const registered = await checkRegistration(address);
        console.log('📋 Registration check result:', registered);
        setIsRegistered(registered);
        
        if (registered) {
          const userId = await getUserId(address);
          setUsername(userId);
        }
      }
    };
    
    checkUserRegistration();
  }, [address, checkRegistration, getUserId]); // Removed userRegistrations dependency

  // Load topics when component mounts
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const topicCount = await getTopicId();
        const loadedTopics: { id: number; name: string }[] = [];
        
        // Load all topics from 0 to topicCount
        for (let i = 0; i < topicCount; i++) {
          const topicName = await getTopics(i);
          // Topic 0 with empty string is the default "General" topic
          if (i === 0 && topicName === '') {
            loadedTopics.push({ id: i, name: 'General' });
          } else {
            loadedTopics.push({ id: i, name: topicName || `Topic ${i}` });
          }
        }
        
        setTopics(loadedTopics);
      } catch (error) {
        console.error('Failed to load topics:', error);
      }
    };

    if (isRegistered) {
      loadTopics();
    }
  }, [isRegistered, getTopicId, getTopics]);

  // Backup check for embedded wallet registration (only if not already registered)
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      if (address && !isRegistered && connector?.id === 'embedded-wallet' && !hasJustRegisteredRef.current) {
        console.log('🔄 Backup registration check for embedded wallet');
        try {
          const registered = await checkRegistration(address);
          console.log('📋 Backup check result:', registered);
          if (registered) {
            setIsRegistered(true);
            const userId = await getUserId(address);
            setUsername(userId);
          }
        } catch (error) {
          console.warn('Failed to check registration status:', error);
        }
      }
    };
    
    // Only run backup check if not registered and not just registered
    if (!isRegistered && !hasJustRegisteredRef.current) {
      const timeoutId = setTimeout(checkRegistrationStatus, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [address, connector?.id, checkRegistration, getUserId]); // Removed isRegistered dependency to prevent loops

  const handleRegister = async (usernameInput: string) => {
    if (!usernameInput.trim()) {
      toast.error('Please enter a username');
      return;
    }

    setIsRegistering(true);
    try {
      const result = await registerUser(usernameInput);
      setUsername(usernameInput); // Save the username in parent state
      console.log('📝 Registration result:', result);
      
      // For embedded wallet, immediately update state since transaction is confirmed
      if (result?.isSync) {
        console.log('✅ Sync transaction detected, updating state immediately');
        hasJustRegisteredRef.current = true;
        setIsRegistered(true);
        // Username is already set from the input, no need to change it
        toast.success('Registration successful!');
        
        // Reset the flag after a delay to allow future checks
        setTimeout(() => {
          hasJustRegisteredRef.current = false;
        }, 5000);
      } else {
        // For MetaMask, transaction is already confirmed when we reach here
        console.log('✅ Async transaction confirmed, updating state');
        hasJustRegisteredRef.current = true;
        setIsRegistered(true);
        toast.success('Registration successful!');
        
        // Reset the flag after a delay to allow future checks
        setTimeout(() => {
          hasJustRegisteredRef.current = false;
        }, 5000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    const startTime = Date.now();
    
    try {
      // For embedded wallet, transaction is instantly confirmed
      const isEmbeddedWallet = connector?.id === 'embedded-wallet';
      
      if (isEmbeddedWallet) {
        // Show pending toast
        const toastId = toast.info('Sending message...', { autoClose: false });
        
        // Sync transaction - instant confirmation
        // If showing all topics (-1) or topic 0, use sendMessage (which defaults to topic 0)
        if (selectedTopic === -1 || selectedTopic === 0) {
          await sendContractMessage(message);
        } else {
          await sendMessageToTopic(message, selectedTopic);
        }
        const duration = Date.now() - startTime;
        
        // Update toast to success
        toast.update(toastId, {
          render: `Message sent! Confirmed in ${duration}ms`,
          type: 'success',
          autoClose: 5000
        });
      } else {
        // Regular transaction flow for MetaMask
        const toastId = toast.info('Confirm transaction in wallet...', { autoClose: false });
        
        // If showing all topics (-1) or topic 0, use sendMessage (which defaults to topic 0)
        if (selectedTopic === -1 || selectedTopic === 0) {
          await sendContractMessage(message);
        } else {
          await sendMessageToTopic(message, selectedTopic);
        }
        const duration = Date.now() - startTime;
        
        // Update toast to success
        toast.update(toastId, {
          render: `Message sent! Confirmed in ${duration}ms`,
          type: 'success',
          autoClose: 5000
        });
      }
    } catch (error) {
      console.error('Send message error:', error);
      
      // Handle user rejection
      const errorMessage = error instanceof Error ? error.message : '';
      if ((error as { code?: string }).code === 'ACTION_REJECTED' || errorMessage.includes('rejected')) {
        toast.error('Transaction cancelled');
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to send message');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleGiveKarma = async (msgId: string) => {
    try {
      await likeMessage(msgId);
      toast.success('Message liked! 👍');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to like message';
      toast.error(errorMessage);
    }
  };

  const handleTakeKarma = async (msgId: string) => {
    try {
      await dislikeMessage(msgId);
      toast.info('Message disliked 👎');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to dislike message';
      toast.error(errorMessage);
    }
  };

  // Registration UI
  console.log('🔍 ChatInterface render - isRegistered:', isRegistered, 'address:', address);
  if (!isRegistered) {
    return (
      <RegistrationForm 
        onRegister={handleRegister}
        isLoading={isRegistering}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="h-[600px] flex flex-col">
        <ChatHeader
          isConnected={isConnected}
          messageCount={messages.length}
          username={username}
          address={address}
        />

        <div className="px-4 py-2 border-b">
          <TopicSelector
            selectedTopic={selectedTopic}
            onTopicChange={setSelectedTopic}
            topics={topics}
            getTopicId={getTopicId}
            getTopics={getTopics}
            createTopic={createTopic}
            getTopicRating={getTopicRating}
            getUserTopicRating={getUserTopicRating}
            rateTopic={rateTopic}
          />
        </div>

        <MessageList
          messages={messages}
          currentUserAddress={address}
          onGiveKarma={handleGiveKarma}
          onTakeKarma={handleTakeKarma}
        />

        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isSending}
          selectedTopic={selectedTopic}
          topics={topics}
        />
      </Card>

      <KarmaFeed karmaUpdates={karmaUpdates} />
    </div>
  );
}