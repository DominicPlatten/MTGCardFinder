import axios from 'axios';
import { Card } from '../types/card';

const SCRYFALL_API = 'https://api.scryfall.com';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface Filters {
  type: string;
  cmc: string;
  color: string;
  price: string;
  includeLands: boolean;
  relatedCount: number;
}

const cache = new Map<string, CacheEntry>();

const getFromCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
};

const setCache = (key: string, data: any) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const searchCard = async (query: string): Promise<Card | null> => {
  const cacheKey = `search:${query}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await axios.get(`${SCRYFALL_API}/cards/named`, {
      params: { fuzzy: query },
    });
    setCache(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching card:', error);
    return null;
  }
};

const filterCards = (cards: Card[], filters: Filters): Card[] => {
  return cards.filter(card => {
    // Handle lands filtering
    const isLand = card.type_line.toLowerCase().includes('land');
    if (isLand && !filters.includeLands) {
      return false;
    }

    // Handle type filtering
    if (filters.type) {
      const cardType = card.type_line.toLowerCase();
      const filterType = filters.type.toLowerCase();
      
      // Special handling for specific types
      if (filterType === 'creature' && !cardType.includes('creature')) return false;
      if (filterType === 'instant' && !cardType.includes('instant')) return false;
      if (filterType === 'sorcery' && !cardType.includes('sorcery')) return false;
      if (filterType === 'artifact' && !cardType.includes('artifact')) return false;
      if (filterType === 'enchantment' && !cardType.includes('enchantment')) return false;
      if (filterType === 'planeswalker' && !cardType.includes('planeswalker')) return false;
    }
    
    // Handle CMC filtering
    if (filters.cmc) {
      const cardCmc = Math.floor(card.cmc); // Handle fractional mana costs
      const filterCmc = filters.cmc === '8+' ? 8 : parseInt(filters.cmc);
      
      if (filters.cmc === '8+') {
        if (cardCmc < 8) return false;
      } else {
        if (cardCmc !== filterCmc) return false;
      }
    }
    
    // Handle color filtering
    if (filters.color) {
      // Check both colors and color identity
      const hasColor = card.color_identity.includes(filters.color) || 
                      (card.colors && card.colors.includes(filters.color));
      if (!hasColor) return false;
    }
    
    // Handle price filtering
    if (filters.price && card.prices?.usd) {
      const price = parseFloat(card.prices.usd);
      
      switch (filters.price) {
        case 'budget':
          if (price >= 1) return false;
          break;
        case 'moderate':
          if (price < 1 || price >= 5) return false;
          break;
        case 'expensive':
          if (price < 5 || price >= 20) return false;
          break;
        case 'premium':
          if (price < 20) return false;
          break;
      }
    }
    
    return true;
  });
};

export const getRelatedCards = async (cardName: string, filters: Filters) => {
  const cacheKey = `related:${cardName}:${JSON.stringify(filters)}`;
  let cards = getFromCache(cacheKey);
  
  if (!cards) {
    try {
      // First get the searched card to use its characteristics
      const searchedCard = await searchCard(cardName);
      if (!searchedCard) return [];

      // Build search query based on the card's characteristics
      const searchParts = [];
      
      // Include format restriction
      searchParts.push('format:commander');
      
      // Include color identity if the card has one
      if (searchedCard.color_identity.length > 0) {
        const colorIdentity = searchedCard.color_identity.join('');
        searchParts.push(`commander:${colorIdentity}`);
      }

      // Include cards with similar converted mana cost (±2)
      const cmcMin = Math.max(0, searchedCard.cmc - 2);
      const cmcMax = searchedCard.cmc + 2;
      searchParts.push(`(cmc>=${cmcMin} AND cmc<=${cmcMax})`);

      // Exclude the searched card itself
      searchParts.push(`-"${searchedCard.name}"`);

      // Sort by EDHREC rank
      searchParts.push('sort:edhrec');

      const searchQuery = searchParts.join(' ');

      const response = await axios.get(`${SCRYFALL_API}/cards/search`, {
        params: {
          q: searchQuery,
          unique: 'cards'
        }
      });
      
      cards = response.data.data.map((card: Card) => ({
        ...card,
        popularity: Math.random() * 100, // Mock popularity score
      }));
      
      setCache(cacheKey, cards);
    } catch (error) {
      console.error('Error fetching related cards:', error);
      return [];
    }
  }
  
  // Apply filters and limit
  const filteredCards = filterCards(cards, filters);
  return filteredCards.slice(0, filters.relatedCount);
};