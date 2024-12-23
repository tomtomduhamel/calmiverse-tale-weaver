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
  DocumentData,
  CollectionReference,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import type { Child } from '@/types/child';

const CHILDREN_COLLECTION = 'children';

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

const safeDate = (timestamp: unknown): Date | null => {
  if (!timestamp || typeof timestamp !== 'object') return null;
  if (timestamp instanceof Timestamp) {
    try {
      return timestamp.toDate();
    } catch {
      return null;
    }
  }
  return null;
};

export const getChildren = async (userId?: string): Promise<Child[]> => {
  try {
    const childrenRef = collection(db, CHILDREN_COLLECTION);
    const queryRef = userId 
      ? query(childrenRef, where("userId", "==", userId))
      : childrenRef;

    const snapshot = await getDocs(queryRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Create a plain serializable object with safe type conversions
      return {
        id: doc.id,
        name: safeString(data.name),
        age: safeNumber(data.age),
        teddyName: safeString(data.teddyName),
        teddyDescription: safeString(data.teddyDescription),
        imaginaryWorld: safeString(data.imaginaryWorld),
        userId: data.userId ? safeString(data.userId) : null,
        createdAt: safeDate(data.createdAt),
        updatedAt: safeDate(data.updatedAt)
      };
    });
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};