'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { toast } from '@/lib/toast-manager';

interface StarRatingProps {
  topicId: number;
  getTopicRating: (topicId: number) => Promise<{ averageRating: number; totalRatings: number }>;
  getUserTopicRating: (address: string, topicId: number) => Promise<number>;
  rateTopic: (topicId: number, rating: number) => Promise<any>;
  userAddress: string;
}

export function StarRating({ 
  topicId, 
  getTopicRating, 
  getUserTopicRating,
  rateTopic,
  userAddress 
}: StarRatingProps) {
  const [rating, setRating] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isRating, setIsRating] = useState(false);

  // Fetch rating data
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        // Get topic average rating
        const { averageRating: avg, totalRatings: total } = await getTopicRating(topicId);
        setAverageRating(avg);
        setTotalRatings(total);

        // Get user's rating for this topic
        const userRate = await getUserTopicRating(userAddress, topicId);
        setUserRating(userRate);
        setRating(userRate);
      } catch (error) {
        console.error('Failed to fetch ratings:', error);
      }
    };

    if (topicId >= 0) {
      fetchRatings();
    }
  }, [topicId, getTopicRating, getUserTopicRating, userAddress]);

  const handleRating = async (newRating: number) => {
    if (isRating) return;

    setIsRating(true);
    try {
      await rateTopic(topicId, newRating);
      setRating(newRating);
      setUserRating(newRating);
      toast.success(`Rated topic ${newRating} star${newRating > 1 ? 's' : ''}`);
      
      // Refresh ratings after a short delay
      setTimeout(async () => {
        const { averageRating: avg, totalRatings: total } = await getTopicRating(topicId);
        setAverageRating(avg);
        setTotalRatings(total);
      }, 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to rate topic');
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={isRating}
            className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hoveredRating || rating) 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'text-gray-300'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
      
      {totalRatings > 0 && (
        <span className="text-sm text-gray-600">
          {averageRating.toFixed(1)}/5 ({totalRatings})
        </span>
      )}
    </div>
  );
}