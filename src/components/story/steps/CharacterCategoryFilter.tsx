import React from 'react';
import { Button } from '@/components/ui/button';
import { Baby, UserCircle, Cat, User, Heart, Users } from 'lucide-react';
import type { ProfileCategory } from '@/utils/profileCategory';

interface CharacterCategoryFilterProps {
  categoryFilter: 'all' | ProfileCategory;
  onCategoryFilterChange: (value: 'all' | ProfileCategory) => void;
  childGenderFilter: 'all' | 'boy' | 'girl';
  onChildGenderFilterChange: (value: 'all' | 'boy' | 'girl') => void;
  counts: { children: number; adults: number; pets: number };
  compact?: boolean;
}

const CharacterCategoryFilter: React.FC<CharacterCategoryFilterProps> = ({
  categoryFilter,
  onCategoryFilterChange,
  childGenderFilter,
  onChildGenderFilterChange,
  counts,
  compact = false
}) => {
  const totalCount = counts.children + counts.adults + counts.pets;

  const categoryButtons = [
    { value: 'all' as const, icon: Users, label: 'Tous', count: totalCount },
    { value: 'child' as const, icon: Baby, label: 'Enfants', count: counts.children },
    { value: 'adult' as const, icon: UserCircle, label: 'Adultes', count: counts.adults },
    { value: 'pet' as const, icon: Cat, label: 'Animaux', count: counts.pets },
  ];

  const genderButtons = [
    { value: 'all' as const, icon: Baby, label: 'Tous' },
    { value: 'boy' as const, icon: User, label: 'Garçons' },
    { value: 'girl' as const, icon: Heart, label: 'Filles' },
  ];

  return (
    <div className="space-y-3">
      {/* Filtres primaires - Catégories */}
      <div className="flex flex-wrap gap-2">
        {categoryButtons.map(({ value, icon: Icon, label, count }) => (
          <Button
            key={value}
            variant={categoryFilter === value ? 'default' : 'outline'}
            size={compact ? 'sm' : 'default'}
            onClick={() => onCategoryFilterChange(value)}
            className={`gap-1.5 ${count === 0 && value !== 'all' ? 'opacity-50' : ''}`}
            disabled={count === 0 && value !== 'all'}
          >
            <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            {!compact && <span>{label}</span>}
            {count > 0 && (
              <span className={`${compact ? 'text-xs' : 'text-sm'} opacity-70`}>
                ({count})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Filtres secondaires - Genre (visible uniquement si catégorie "enfants" sélectionnée) */}
      {categoryFilter === 'child' && counts.children > 0 && (
        <div className="flex flex-wrap gap-2 pl-2 border-l-2 border-primary/30">
          {genderButtons.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={childGenderFilter === value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onChildGenderFilterChange(value)}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {!compact && <span>{label}</span>}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CharacterCategoryFilter;
