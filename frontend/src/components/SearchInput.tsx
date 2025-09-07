import { useState } from 'react';

interface SearchInputProps {
  onSymbolChange: (symbol: string) => void;
  currentSymbol: string;
}

export const UnifiedSearch = ({ onSymbolChange }: SearchInputProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSymbolChange(inputValue.trim().toUpperCase());
      setIsSearching(false);
      setInputValue('');
    }
  };

  const handleCancel = () => {
    setIsSearching(false);
    setInputValue('');
  };

  if (isSearching) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Symbol"
          className="px-3 py-1 bg-gray-800 text-white placeholder-gray-500 focus:outline-none w-24 text-sm"
          autoFocus
        />
        <button type="submit" className="text-white hover:text-gray-300 text-sm">
          ✓
        </button>
        <button type="button" onClick={handleCancel} className="text-gray-400 hover:text-gray-300 text-sm">
          ✕
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsSearching(true)}
      className="p-1 text-gray-400 hover:text-white"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </button>
  );
};