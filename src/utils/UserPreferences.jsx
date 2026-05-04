import {useMemo} from 'react';

/**
 * Custom hook to analyze user interests and score nearby locations.
 *
 * @param {Array} likedItems - List of items user marked as "Go Again"
 * @param {Array} wishlistItems - List of items in user's wishlist
 * @param {Array} fetchedLocations - List of nearby locations to score
 * @returns {Object} { userPreferences, recommendedLocations }
 */
export const useUserPreferences = (
  likedItems,
  wishlistItems,
  fetchedLocations,
) => {
  // Analyze user interests from Go Again and Wishlist items
  const userPreferences = useMemo(() => {
    const preferences = {};
    const allItems = [...likedItems, ...wishlistItems];

    allItems.forEach(item => {
      // 1. Check category (string from our app logic)
      if (item.category) {
        const cat = item.category.trim().toLowerCase().replace(/\s+/g, '_');
        preferences[cat] = (preferences[cat] || 0) + 1;
      }
      // 2. Check types (array from Google API if available)
      if (item.types && Array.isArray(item.types)) {
        item.types.forEach(type => {
          const t = type.trim().toLowerCase().replace(/\s+/g, '_');
          preferences[t] = (preferences[t] || 0) + 1;
        });
      }
    });

    return preferences;
  }, [likedItems, wishlistItems]);

  // Enhanced recommended list with preference scoring
  const recommendedLocations = useMemo(() => {
    if (!fetchedLocations || fetchedLocations.length === 0) return [];

    const totalHistoryCount = [...likedItems, ...wishlistItems].length;

    return [...fetchedLocations]
      .filter(item => item?.rating >= 4) // Quality gate
      .map(item => {
        let preferenceScore = 0;
        const itemCategory = item.category?.toLowerCase() || '';
        const itemTypes = (item.types || []).map(t => t.toLowerCase());

        // Generic categories that should have less influence
        const genericCategories = [
          'restaurant',
          'food',
          'establishment',
          'point_of_interest',
        ];

        // 1. Category Matching
        if (itemCategory && userPreferences[itemCategory]) {
          const isGeneric = genericCategories.includes(itemCategory);
          const baseWeight = isGeneric ? 1 : 15; // Increased base weight
          const frequencyBonus = userPreferences[itemCategory];
          preferenceScore += frequencyBonus * baseWeight;
        }

        // 2. Type Matching
        itemTypes.forEach(type => {
          if (userPreferences[type]) {
            const isGeneric = genericCategories.includes(type);
            const baseWeight = isGeneric ? 0.5 : 8; // Increased base weight
            const frequencyBonus = userPreferences[type];
            preferenceScore += frequencyBonus * baseWeight;
          }
        });

        // 3. Global Multiplier for small history (to make them dominate)
        if (totalHistoryCount > 0 && totalHistoryCount <= 5) {
          preferenceScore *= 3;
        }

        // 4. Keyword & Name Boost for Priority Categories
        const priorityKeywords = [
          {
            keyword: 'bar',
            types: ['bar', 'night_club', 'pub', 'lounge'],
            weight: 50,
          },
          {keyword: 'coffee', types: ['cafe', 'coffee_shop'], weight: 50},
          {
            keyword: 'fast food',
            types: ['fast_food', 'meal_takeaway'],
            weight: 30,
          },
          {keyword: 'steakhouse', types: ['steakhouse'], weight: 30},
          {
            keyword: 'mexican',
            types: ['mexican_restaurant', 'mexican'],
            weight: 30,
          },
          {keyword: 'golf', types: ['golf_course'], weight: 50},
          {keyword: 'rv park', types: ['rv_park', 'campground'], weight: 50},
          {keyword: 'pub', types: ['pub'], weight: 25},
          {keyword: 'steak', types: ['steakhouse'], weight: 25},
        ];

        priorityKeywords.forEach(({keyword, types: relatedTypes, weight}) => {
          const isMatchInName = item.name?.toLowerCase().includes(keyword);
          const isMatchInTypes = itemTypes.some(t =>
            relatedTypes.some(rt => t.includes(rt) || rt.includes(t)),
          );

          if (isMatchInName || isMatchInTypes) {
            // Boost if user has ANY history with this interest or similar types
            const userHasInterest =
              userPreferences[keyword] ||
              relatedTypes.some(rt => userPreferences[rt]) ||
              userPreferences[itemCategory];

            if (userHasInterest) {
              preferenceScore += weight; // Aggressive boost for confirmed priority match

              // Extra bonus for direct name matches
              if (isMatchInName) {
                preferenceScore += 10;
              }
            }
          }
        });

        return {
          ...item,
          finalScore: (item.rating || 0) + preferenceScore,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }, [fetchedLocations, userPreferences, likedItems, wishlistItems]);

  return {userPreferences, recommendedLocations};
};
