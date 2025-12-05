export function generatePriceHistory(basePrice, days = 30) {
  const history = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  let currentPrice = basePrice;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const random = Math.random();
    let volatility;
    
    if (random < 0.6) {
      volatility = 0.005;
    } else if (random < 0.9) {
      volatility = 0.015;
    } else {
      volatility = 0.03;
    }
    
    const trend = Math.random() > 0.45 ? 1 : -1;
    const change = currentPrice * volatility * Math.random() * trend;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.7);
    
    const baseVolume = Math.floor(Math.random() * 100) + 20;
    const volumeSpike = Math.random() > 0.9 ? Math.random() * 200 : 0;
    
    history.push({
      date: date,
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(baseVolume + volumeSpike)
    });
  }
  
  return history;
}

export function updatePriceHistory(existingHistory, newPrice, volume = 0) {
  const history = [...existingHistory];
  
  history.push({
    date: new Date(),
    price: Math.round(newPrice * 100) / 100,
    volume
  });
  
  if (history.length > 90) {
    return history.slice(-90);
  }
  
  return history;
}
