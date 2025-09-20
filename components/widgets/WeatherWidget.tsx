/**
 * WeatherWidget Component
 * 
 * Real-time weather display with location detection
 * Features:
 * - Geolocation-based weather
 * - Animated weather icons
 * - Temperature display
 * - Location detection
 * - Error handling for API failures
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SunIcon, CloudIcon, RainIcon, SnowIcon } from '../Icons';

interface WeatherData {
    temperature: number;
    condition: string;
    location: string;
    loading: boolean;
    error: string | null;
}

const WeatherWidget: React.FC = () => {
    const [weatherData, setWeatherData] = useState<WeatherData>({
        temperature: 0,
        condition: 'sunny',
        location: '',
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                setWeatherData(prev => ({ ...prev, loading: true, error: null }));

                // Get user's location
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        maximumAge: 600000, // 10 minutes
                        timeout: 8000,
                        enableHighAccuracy: false
                    });
                });

                const { latitude, longitude } = position.coords;

                // Fetch weather data
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
                );

                if (!weatherResponse.ok) {
                    throw new Error('Weather API request failed');
                }

                const weatherResult = await weatherResponse.json();
                const weatherCode = weatherResult.current?.weather_code || 0;
                const temperature = weatherResult.current?.temperature_2m || 0;

                // Get location name
                let locationName = 'Unknown Location';
                try {
                    const geoResponse = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    if (geoResponse.ok) {
                        const geoResult = await geoResponse.json();
                        locationName = geoResult.city || geoResult.locality || 'Unknown Location';
                    }
                } catch (geoError) {
                    console.warn('Geocoding failed:', geoError);
                }

                setWeatherData({
                    temperature: Math.round(temperature),
                    condition: getWeatherCondition(weatherCode),
                    location: locationName,
                    loading: false,
                    error: null
                });

            } catch (error) {
                console.error('Weather fetch error:', error);
                setWeatherData(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Unable to fetch weather data'
                }));
            }
        };

        fetchWeather();
    }, []);

    const getWeatherCondition = (code: number): string => {
        if (code === 0) return 'sunny';
        if (code <= 3) return 'partly-cloudy';
        if (code <= 48) return 'cloudy';
        if (code <= 67) return 'rainy';
        if (code <= 77) return 'snowy';
        if (code <= 82) return 'rainy';
        if (code <= 86) return 'snowy';
        return 'sunny';
    };

    const getWeatherIcon = (condition: string) => {
        switch (condition) {
            case 'sunny':
                return <SunIcon className="w-8 h-8 text-yellow-400" />;
            case 'partly-cloudy':
            case 'cloudy':
                return <CloudIcon className="w-8 h-8 text-gray-400" />;
            case 'rainy':
                return <RainIcon className="w-8 h-8 text-blue-400" />;
            case 'snowy':
                return <SnowIcon className="w-8 h-8 text-blue-200" />;
            default:
                return <SunIcon className="w-8 h-8 text-yellow-400" />;
        }
    };

    const getWeatherDescription = (condition: string): string => {
        switch (condition) {
            case 'sunny': return 'Sunny';
            case 'partly-cloudy': return 'Partly Cloudy';
            case 'cloudy': return 'Cloudy';
            case 'rainy': return 'Rainy';
            case 'snowy': return 'Snowy';
            default: return 'Unknown';
        }
    };

    if (weatherData.loading) {
        return (
            <motion.div
                className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <motion.div
                    className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <div>
                    <div className="text-white text-lg font-semibold">Loading...</div>
                    <div className="text-gray-400 text-sm">Weather data</div>
                </div>
            </motion.div>
        );
    }

    if (weatherData.error) {
        return (
            <motion.div
                className="flex items-center gap-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <span className="text-red-400 text-lg">⚠️</span>
                </div>
                <div>
                    <div className="text-white text-sm font-medium">Weather Unavailable</div>
                    <div className="text-gray-400 text-xs">Check connection</div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
        >
            <motion.div
                animate={{ 
                    rotate: weatherData.condition === 'sunny' ? [0, 5, -5, 0] : 0,
                    scale: [1, 1.1, 1]
                }}
                transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: 'easeInOut' 
                }}
            >
                {getWeatherIcon(weatherData.condition)}
            </motion.div>
            
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <div className="text-white text-2xl font-bold">
                        {weatherData.temperature}°C
                    </div>
                    <div className="text-gray-400 text-sm">
                        {getWeatherDescription(weatherData.condition)}
                    </div>
                </div>
                <div className="text-gray-400 text-sm">
                    {weatherData.location}
                </div>
            </div>
        </motion.div>
    );
};

export default WeatherWidget;
