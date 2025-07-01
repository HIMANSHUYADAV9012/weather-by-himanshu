// Function to check if it's day or night based on sunrise/sunset times
function isDayTime(currentTime, sunrise, sunset) {
    const timeToMinutes = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    };

    const [datePart, timePart] = currentTime.split(' ');
    const [currentHours, currentMinutes] = timePart.split(':').map(Number);
    const currentTotal = currentHours * 60 + currentMinutes;

    const sunriseTotal = timeToMinutes(sunrise);
    const sunsetTotal = timeToMinutes(sunset);

    return currentTotal >= sunriseTotal && currentTotal < sunsetTotal;
}

// Get theme based on weather condition
function getThemeFromCondition(condition) {
    condition = condition.toLowerCase();
    
    if (condition.includes("rain") || condition.includes("drizzle")) {
        return "theme-rainy";
    } 
    else if (condition.includes("sun") || condition.includes("clear")) {
        return "theme-sunny";
    }
    else if (condition.includes("cloud")) {
        return "theme-cloudy";
    }
    else if (condition.includes("snow") || condition.includes("ice")) {
        return "theme-snowy";
    }
    else if (condition.includes("thunder") || condition.includes("storm")) {
        return "theme-thunder";
    }
    else {
        return "theme-default";
    }
}

// Get random activity suggestion with proper error handling
function getRandomActivity(condition, isDay) {
    try {
        // Ensure weatherActivities is loaded
        if (Object.keys(weatherActivities).length === 0) {
            console.warn('Weather activities not loaded yet, using default');
            return isDay ? "Enjoy your day!" : "Have a good night!";
        }

        let type;
        condition = condition.toLowerCase();
        
        if (condition.includes("sun") || condition.includes("clear")) {
            type = "sunny";
        } else if (condition.includes("rain") || condition.includes("drizzle")) {
            type = "rainy";
        } else if (condition.includes("cloud")) {
            type = "cloudy";
        } else if (condition.includes("cold") || condition.includes("snow") || condition.includes("ice")) {
            type = "cold";
        } else {
            type = "default";
        }

        const timeOfDay = isDay ? "day" : "night";
        const activities = weatherActivities[type]?.[timeOfDay] || 
                         weatherActivities.default?.[timeOfDay] || 
                         [isDay ? "Enjoy your day!" : "Have a good night!"];

        const activity = activities[Math.floor(Math.random() * activities.length)];
        return activity.replace(/[""]/g, '');
    } catch (error) {
        console.error('Error getting activity:', error);
        return isDay ? "Enjoy your day!" : "Have a good night!";
    }
}