'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from '@/lib/toast-manager';
import { StarRating } from './StarRating';
import { useAccount } from 'wagmi';

interface TopicSelectorProps {
  selectedTopic: number;
  onTopicChange: (topicId: number) => void;
  topics: { id: number; name: string }[];
  getTopicId: () => Promise<number>;
  getTopics: (topicId: number) => Promise<string>;
  createTopic: (topic: string) => Promise<any>;
  getTopicRating: (topicId: number) => Promise<{ averageRating: number; totalRatings: number }>;
  getUserTopicRating: (address: string, topicId: number) => Promise<number>;
  rateTopic: (topicId: number, rating: number) => Promise<any>;
}

export function TopicSelector({ 
  selectedTopic, 
  onTopicChange,
  topics,
  getTopicId,
  getTopics,
  createTopic,
  getTopicRating,
  getUserTopicRating,
  rateTopic
}: TopicSelectorProps) {
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);
  const { address } = useAccount();
  
  // Filter out topic 0 (General) and add "All Topics" option
  const filteredTopics = topics.filter(t => t.id !== 0);
  const topicsWithAll = [{ id: -1, name: 'All Topics' }, ...filteredTopics];

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) {
      toast.error('Please enter a topic name');
      return;
    }

    setIsCreatingTopic(true);
    try {
      // Get the topic ID before creating (this will be the ID of the new topic)
      const newTopicId = await getTopicId();
      
      await createTopic(newTopicName);
      toast.success(`Topic "${newTopicName}" created!`);
      
      // Select the new topic for filtering
      onTopicChange(newTopicId);
      
      // Reset form
      setNewTopicName('');
      setShowCreateInput(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create topic');
    } finally {
      setIsCreatingTopic(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={selectedTopic.toString()} 
        onValueChange={(value) => onTopicChange(parseInt(value))}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by topic" />
        </SelectTrigger>
        <SelectContent>
          {topicsWithAll.map(topic => (
            <SelectItem key={topic.id} value={topic.id.toString()}>
              {topic.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showCreateInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            placeholder="Topic name..."
            className="px-3 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isCreatingTopic}
          />
          <Button
            onClick={handleCreateTopic}
            disabled={isCreatingTopic}
            size="sm"
          >
            Create
          </Button>
          <Button
            onClick={() => {
              setShowCreateInput(false);
              setNewTopicName('');
            }}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setShowCreateInput(true)}
          size="sm"
          variant="outline"
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          New Topic
        </Button>
      )}

      {selectedTopic >= 0 && address && (
        <StarRating
          topicId={selectedTopic}
          getTopicRating={getTopicRating}
          getUserTopicRating={getUserTopicRating}
          rateTopic={rateTopic}
          userAddress={address}
        />
      )}
    </div>
  );
}