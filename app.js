require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();

const PORT = process.env.PORT || 3000;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Validate API key
if (!OPENWEATHER_API_KEY) {
  console.error('ERROR: OpenWeatherMap API key is missing');
  process.exit(1);
}

// Middleware
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    aqiData: null, 
    error: null,
    defaultLocation: 'New York',
    helpers: {
      getAqiClass: (aqi) => ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy'][aqi - 1] || '',
      getAqiDescription: (aqi) => [
        'Good - Air quality is satisfactory',
        'Moderate - Acceptable quality',
        'Unhealthy for sensitive groups',
        'Unhealthy - Health risks',
        'Very Unhealthy - Health alert'
      ][aqi - 1] || 'Unknown'
    }
  });
});

app.get('/air-quality', async (req, res) => {
  const { location } = req.query;
  
  if (!location) {
    return res.render('index', { 
      aqiData: null, 
      error: 'Please enter a city or county name',
      defaultLocation: '',
      helpers: {
        getAqiClass: () => '',
        getAqiDescription: () => ''
      }
    });
  }

  try {
    // Step 1: Get coordinates from city name
    const geoResponse = await axios.get(
      `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!geoResponse.data || geoResponse.data.length === 0) {
      throw new Error('Location not found');
    }
    
    const { lat, lon } = geoResponse.data[0];
    
    // Step 2: Get air quality data
    const aqiResponse = await axios.get(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (!aqiResponse.data.list || aqiResponse.data.list.length === 0) {
      throw new Error('No air quality data available');
    }
    
    res.render('index', { 
      aqiData: aqiResponse.data.list[0], 
      error: null,
      defaultLocation: location,
      helpers: {
        getAqiClass: (aqi) => ['good', 'moderate', 'unhealthy-sensitive', 'unhealthy', 'very-unhealthy'][aqi - 1] || '',
        getAqiDescription: (aqi) => [
          'Good - Air quality is satisfactory',
          'Moderate - Acceptable quality',
          'Unhealthy for sensitive groups',
          'Unhealthy - Health risks',
          'Very Unhealthy - Health alert'
        ][aqi - 1] || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.render('index', { 
      aqiData: null, 
      error: error.message || 'Failed to fetch data',
      defaultLocation: location,
      helpers: {
        getAqiClass: () => '',
        getAqiDescription: () => ''
      }
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
module.exports = app; 
