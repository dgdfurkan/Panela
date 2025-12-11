/**
 * Keywords Loader
 * Parses keywords from Ads Library Keywordlar.txt file
 * and loads them into the database
 */

export const parseKeywordsFromFile = async () => {
  try {
    // Try different paths
    const paths = [
      '/weeks/week1/Ads Library Keywordlar.txt',
      '/Panela/weeks/week1/Ads Library Keywordlar.txt',
      './weeks/week1/Ads Library Keywordlar.txt'
    ]
    
    let response = null
    for (const path of paths) {
      try {
        response = await fetch(path)
        if (response.ok) break
      } catch (e) {
        continue
      }
    }
    
    if (!response || !response.ok) {
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

