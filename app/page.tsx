'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; // Adjust this path to your setup

// Initilalize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Define types based on your schema
interface Category {
  name: string;
  color: string;
}

interface Card {
  id: number;
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  category_name: string;
  categories: Category | null;
}

export default function HomePage() {
  const supabase = createClient();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch initial cards sorted by name
  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        categories (
          name,
          color
        )
      `)
      .order('name', { ascending: true });

    if (!error && data) {
      setCards(data as unknown as Card[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCards();

    // 2. Subscribe to real-time changes in the 'cards' table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards' },
        () => {
          // Whenever ANY change happens (INSERT, UPDATE, DELETE), refetch the list
          fetchCards();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-slate-500 font-medium">Loading digital rolodex...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Business Directory
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            A real-time updated list of professional contacts.
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((card) => {
            // Encode the name seamlessly to act as a unique seed for the Notionists avatar
            const avatarSeed = encodeURIComponent(card.name);
            const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${avatarSeed}`;

            return (
              <div
                key={card.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:border-slate-300"
              >
                {/* DiceBear Notionists Avatar */}
                <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden mb-4 border-2 border-slate-200">
                  <img
                    src={avatarUrl}
                    alt={`${card.name}'s avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Details */}
                <h2 className="text-lg font-bold text-slate-800 leading-tight">
                  {card.name}
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {card.title}
                </p>
                <p className="text-xs text-slate-400 font-semibold mb-3">
                  {card.company || 'Independent'}
                </p>

                {/* Contact Badges */}
                <div className="w-full space-y-1.5 text-left text-xs text-slate-600 border-t border-slate-100 pt-3 flex-grow">
                  {card.phone && (
                    <p className="truncate">
                      📞 <span className="ml-1">{card.phone}</span>
                    </p>
                  )}
                  {card.email && (
                    <p className="truncate">
                      ✉️ <span className="ml-1">{card.email}</span>
                    </p>
                  )}
                  {card.website && (
                    <p className="truncate">
                      🌐{' '}
                      <a
                        href={card.website}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-1 text-blue-600 hover:underline"
                      >
                        Visit Site
                      </a>
                    </p>
                  )}
                </div>

                {/* Category Pill utilizing the stored Tailwind colors */}
                {card.categories && (
                  <span
                    className={`mt-4 inline-block text-white text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full ${
                      card.categories.color || 'bg-slate-500'
                    }`}
                  >
                    {card.categories.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {cards.length === 0 && (
          <p className="text-center text-slate-400 mt-12">No business cards found.</p>
        )}
      </div>
    </main>
  );
}
