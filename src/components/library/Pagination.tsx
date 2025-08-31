import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const isMobile = useIsMobile();
  
  if (totalPages <= 1) return null;

  // Version mobile optimisée
  if (isMobile) {
    const showPages = [];
    const delta = 1; // Nombre de pages à afficher de chaque côté de la page courante
    
    // Logique pour afficher les pages intelligemment sur mobile
    if (totalPages <= 5) {
      // Si 5 pages ou moins, on affiche tout
      for (let i = 1; i <= totalPages; i++) {
        showPages.push(i);
      }
    } else {
      // Pour plus de 5 pages, logique complexe
      showPages.push(1); // Toujours afficher la première page
      
      if (currentPage <= 3) {
        // Début : 1, 2, 3, 4, ..., dernière
        for (let i = 2; i <= Math.min(4, totalPages - 1); i++) {
          showPages.push(i);
        }
        if (totalPages > 4) {
          showPages.push('ellipsis');
          showPages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        // Fin : 1, ..., avant-dernière-2, avant-dernière-1, avant-dernière, dernière
        if (totalPages > 4) {
          showPages.push('ellipsis');
          for (let i = Math.max(2, totalPages - 3); i <= totalPages; i++) {
            showPages.push(i);
          }
        }
      } else {
        // Milieu : 1, ..., courante-1, courante, courante+1, ..., dernière
        showPages.push('ellipsis');
        for (let i = currentPage - delta; i <= currentPage + delta; i++) {
          showPages.push(i);
        }
        showPages.push('ellipsis');
        showPages.push(totalPages);
      }
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-6 px-4">
        {/* Bouton précédent */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 border-border/40 hover:border-primary/20 disabled:opacity-50"
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>

        {/* Pages */}
        <div className="flex items-center gap-0.5 mx-2">
          {showPages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <div key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-6">
                  <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                </div>
              );
            }
            
            const isActive = currentPage === page;
            return (
              <Button
                key={page}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={`h-8 w-8 p-0 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Bouton suivant */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 border-border/40 hover:border-primary/20 disabled:opacity-50"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Version desktop (affichage complet)
  return (
    <div className="flex justify-center gap-2 mt-6">
      {/* Bouton précédent */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Précédent
      </Button>

      {/* Pages */}
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`min-w-[40px] ${
              currentPage === page ? "shadow-sm" : ""
            }`}
          >
            {page}
          </Button>
        ))}
      </div>

      {/* Bouton suivant */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="gap-1"
      >
        Suivant
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default Pagination;