import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Helper function to convert Firestore timestamps to ISO strings
const serializeData = (data: DocumentData) => {
  const serialized: DocumentData = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof Timestamp) {
      serialized[key] = value.toDate().toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      serialized[key] = serializeData(value);
    } else {
      serialized[key] = value;
    }
  });
  
  return serialized;
};

// Helper function to convert document snapshots to plain objects
const convertToPlainObject = (doc: QueryDocumentSnapshot) => {
  return {
    id: doc.id,
    ...serializeData(doc.data())
  };
};

export const addDocument = async (collectionName: string, data: any) => {
  try {
    const serializedData = serializeData(data);
    const docRef = await addDoc(collection(db, collectionName), serializedData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    const serializedData = serializeData(data);
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, serializedData);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(convertToPlainObject);
  } catch (error) {
    console.error("Error getting documents: ", error);
    throw error;
  }
};

export const queryDocuments = async (
  collectionName: string, 
  field: string, 
  operator: any, 
  value: any
) => {
  try {
    const q = query(
      collection(db, collectionName), 
      where(field, operator, value)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(convertToPlainObject);
  } catch (error) {
    console.error("Error querying documents: ", error);
    throw error;
  }
};