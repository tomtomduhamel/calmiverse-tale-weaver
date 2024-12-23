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
  type CollectionReference
} from 'firebase/firestore';
import { db } from './firebase';
import type { Child } from '@/types/child';

const CHILDREN_COLLECTION = 'children';

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
  if ((timestamp as Timestamp)?.toDate instanceof Function) {
    return (timestamp as Timestamp).toDate();
  }
  return null;
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
    const childrenCollection = collection(db, CHILDREN_COLLECTION);
    let querySnapshot;

    if (userId) {
      const q = query(childrenCollection, where("userId", "==", userId));
      querySnapshot = await getDocs(q);
    } else {
      querySnapshot = await getDocs(childrenCollection);
    }

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Create a plain JavaScript object with serializable values
      const child: Child = {
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
      return child;
    });
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};