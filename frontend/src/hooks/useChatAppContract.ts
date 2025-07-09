import { useCallback } from 'react';
import { createContractHook } from './useContractFactory';

// Create the base hook using the factory
const useBaseChatApp = createContractHook('ChatApp');

/**
 * Custom hook for ChatApp contract interactions
 * Built on top of the generic contract factory
 * 
 * This demonstrates how to create contract-specific hooks with
 * type-safe methods and business logic
 */
export function useChatAppContract() {
  const { read, write, isLoading } = useBaseChatApp();

  // Read functions with proper typing
  const checkRegistration = useCallback(async (address: string): Promise<boolean> => {
    return await read('isUserRegistered', [address]) as boolean;
  }, [read]);

  const getUserId = useCallback(async (address: string): Promise<string> => {
    return await read('userId', [address]) as string;
  }, [read]);

  const getKarma = useCallback(async (address: string): Promise<string> => {
    const karma = await read('karma', [address]) as bigint;
    return karma.toString();
  }, [read]);

  const getTopicId = useCallback(async (): Promise<number> => {
    const topicId = await read('topicId', []) as bigint;
    return Number(topicId);
  }, [read]);

  const getTopics = useCallback(async (topicId: number): Promise<string> => {
    return await read('topics', [topicId]) as string;
  }, [read]);

  const getTopicRating = useCallback(async (topicId: number): Promise<{ averageRating: number; totalRatings: number }> => {
    const result = await read('getTopicRating', [topicId]) as [bigint, bigint];
    return {
      averageRating: Number(result[0]) / 100, // Convert from percentage to decimal
      totalRatings: Number(result[1])
    };
  }, [read]);

  const getUserTopicRating = useCallback(async (address: string, topicId: number): Promise<number> => {
    const rating = await read('userTopicRatings', [address, topicId]) as number;
    return rating;
  }, [read]);

  // Write functions with proper typing
  const registerUser = useCallback(async (userId: string) => {
    return await write('registerUser', [userId]);
  }, [write]);

  const sendMessage = useCallback(async (message: string) => {
    return await write('sendMessage', [message]);
  }, [write]);

  const sendMessageToTopic = useCallback(async (message: string, topicId: number) => {
    return await write('sendMessageToTopic', [message, topicId]);
  }, [write]);

  const likeMessage = useCallback(async (msgId: string) => {
    return await write('likeMessage', [msgId]);
  }, [write]);

  const dislikeMessage = useCallback(async (msgId: string) => {
    return await write('dislikeMessage', [msgId]);
  }, [write]);

  const createTopic = useCallback(async (topic: string) => {
    return await write('createTopic', [topic]);
  }, [write]);

  const rateTopic = useCallback(async (topicId: number, rating: number) => {
    return await write('rateTopic', [topicId, rating]);
  }, [write]);

  // Backward compatibility aliases
  const giveKarma = likeMessage;
  const takeKarma = dislikeMessage;

  return {
    // State
    isLoading,
    
    // Read functions
    checkRegistration,
    getUserId,
    getKarma,
    getTopicId,
    getTopics,
    getTopicRating,
    getUserTopicRating,
    
    // Write functions
    registerUser,
    sendMessage: sendMessage, // Keep the same name for backward compatibility
    sendContractMessage: sendMessage, // Alias for backward compatibility
    sendMessageToTopic,
    likeMessage,
    dislikeMessage,
    createTopic,
    rateTopic,
    giveKarma, // Backward compatibility
    takeKarma, // Backward compatibility
  };
}