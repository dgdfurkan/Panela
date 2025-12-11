/**
 * Keywords Loader
 * Parses keywords from Ads Library Keywordlar.txt file
 * and loads them into the database
 */

export const parseKeywordsFromFile = async () => {
  try {
    // Try public folder first (for production)
    let response = await fetch('/weeks/week1/Ads Library Keywordlar.txt')
    
    // If that fails, try with base path (for development)
    if (!response.ok) {
      response = await fetch('/Panela/weeks/week1/Ads Library Keywordlar.txt')
    }
    
    if (!response.ok) {
      console.warn('Keywords file not found, using empty array')
      return []
    }
    
    const text = await response.text()
    
    // Split by pipe (|) and clean up
    const keywords = text
      .split('|')
      .map(k => k.trim())
      .filter(k => k.length > 0)
      .filter((k, i, arr) => arr.indexOf(k) === i) // Remove duplicates
    
    return keywords
  } catch (error) {
    console.error('Error loading keywords file:', error)
    return []
  }
}

export const ensureKeywordsInDatabase = async (supabase, keywords) => {
  if (!keywords || keywords.length === 0) return
  
  // Check which keywords already exist
  const { data: existing } = await supabase
    .from('research_keywords')
    .select('keyword')
  
  const existingKeywords = new Set(existing?.map(k => k.keyword) || [])
  const newKeywords = keywords.filter(k => !existingKeywords.has(k))
  
  if (newKeywords.length === 0) return
  
  // Insert new keywords
  const { error } = await supabase
    .from('research_keywords')
    .insert(newKeywords.map(keyword => ({ keyword, created_by: null })))
  
  if (error) {
    console.error('Error inserting keywords:', error)
  }
}

