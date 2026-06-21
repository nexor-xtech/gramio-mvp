import { Client, Account, Databases, Storage, Query, ID, Permission, Role } from 'appwrite';

const client = new Client();

client
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6a2d9b0e000b4f4803f2');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_DATABASE_ID = '6a2d9cf100144aa1e1f6';
export const COLLECTIONS = {
  PROFILES: 'profiles',
  POSTS: 'p',
  FOLLOWS: 'follows',
  LIKES: 'likes',
  COMMENTS: 'comments',
  STORIES: 's',
  MESSAGES: 'messages',
  REELS: 'r',
};
export const BUCKET_ID = '6a2daa710010f39911d6';

export const getConversationId = (userId1, userId2) => {
  return [userId1, userId2].sort().join('_');
};

export { Query, ID, Permission, Role, client };