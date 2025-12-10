/**
 * Winner Score Calculator
 * Ağırlıklı puanlama sistemi ile 0-100 arası skor üretir
 */

export const calculateWinnerScore = (data) => {
  let score = 0

  // 1. Problem Solving: 20 puan
  if (data.is_problem_solving === true) {
    score += 20
  }

  // 2. Profit Margin >= 3.0: 25 puan (oran * 8.33, max 25)
  if (data.profit_margin && data.profit_margin >= 3.0) {
    const marginScore = Math.min(data.profit_margin * 8.33, 25)
    score += marginScore
  } else if (data.profit_margin && data.profit_margin > 0) {
    // 3x'ten az ise kısmi puan (ör: 2x = 16.66 puan)
    const marginScore = (data.profit_margin / 3.0) * 25
    score += marginScore
  }

  // 3. Lightweight: 10 puan
  if (data.is_lightweight === true) {
    score += 10
  }

  // 4. Evergreen: 15 puan
  if (data.is_evergreen === true) {
    score += 15
  }

  // 5. Golden Ratio <= 2: 20 puan (oran tersine orantılı)
  if (data.engagement_ratio && data.engagement_ratio > 0) {
    if (data.engagement_ratio <= 2) {
      score += 20 // Mükemmel viral
    } else if (data.engagement_ratio <= 3) {
      score += 15 // İyi
    } else if (data.engagement_ratio <= 5) {
      score += 10 // Orta
    } else {
      score += 5 // Zayıf
    }
  }

  // 6. Search Volume >= 30k: 5 puan
  if (data.search_volume && data.search_volume >= 30000) {
    score += 5
  } else if (data.search_volume && data.search_volume >= 10000) {
    score += 2.5 // Kısmi puan
  }

  // 7. Site Traffic >= 300k: 5 puan
  if (data.site_traffic && data.site_traffic >= 300000) {
    score += 5
  } else if (data.site_traffic && data.site_traffic >= 100000) {
    score += 2.5 // Kısmi puan
  }

  // Skor 0-100 arasında sınırla
  return Math.round(Math.min(Math.max(score, 0), 100))
}

export const getScoreStatus = (score) => {
  if (score > 85) return 'WINNER'
  if (score >= 50) return 'Validation'
  return 'Trash'
}

export const getScoreColor = (score) => {
  if (score > 85) return '#10B981' // Yeşil
  if (score >= 50) return '#F59E0B' // Turuncu
  return '#EF4444' // Kırmızı
}

