import { db } from './firebase';
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
  Query
} from 'firebase/firestore';
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

export const getChildren = async (userId?: string): Promise<Child[]> => {
  try {
    const childrenRef = collection(db, CHILDREN_COLLECTION);
    let queryRef: Query<DocumentData> | CollectionReference<DocumentData>;
    
    if (userId) {
      queryRef = query(childrenRef, where("userId", "==", userId));
    } else {
      queryRef = childrenRef;
    }
    
    const querySnapshot = await getDocs(queryRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Create a new plain object with explicit type casting and null checks
      const child: Child = {
        id: doc.id,
        name: data.name || '',
        age: data.age || 0,
        teddyName: data.teddyName || '',
        teddyDescription: data.teddyDescription || '',
        imaginaryWorld: data.imaginaryWorld || '',
        userId: data.userId || null,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null
      };
      return child;
    });
  } catch (error) {
    console.error("Error getting children: ", error);
    throw error;
  }
};