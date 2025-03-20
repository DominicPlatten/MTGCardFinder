import React, { useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { CardGraph } from './components/CardGraph';
import { Filters } from './components/Filters';
import { searchCard, getRelatedCards } from './lib/api';
import { Card, CardNode, CardLink } from './types/card';
import { Loader2 } from 'lucide-react';

function App() {
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<CardNode[]>([]);
  const [links, setLinks] = useState<CardLink[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    cmc: '',
    color: '',
    price: '',
    includeLands: false,
    relatedCount: 10,
  });
  const [currentCard, setCurrentCard] = useState<Card | null>(null);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const card = await searchCard(query);
      if (!card) {
        setError('Card not found');
        return;
      }

      setCurrentCard(card);
      const relatedCards = await getRelatedCards(card.name, filters);
      
      // Create nodes and links
      const newNodes: CardNode[] = [
        {
          id: card.id,
          name: card.name,
          image: card.image_uris?.art_crop || '',
          popularity: 100,
          card: card,
        },
        ...relatedCards.map((related: Card) => ({
          id: related.id,
          name: related.name,
          image: related.image_uris?.art_crop || '',
          popularity: Math.random() * 100,
          card: related,
        })),
      ];

      const newLinks: CardLink[] = relatedCards.map((related: Card) => ({
        source: card.id,
        target: related.id,
        weight: Math.random() * 5 + 1,
      }));

      setNodes(newNodes);
      setLinks(newLinks);
    } catch (err) {
      setError('An error occurred while fetching card data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilters: any) => {
    setFilters(newFilters);
    if (currentCard) {
      setLoading(true);
      try {
        const relatedCards = await getRelatedCards(currentCard.name, newFilters);
        
        const newNodes: CardNode[] = [
          {
            id: currentCard.id,
            name: currentCard.name,
            image: currentCard.image_uris?.art_crop || '',
            popularity: 100,
            card: currentCard,
          },
          ...relatedCards.map((related: Card) => ({
            id: related.id,
            name: related.name,
            image: related.image_uris?.art_crop || '',
            popularity: Math.random() * 100,
            card: related,
          })),
        ];

        const newLinks: CardLink[] = relatedCards.map((related: Card) => ({
          source: currentCard.id,
          target: related.id,
          weight: Math.random() * 5 + 1,
        }));

        setNodes(newNodes);
        setLinks(newLinks);
      } catch (err) {
        setError('An error occurred while updating filters');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            MTG Commander Visualizer
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          <SearchBar onSearch={handleSearch} isLoading={loading} />
          <Filters onFilterChange={handleFilterChange} currentFilters={filters} />
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : nodes.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <CardGraph nodes={nodes} links={links} />
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Search for any Magic card to see popular cards in Commander
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;