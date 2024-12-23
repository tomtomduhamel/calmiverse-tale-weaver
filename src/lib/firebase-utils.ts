import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where,
  serverTimestamp,
  type Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Child } from '@/types/child';

const CHILDREN_COLLECTION = 'children';

// Helper functions for safe type conversion
const safeString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

const serializeTimestamp = (timestamp: unknown): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch {
      return null;
    }
  }
  return null;
};

// Convert Firestore document to plain object
const convertToPlainObject = (doc: DocumentData): Child => {
  const data = doc.data();
  return {
    id: doc.id,
    name: safeString(data.name),
    age: safeNumber(data.age),
    teddyName: safeString(data.teddyName),
    teddyDescription: safeString(data.teddyDescription),
    imaginaryWorld: safeString(data.imaginaryWorld),
    userId: data.userId ? safeString(data.userId) : undefined,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt)
  };
};

export const addChild = async (childData: Omit<Child, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, CHILDREN_COLLECTION), {
      ...childData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding child: ", error);
    throw error;
  }
};

export const updateChild = async (childId: string, data: Partial<Omit<Child, 'id'>>) => {
  try {
    const docRef = doc(db, CHILDREN_COLLECTION, childId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating child: ", error);
    throw error;
  }
};

export const deleteChild = async (childId: string) => {
  try {
    const docRef = doc(db, CHILDREN_COLLECTION, childId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting child: ", error);
    throw error;
  }
};

export const getChildren = async (userId?: string): Promise<Child[]> => {
  try {
    const childrenRef = collection(db, CHILDREN_COLLECTION);
    let querySnapshot;

    if (userId) {
      // Create a new query for filtered results
      const userQuery = query(childrenRef, where("userId", "==", userId));
      querySnapshot = await getDocs(userQuery);
    } else {
      // Get all documents without filtering
      querySnapshot = await getDocs(childrenRef);
    }

    // Convert documents to plain JavaScript objects
    return querySnapshot.docs.map(doc => convertToPlainObject(doc));
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};