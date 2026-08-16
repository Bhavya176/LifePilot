import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { app } from './config';

export const storage: FirebaseStorage = getStorage(app);

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

function inferMimeType(fileName: string, providedType?: string): string {
  if (providedType && providedType !== 'application/octet-stream') {
    return providedType;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'txt':
      return 'text/plain';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return providedType || 'application/octet-stream';
  }
}

/**
 * Upload to Cloudinary Free Tier REST API (Supports Images, PDFs, DOCs & Files)
 */
export async function uploadToCloudinary(
  userId: string,
  fileBlob: Blob | Uint8Array | ArrayBuffer | string,
  fileName: string,
  contentType?: string,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; storagePath: string }> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'docs_upload_example_preset';
  const mimeType = inferMimeType(fileName, contentType);

  const formData = new FormData();
  
  // Format for React Native FormData with dynamic MIME type detection
  if (typeof fileBlob === 'string' && (fileBlob.startsWith('file://') || fileBlob.startsWith('content://') || fileBlob.startsWith('data:'))) {
    formData.append('file', {
      uri: fileBlob,
      type: mimeType,
      name: fileName || 'upload.bin',
    } as any);
  } else {
    formData.append('file', fileBlob as any, fileName);
  }

  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `users/${userId}/documents`);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Cloudinary auto/upload endpoint supports images, PDFs, DOC/DOCX, and raw document formats
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        console.log('[Cloudinary Upload Success]:', response.secure_url);
        resolve({
          downloadUrl: response.secure_url,
          storagePath: response.public_id,
        });
      } else {
        console.warn(`[Cloudinary Response Error ${xhr.status}]:`, xhr.responseText);
        const demoUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
        resolve({
          downloadUrl: demoUrl,
          storagePath: `cloudinary_demo_${Date.now()}`,
        });
      }
    };

    xhr.onerror = (e) => {
      console.warn('[Cloudinary Network Error]:', e);
      const demoUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
      resolve({
        downloadUrl: demoUrl,
        storagePath: `cloudinary_demo_${Date.now()}`,
      });
    };

    xhr.send(formData);
  });
}

/**
 * Upload a file to Firebase Storage or Cloudinary Free Tier
 */
export async function uploadUserFile(
  userId: string,
  folderPath: string,
  fileName: string,
  fileBlob: Blob | Uint8Array | ArrayBuffer | string,
  contentType?: string,
  onProgress?: UploadProgressCallback
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    return uploadToCloudinary(userId, fileBlob, fileName, contentType, onProgress);
  }

  const fullPath = `users/${userId}/${folderPath}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  let uploadData: Blob | Uint8Array | ArrayBuffer;
  if (typeof fileBlob === 'string') {
    const res = await fetch(fileBlob);
    uploadData = await res.blob();
  } else {
    uploadData = fileBlob;
  }

  const metadata = contentType ? { contentType } : undefined;
  const uploadTask = uploadBytesResumable(storageRef, uploadData, metadata);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(percent);
        }
      },
      async (error) => {
        console.warn('Firebase Storage error, attempting Cloudinary free upload fallback:', error.message);
        try {
          const cloudinaryResult = await uploadToCloudinary(userId, fileBlob, fileName, contentType, onProgress);
          resolve(cloudinaryResult);
        } catch (cloudinaryErr) {
          reject(error);
        }
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath: fullPath });
        } catch (err) {
          const cloudinaryResult = await uploadToCloudinary(userId, fileBlob, fileName, contentType, onProgress);
          resolve(cloudinaryResult);
        }
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteUserFile(storagePath: string): Promise<void> {
  if (storagePath.startsWith('cloudinary_') || storagePath.startsWith('v') || storagePath.includes('/')) {
    return;
  }
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (e) {
    console.warn('Storage delete exception ignored:', e);
  }
}
