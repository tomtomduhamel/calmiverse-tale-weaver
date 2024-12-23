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

// Test function to verify Firestore connection
export const testFirestoreConnection = async () => {
  try {
    // Try to create a test collection and document
    const testData = {
      test: true,
      timestamp: new Date()
    };
    
    console.log('Testing Firestore connection...');
    const docRef = await addDoc(collection(db, 'test_collection'), testData);
    console.log('Test document written with ID:', docRef.id);
    
    // Immediately delete the test document
    await deleteDoc(docRef);
    console.log('Test document successfully deleted');
    
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    throw error;
  }
};

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
    console.log(`Attempting to add document to ${collectionName}:`, data);
    const docRef = await addDoc(collection(db, collectionName), data);
    console.log(`Document written with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    console.log(`Attempting to update document ${docId} in ${collectionName}:`, data);
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, data);
    console.log(`Document ${docId} successfully updated`);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    console.log(`Attempting to delete document ${docId} from ${collectionName}`);
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`Document ${docId} successfully deleted`);
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

export const getDocuments = async (collectionName: string) => {
  try {
    console.log(`Fetching all documents from ${collectionName}`);
    const querySnapshot = await getDocs(collection(db, collectionName));
    const documents = querySnapshot.docs.map(convertToPlainObject);
    console.log(`Retrieved ${documents.length} documents:`, documents);
    return documents;
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
    console.log(`Querying ${collectionName} where ${field} ${operator} ${value}`);
    const q = query(
      collection(db, collectionName), 
      where(field, operator, value)
    );
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(convertToPlainObject);
    console.log(`Query returned ${documents.length} documents:`, documents);
    return documents;
  } catch (error) {
    console.error("Error querying documents: ", error);
    throw error;
  }
};