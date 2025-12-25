const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m&forecast_days=7";

fetch(API_URL)
  .then(response => response.json())
  .then(data => {

    const days = [];          // parent array
    let currentDay = [];      // temp array
    let currentDate = null;   // tracker

    for (let i = 0; i < data.hourly.time.length; i++) {
      const dateTime = data.hourly.time[i];
      const date = dateTime.split('T')[0]; // ✅ DATE, not time

      // If day changes → push old day, start new one
        if (date != currentDate) {
            if (currentDay.length > 0) {
                days.push(currentDay);
            }
            currentDay = []
            currentDate = date;
      }

      // Push hourly data
      currentDay.push({
        time: dateTime,
        temp: data.hourly.temperature_2m[i]
      });
    }

    // Push last day
    if (currentDay.length > 0) {
      days.push(currentDay);
    }
    for (let i = 0; i < days.length; i++) {
      const date = new Date(days[i][0].time);
      console.log(typeof(
        date)
      );
    }




  })
  .catch(error => {
    console.error("Error fetching data:", error);
  });
