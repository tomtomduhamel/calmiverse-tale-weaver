import React, { useState, useMemo } from "react";
import ProfilesHeaderV2 from "./ProfilesHeaderV2";
import ChildrenSearchBar from "./ChildrenSearchBar";
import MobileChildrenFilters from "./MobileChildrenFilters";
import ChildrenGridLayout from "./ChildrenGridLayout";
import AddChildModal from "./AddChildModal";
import type { Child, ChildGender, PetType } from "@/types/child";
import { calculateAge } from "@/utils/age";
import { getProfileCategory, countByCategory, ProfileCategory } from "@/utils/profileCategory";
import { useIsMobile } from "@/hooks/use-mobile";

interface ModernChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
  onCreateStory?: (childId?: string) => void;
  storiesCountMap?: Record<string, number>;
  totalStories?: number;
  initialCreateMode?: boolean;
  onClearCreateMode?: () => void;
}

const ModernChildrenProfiles: React.FC<ModernChildrenProfilesProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
  storiesCountMap = {},
  totalStories = 0,
  initialCreateMode = false,
  onClearCreateMode
}) => {
  const isMobile = useIsMobile();
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle initial create mode
  React.useEffect(() => {
    if (initialCreateMode && !showModal) {
      handleShowForm();
      // Optional: Clear the param immediately or wait for modal close
      // onClearCreateMode?.(); 
    }
  }, [initialCreateMode]);

  // Form state
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [gender, setGender] = useState<ChildGender>("boy");
  const [petType, setPetType] = useState<PetType | undefined>(undefined);
  const [petTypeCustom, setPetTypeCustom] = useState("");
  const [teddyName, setTeddyName] = useState("");
  const [teddyDescription, setTeddyDescription] = useState("");
  const [imaginaryWorld, setImaginaryWorld] = useState("");
  const [editingChild, setEditingChild] = useState<string | null>(null);
  const [teddyPhotos, setTeddyPhotos] = useState<Child["teddyPhotos"]>([]);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'created'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [ageFilter, setAgeFilter] = useState<'all' | 'toddler' | 'preschool' | 'school'>('all');

  // Nouveaux filtres à deux niveaux
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProfileCategory>('all');
  const [childGenderFilter, setChildGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  // Filter and sort children
  const filteredAndSortedChildren = useMemo(() => {
    let filtered = children.filter(child => {
      // Search filter
      const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.teddyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.imaginaryWorld?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter (primary)
      const category = getProfileCategory(child);
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter;

      // Child gender filter (secondary) - only applies when category is 'child'
      let matchesChildGender = true;
      if (categoryFilter === 'child' && childGenderFilter !== 'all') {
        matchesChildGender = child.gender === childGenderFilter;
      }

      // Age filter
      const age = calculateAge(child.birthDate);
      let matchesAge = true;

      if (ageFilter === 'toddler') matchesAge = age <= 2;
      else if (ageFilter === 'preschool') matchesAge = age >= 3 && age <= 5;
      else if (ageFilter === 'school') matchesAge = age >= 6;

      return matchesSearch && matchesCategory && matchesChildGender && matchesAge;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'age') {
        const ageA = calculateAge(a.birthDate);
        const ageB = calculateAge(b.birthDate);
        comparison = ageA - ageB;
      } else if (sortBy === 'created') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [children, searchTerm, sortBy, sortOrder, ageFilter, categoryFilter, childGenderFilter]);

  const resetForm = () => {
    setChildName("");
    setBirthDate(new Date());
    setGender("boy");
    setPetType(undefined);
    setPetTypeCustom("");
    setTeddyName("");
    setTeddyDescription("");
    setImaginaryWorld("");
    setEditingChild(null);
    setTeddyPhotos([]);
  };

  const handleShowForm = () => {
    resetForm();
    setShowModal(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowModal(false);
    // Cleanup param on close
    if (initialCreateMode) {
      onClearCreateMode?.();
    }
  };

  const handleEdit = (child: Child) => {
    setChildName(child.name);
    setBirthDate(child.birthDate);
    setGender(child.gender);
    setPetType(child.petType);
    setPetTypeCustom(child.petTypeCustom || "");
    setTeddyName(child.teddyName || "");
    setTeddyDescription(child.teddyDescription || "");
    setImaginaryWorld(child.imaginaryWorld || "");
    setEditingChild(child.id);
    setTeddyPhotos(child.teddyPhotos || []);
    setShowModal(true);
  };

  const handleSubmit = async (childData: Child) => {
    setIsSubmitting(true);
    try {
      if (editingChild) {
        await onUpdateChild(editingChild, {
          name: childData.name,
          birthDate: childData.birthDate,
          gender: childData.gender,
          petType: childData.petType,
          petTypeCustom: childData.petTypeCustom,
          teddyName: childData.teddyName,
          teddyDescription: childData.teddyDescription,
          imaginaryWorld: childData.imaginaryWorld,
          teddyPhotos: teddyPhotos,
        });
      } else {
        await onAddChild({
          authorId: childData.authorId,
          name: childData.name,
          birthDate: childData.birthDate,
          gender: childData.gender,
          petType: childData.petType,
          petTypeCustom: childData.petTypeCustom,
          teddyName: childData.teddyName,
          teddyDescription: childData.teddyDescription,
          imaginaryWorld: childData.imaginaryWorld,
          teddyPhotos: teddyPhotos,
        });
      }
      resetForm();
      setShowModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUploaded = (photo: { url: string; path: string; uploadedAt: Date }) => {
    setTeddyPhotos(prev => [...(prev || []), photo]);
  };

  const handlePhotoDeleted = (path: string) => {
    setTeddyPhotos(prev => prev?.filter(photo => photo.path !== path) || []);
  };

  const handleCreateStoryForChild = (childId: string) => {
    onCreateStory?.(childId);
  };

  // Compter par catégorie
  const categoryCounts = useMemo(() => countByCategory(children), [children]);

  return (
    <div className={`${isMobile ? 'space-y-4' : 'space-y-8'}`}>
      {/* Header */}
      <ProfilesHeaderV2
        onShowForm={handleShowForm}
        onCreateStory={onCreateStory}
        childrenCount={categoryCounts.children}
        adultsCount={categoryCounts.adults}
        petsCount={categoryCounts.pets}
        totalStories={totalStories || 0}
      />

      {/* Search and Filters - Only show if there are children */}
      {children.length > 0 && (
        isMobile ? (
          <MobileChildrenFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            ageFilter={ageFilter}
            onAgeFilterChange={setAgeFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            childGenderFilter={childGenderFilter}
            onChildGenderFilterChange={setChildGenderFilter}
          />
        ) : (
          <ChildrenSearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            ageFilter={ageFilter}
            onAgeFilterChange={setAgeFilter}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            childGenderFilter={childGenderFilter}
            onChildGenderFilterChange={setChildGenderFilter}
          />
        )
      )}

      {/* Children Grid */}
      <ChildrenGridLayout
        children={filteredAndSortedChildren}
        onEdit={handleEdit}
        onDelete={onDeleteChild}
        onCreateStory={handleCreateStoryForChild}
        storiesCountMap={storiesCountMap}
      />

      {/* Add/Edit Child Modal */}
      <AddChildModal
        open={showModal}
        onOpenChange={setShowModal}
        childName={childName}
        birthDate={birthDate}
        gender={gender}
        petType={petType}
        petTypeCustom={petTypeCustom}
        teddyName={teddyName}
        teddyDescription={teddyDescription}
        imaginaryWorld={imaginaryWorld}
        editingChild={editingChild}
        childId={editingChild || undefined}
        teddyPhotos={teddyPhotos}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onChildNameChange={setChildName}
        onBirthDateChange={setBirthDate}
        onGenderChange={setGender}
        onPetTypeChange={setPetType}
        onPetTypeCustomChange={setPetTypeCustom}
        onTeddyNameChange={setTeddyName}
        onTeddyDescriptionChange={setTeddyDescription}
        onImaginaryWorldChange={setImaginaryWorld}
        onPhotoUploaded={handlePhotoUploaded}
        onPhotoDeleted={handlePhotoDeleted}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default ModernChildrenProfiles;
