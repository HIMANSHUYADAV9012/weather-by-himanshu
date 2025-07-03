function shareWeather(city, time, sunrise, sunset, temp, condition, advice, country) {
  const text = `
🌤️ *WEATHER REPORT* 🌤️
  
📍 *${city}, ${country}*
  
🕰️ *Time:* ${time}
  
🌅 *Sunrise:* ${sunrise}
🌇 *Sunset:* ${sunset}
  
🌡️ *Temperature:* ${temp}°C
🌈 *Conditions:* ${condition}
  
💡 *HIMANSHU ADVICE:* ${advice}
  
🔍 *More details:* https://hawabaazi.onrender.com
`.trim();

  if (navigator.share) {
    navigator
      .share({
        title: `🌤️ ${city} Weather | ${temp}°C ${condition}`,
        text: text,
      })
      .then(() => console.log("Shared successfully!"))
      .catch((err) => console.error("Sharing failed:", err));
  } else {
    // Fallback for non-share API support
    const shareText = text.replace(/\*/g, ''); // Remove markdown for plain text
    console.log(shareText);
    alert(shareText);
  }
}
