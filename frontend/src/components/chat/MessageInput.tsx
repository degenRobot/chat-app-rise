'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading?: boolean;
  selectedTopic?: number;
  topics?: { id: number; name: string }[];
}

export function MessageInput({ onSendMessage, isLoading = false, selectedTopic = -1, topics = [] }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;
    
    await onSendMessage(message);
    setMessage(''); // Clear on successful send
  };

  // Determine which topic the message will be sent to
  const getTopicName = () => {
    if (selectedTopic === -1 || selectedTopic === 0) {
      return 'General';
    }
    const topic = topics.find(t => t.id === selectedTopic);
    return topic?.name || 'General';
  };

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-2">
        <Input
          placeholder={`Type a message... (sending to ${getTopicName()})`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={handleSend} 
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
}