import React, { useState, useMemo } from "react";
import ProfilesHeaderV2 from "./ProfilesHeaderV2";
import ChildrenSearchBar from "./ChildrenSearchBar";
import ChildrenGridLayout from "./ChildrenGridLayout";
import AddChildModal from "./AddChildModal";
import type { Child, ChildGender } from "@/types/child";
import { calculateAge } from "@/utils/age";

interface ModernChildrenProfilesProps {
  children: Child[];
  onAddChild: (child: Omit<Child, "id">) => Promise<string>;
  onUpdateChild: (childId: string, updatedChild: Partial<Child>) => Promise<void>;
  onDeleteChild: (childId: string) => Promise<void>;
  onCreateStory?: (childId?: string) => void;
  storiesCountMap?: Record<string, number>;
  totalStories?: number;
}

const ModernChildrenProfiles: React.FC<ModernChildrenProfilesProps> = ({
  children,
  onAddChild,
  onUpdateChild,
  onDeleteChild,
  onCreateStory,
  storiesCountMap = {},
  totalStories = 0
}) => {
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [childName, setChildName] = useState("");
  const [birthDate, setBirthDate] = useState(new Date());
  const [gender, setGender] = useState<ChildGender>("boy");
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
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl' | 'pet'>('all');

  // Filter and sort children
  const filteredAndSortedChildren = useMemo(() => {
    let filtered = children.filter(child => {
      // Search filter
      const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           child.teddyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           child.imaginaryWorld?.toLowerCase().includes(searchTerm.toLowerCase());

      // Age filter
      const age = calculateAge(child.birthDate);
      let matchesAge = true;
      
      if (ageFilter === 'toddler') matchesAge = age <= 2;
      else if (ageFilter === 'preschool') matchesAge = age >= 3 && age <= 5;
      else if (ageFilter === 'school') matchesAge = age >= 6;

      // Gender filter
      const matchesGender = genderFilter === 'all' || child.gender === genderFilter;

      return matchesSearch && matchesAge && matchesGender;
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
  }, [children, searchTerm, sortBy, sortOrder, ageFilter, genderFilter]);

  const resetForm = () => {
    setChildName("");
    setBirthDate(new Date());
    setGender("boy");
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
  };

  const handleEdit = (child: Child) => {
    setChildName(child.name);
    setBirthDate(child.birthDate);
    setGender(child.gender);
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
    // Pass the specific child ID to story creation
    onCreateStory?.(childId);
  };

  // Séparer les enfants des animaux de compagnie
  const actualChildren = children.filter(child => child.gender !== 'pet');
  const pets = children.filter(child => child.gender === 'pet');

  return (
    <div className="space-y-8">
      {/* Header */}
        <ProfilesHeaderV2
          onShowForm={handleShowForm}
          onCreateStory={onCreateStory}
          childrenCount={actualChildren.length}
          petsCount={pets.length}
          totalStories={totalStories || 0}
        />

      {/* Search and Filters - Only show if there are children */}
      {children.length > 0 && (
        <ChildrenSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          ageFilter={ageFilter}
          onAgeFilterChange={setAgeFilter}
          genderFilter={genderFilter}
          onGenderFilterChange={setGenderFilter}
        />
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