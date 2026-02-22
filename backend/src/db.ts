// Database connection is now handled via Supabase REST API in userModel.ts
// This file is kept for backwards compatibility but not actively used

export const query = async () => {
  throw new Error('Direct queries deprecated - use userModel.ts instead');
};
