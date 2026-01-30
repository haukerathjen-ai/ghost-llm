```tsx
import React from 'react';
import { FileText, Code, ListCollapse, ChevronDown } from 'lucide-react';
import { ghostAPI } from '../lib/ghostAPI';

interface Strategy {
  id: string;
  name: string;
  description: string;
}

interface StrategySelectorProps {
  strategies: Strategy[];
  activeStrategy: string;
  onSelect: (strategyId: string) => void;
}

const STRATEGY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  formatter: FileText,
  coder: Code,
  summarizer: ListCollapse,
};

export const StrategySelector: React.FC<StrategySelectorProps> = ({
  strategies,
  activeStrategy,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStrategyChange = async (strategyId: string) => {
    try {
      await ghostAPI.setStrategy(strategyId);
      onSelect(strategyId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to set strategy:', error);
    }
  };

  const activeStrategyObj = strategies.find((s) => s.id === activeStrategy);
  const ActiveIcon = activeStrategyObj
    ? STRATEGY_ICONS[activeStrategyObj.id] || FileText
    : FileText;

  // Desktop: Button Group
  const renderButtonGroup = () => (
    <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
      {strategies.map((strategy) => {
        const Icon = STRATEGY_ICONS[strategy.id] || FileText;
        const isActive = strategy.id === activeStrategy;

        return (
          <button
            key={strategy.id}
            onClick={() => handleStrategyChange(strategy.id)}
            title={strategy.description}
            className={`
              relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
              transition-colors duration-200 first:rounded-l-lg last:rounded-r-lg
              border-r last:border-r-0 border-gray-300 dark:border-gray-600
              ${
                isActive
                  ? 'bg-blue-600 text-white z-10'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <Icon className="w-4 h-4" />
            <span>{strategy.name}</span>
          </button>
        );
      })}
    </div>
  );

  // Mobile: Dropdown
  const renderDropdown = () => (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ActiveIcon className="w-4 h-4" />
          <span>{activeStrategyObj?.name || 'Select Strategy'}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
          {strategies.map((strategy) => {
            const Icon = STRATEGY_ICONS[strategy.id] || FileText;
            const isActive = strategy.id === activeStrategy;

            return (
              <button
                key={strategy.id}
                onClick={() => handleStrategyChange(strategy.id)}
                title={strategy.description}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-sm text-left
                  transition-colors border-b last:border-b-0 border-gray-200 dark:border-gray-700
                  ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{strategy.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {strategy.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="strategy-selector">
      {/* Desktop: Button Group */}
      <div className="hidden md:block">{renderButtonGroup()}</div>

      {/* Mobile: Dropdown */}
      <div className="block md:hidden">{renderDropdown()}</div>
    </div>
  );
};
```