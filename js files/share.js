function shareWeather(city, time, sunrise, sunset, temp, condition, advice, country) {
  const text = `
📍 *Weather Report - ${city}, ${country}*
🕰️ Time: ${time}
🌅 Sunrise: ${sunrise} | 🌇 Sunset: ${sunset}
🌡️ Temp: ${temp}°C | 🌤️ Condition: ${condition}

🗣️ *Himanshu Advice:* ${advice}

🔗 Check more: https://hawabaazi.onrender.com
`.trim();

  if (navigator.share) {
    navigator
      .share({
        title: `Weather in ${city}`,
        text: text,
        // URL is already inside text
      })
      .then(() => console.log("Shared successfully!"))
      .catch((err) => console.error("Sharing failed:", err));
  } else {
    alert("Share not supported on this device. 😕");
  }
}
