/**
 * 🎭 PREVIEW MOCK DATA
 * Données de démonstration pour le mode preview mobile
 */

export const MOCK_USER = {
  id: 'preview-user-id',
  email: 'demo@calmiverse.app',
  user_metadata: {
    firstname: 'Démo',
    lastname: 'Utilisateur'
  }
};

export const MOCK_CHILDREN = [
  {
    id: 'mock-child-1',
    name: 'Emma',
    birthdate: '2018-05-15',
    gender: 'girl',
    interests: ['licornes', 'princesses', 'nature'],
    authorid: MOCK_USER.id
  },
  {
    id: 'mock-child-2',
    name: 'Lucas',
    birthdate: '2020-09-20',
    gender: 'boy',
    interests: ['dinosaures', 'espace', 'aventures'],
    authorid: MOCK_USER.id
  }
];

export const MOCK_STORIES = [
  {
    id: 'mock-story-1',
    title: 'L\'aventure de Emma et la licorne magique',
    preview: 'Emma rencontre une licorne magique qui l\'emmène dans un monde enchanté...',
    status: 'completed',
    authorid: MOCK_USER.id,
    childrennames: ['Emma'],
    createdat: new Date().toISOString()
  },
  {
    id: 'mock-story-2',
    title: 'Lucas explore la galaxie',
    preview: 'Lucas devient astronaute et part explorer les étoiles avec son ami robot...',
    status: 'completed',
    authorid: MOCK_USER.id,
    childrennames: ['Lucas'],
    createdat: new Date().toISOString()
  }
];
