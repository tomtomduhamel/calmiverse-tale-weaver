import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Check, Search, UserPlus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Child } from '@/types/child';
import { getCategoryDisplay, getProfileCategory, type ProfileCategory } from '@/utils/profileCategory';
import CharacterCategoryFilter from './CharacterCategoryFilter';
import { countByCategory } from '@/utils/profileCategory';
import { useNavigate } from 'react-router-dom';

interface MagicChildrenDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: Child[];
  selectedChildrenIds: string[];
  onToggleChild: (childId: string) => void;
}

export const MagicChildrenDrawer: React.FC<MagicChildrenDrawerProps> = ({
  open,
  onOpenChange,
  children,
  selectedChildrenIds,
  onToggleChild
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Filtres
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProfileCategory>('all');
  const [childGenderFilter, setChildGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  // Compteurs
  const categoryCounts = useMemo(() => countByCategory(children), [children]);

  // Filtrage et tri identique à l'ancien composant
  const displayChildren = useMemo(() => {
    return [...children]
      .filter(child => {
        const category = getProfileCategory(child);
        if (categoryFilter !== 'all' && category !== categoryFilter) return false;
        if (categoryFilter === 'child' && childGenderFilter !== 'all') {
          if (child.gender !== childGenderFilter) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aStories = (a as any).storiesCount || 0;
        const bStories = (b as any).storiesCount || 0;
        return bStories - aStories; // Populaire en premier
      });
  }, [children, categoryFilter, childGenderFilter]);

  const content = (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="px-4 pb-2 border-b">
        <CharacterCategoryFilter
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          childGenderFilter={childGenderFilter}
          onChildGenderFilterChange={setChildGenderFilter}
          counts={categoryCounts}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {displayChildren.length === 0 ? (
           <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
             <p className="mb-4">Aucun personnage ne correspond aux filtres.</p>
             <Button variant="outline" onClick={() => navigate('/children?action=create')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Créer un personnage
             </Button>
           </div>
        ) : (
          displayChildren.map(child => {
            const isSelected = selectedChildrenIds.includes(child.id);
            const { icon: CategoryIcon, color } = getCategoryDisplay(child);
            const storiesCount = (child as any).storiesCount || 0;
            
            return (
              <div
                key={child.id}
                onClick={() => onToggleChild(child.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none
                  ${isSelected ? 'bg-primary/5 border-primary shadow-sm' : 'border-transparent hover:bg-muted/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-background border ${isSelected ? 'border-primary/50' : 'border-border/50'}`}>
                    <CategoryIcon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{child.name}</h4>
                    {storiesCount > 0 && <span className="text-xs text-muted-foreground">{storiesCount} histoires</span>}
                  </div>
                </div>
                <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30'}
                `}>
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t bg-background/50 backdrop-blur-sm sticky bottom-0">
         <Button className="w-full" onClick={() => onOpenChange(false)}>
            Continuer avec {selectedChildrenIds.length} personnage{selectedChildrenIds.length > 1 ? 's' : ''}
         </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>Qui participe à l'histoire ?</DrawerTitle>
            <DrawerDescription>Sélectionnez les personnages pour cette aventure.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Qui participe à l'histoire ?</DialogTitle>
          <DialogDescription>Sélectionnez les personnages pour cette aventure.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
