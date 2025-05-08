'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import cities from './cities.json';

interface WeatherData {
    weather: { icon: string; main: string }[];
    main: { temp: number; temp_max: number; temp_min: number; humidity: number; pressure: number };
    wind: {
        deg: number; speed: number
    };
    visibility: number;
    name: string;
}

interface ForecastItem {
    dt: number;
    weather: { icon: string; description: string }[];
    main: { temp_max: number; temp_min: number };
}

interface ForecastResponse {
    list: ForecastItem[];
}

interface City {
    name: string;
    country: string;
}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ImageWithFallback = ({ src, fallbackSrc, alt, ...props }: { src: string; fallbackSrc: string; alt: string } & React.ComponentProps<typeof Image>) => {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <Image
            {...props}
            src={imgSrc}
            alt={alt}
            onError={() => {
                if (imgSrc !== fallbackSrc) {
                    setImgSrc(fallbackSrc);
                }
            }}
        />
    );
};

export default function Home() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [forecast, setForecast] = useState<ForecastItem[]>([]);
    const [city, setCity] = useState('Lima');
    const [query, setQuery] = useState('');
    const [isCelsius, setIsCelsius] = useState(true);
    const [showSearch, setShowSearch] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const apiKey = '672e8ac55f4f7af857a3819c24fd52e6';

    const fetchWeather = useCallback(async () => {
        try {
            const unit = isCelsius ? 'metric' : 'imperial';
            const [currentRes, forecastRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=${unit}`),
            ]);

            if (!currentRes.ok || !forecastRes.ok) throw new Error('City not found');

            const currentData: WeatherData = await currentRes.json();
            const forecastData: ForecastResponse = await forecastRes.json();
            const filteredForecast = forecastData.list.filter((_, idx) => idx % 8 === 0);

            setWeather(currentData);
            setForecast(filteredForecast);
            setErrorMsg('');
        } catch (error) {
            console.error('Error fetching data:', error);
            setWeather(null);
            setForecast([]);
            setErrorMsg('City not found. Please try again.');
        }
    }, [city, isCelsius, apiKey]);

    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    const handleSearch = () => {
        if (query.trim()) {
            setCity(query.trim());
            setQuery('');
            setShowSearch(false);
        }
    };

    const handleLocation = async () => {
        try {
            if (!navigator.geolocation) {
                alert('Geolocation is not supported by your browser');
                return;
            }
    
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Coords:', latitude, longitude);
    
                    const res = await fetch(
                        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
                    );
    
                    if (!res.ok) throw new Error('Failed to fetch location data');
                    const data = await res.json();
                    console.log('Weather data:', data);
    
                    if (data.name) {
                        setCity(data.name);
                        setShowSearch(false);
                    } else {
                        console.error('City not found in weather data');
                    }
                },
                (error) => {
                    console.error('Error fetching geolocation:', error);
                    alert('Unable to fetch location. Please ensure location permissions are enabled.');
                }
            );
        } catch (error) {
            console.error('Error fetching location:', error);
            alert('Unable to fetch location. Please try again later.');
        }
    };
    

    const unitSymbol = isCelsius ? '°C' : '°F';

    return (
        <main className={`flex flex-col md:flex-row min-h-screen ${isCelsius ? 'bg-[#ffffff] text-white' : 'bg-[#100E1D] text-white'} font-sans relative`}>
            {/* Sidebar */}
            <button
            onClick={() => setIsCelsius(!isCelsius)}
            className="fixed bottom-4 right-4 bg-gray-600 text-white p-3 rounded-full shadow-lg"
            style={{
                backgroundColor: isCelsius ? 'white' : 'black',
                color: isCelsius ? 'black' : 'white',
            }}
            >
            Toggle Theme
            </button>
            <aside className="bg-[#1E213A] p-10 relative flex flex-col justify-center items-center z-10 md:min-w-[380px] md:w-[30%]">

            {/* Background image */}
            <div
                className="absolute inset-0 opacity-20 bg-no-repeat bg-center"
                style={{ backgroundImage: "url('/others/cloud-background.png')" }}
            ></div>
            <div className="w-full flex justify-center gap-36 items-center absolute top-8 z-10">
                <button onClick={() => setShowSearch(true)} className="bg-gray-600 px-4 py-2 rounded">Search for Places</button>
                <button onClick={handleLocation} className="bg-gray-700 p-2 rounded-full">
                <Image src="/icons/location.svg" alt="Locate" width={24} height={24} />
                </button>
            </div>

            {weather ? (
                <div className="text-center">
                <Image src={`/images/${weather.weather[0].icon}.png`} alt="Weather icon" width={150} height={150} />
                <div className="text-6xl mt-6 font-light">{Math.round(weather.main.temp)}{unitSymbol}</div>
                <div className="text-xl text-gray-400 mt-2">{weather.weather[0].main}</div>
                <div className="text-sm text-gray-400 mt-8">
                    Today • {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                <div className="flex justify-center gap-2 items-center mt-1">
                    <Image src="/icons/location_on.svg" alt="Location" width={16} height={16} />
                    <span className="text-lg font-semibold">{weather.name}</span>
                </div>
                </div>
            ) : (
                <div className="text-center text-red-400 text-lg">{errorMsg}</div>
            )}
            </aside>

            {/* Main Content */}
            <section className="flex-1 p-8">
            {/* °C / °F Switch */}
            <div className="flex justify-end gap-2 mb-6">
                <button
                onClick={() => setIsCelsius(true)}
                className={`p-2 w-10 h-10 rounded-full font-bold ${isCelsius ? 'bg-[#E7E7EB] text-[#110E3C]' : 'bg-[#585676] text-white'
                    }`}
                >
                °C
                </button>
                <button
                onClick={() => setIsCelsius(false)}
                className={`p-2 w-10 h-10 rounded-full font-bold ${!isCelsius ? 'bg-[#E7E7EB] text-[#110E3C]' : 'bg-[#585676] text-white'
                    }`}
                >
                °F
                </button>
            </div>

            {/* Extended Forecast Cards */}
            {forecast.length > 0 && (
                <div className="overflow-x-auto flex gap-3 pb-3 justify-center">
                    {forecast.map((item, idx) => (
                        <div
                            key={idx}
                            className="min-w-[120px] bg-[#1E213A] rounded p-4 text-center flex flex-col items-center justify-between"
                        >
                            <p className="text-sm">
                                {idx === 0
                                    ? 'Tomorrow'
                                    : new Date(item.dt * 1000).toLocaleDateString('en-GB', {
                                          weekday: 'short',
                                          day: 'numeric',
                                          month: 'short',
                                      })}
                            </p>
                            <Image
                                src={`/images/${item.weather[0].icon}.png`}
                                alt={item.weather[0].description}
                                width={56}
                                height={62}
                                className="my-2"
                            />
                            <div className="text-sm font-medium">
                                {Math.round(item.main.temp_max)}
                                {unitSymbol} / {Math.round(item.main.temp_min)}
                                {unitSymbol}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Extended Forecast Slider */}
            {forecast.length > 7 && (
                <div className="overflow-x-scroll flex gap-3 pb-3 justify-start scrollbar-hide">
                    {forecast.slice(7).map((item, idx) => (
                        <div
                            key={idx}
                            className="min-w-[120px] bg-[#1E213A] rounded p-4 text-center flex flex-col items-center justify-between"
                        >
                            <p className="text-sm">
                                {new Date(item.dt * 1000).toLocaleDateString('en-GB', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </p>
                            <Image
                                src={`/images/${item.weather[0].icon}.png`}
                                alt={item.weather[0].description}
                                width={56}
                                height={62}
                                className="my-2"
                            />
                            <div className="text-sm font-medium">
                                {Math.round(item.main.temp_max)}
                                {unitSymbol} / {Math.round(item.main.temp_min)}
                                {unitSymbol}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        

            {weather && (
                <>
                <h2 className={`text-2xl font-semibold mb-6  text-center ${isCelsius ? 'text-[#0b0b12]' : 'text-white'}`}>Today&#39;s Highlights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto px-4">
                    {/* Wind Status */}
                    <div className="w-full max-w-[328px] h-48 bg-[#1E213A] flex flex-col items-center justify-center rounded">
                    <h2 className="text-base text-center text-[#E7E7EB]">Wind status</h2>
                    <div className="flex items-end h-20 mb-4">
                        <h3 className="text-[#E7E7EB] text-6xl font-bold">{weather.wind.speed.toFixed(2)}</h3>
                        <h4 className="text-[#E7E7EB] text-4xl mb-2 ml-1">m/s</h4>
                    </div>
                    <div className="flex items-center text-[#E7E7EB] text-sm">
                        <span className="flex justify-center items-center w-8 h-8 m-3 rounded-full bg-[#ffffff4d]">
                        <Image
                            src="/icons/navigation.svg"
                            alt="Wind direction"
                            width={18}
                            height={18}
                            style={{ transform: `rotate(${weather.wind.deg}deg)` }} />
                        </span>
                        {(() => {
                        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                        const index = Math.round(weather.wind.deg / 45) % 8;
                        return directions[index];
                        })()}
                    </div>
                    </div>

                    {/* Humidity */}
                    <div className="w-full max-w-[328px] h-48 bg-[#1E213A] flex flex-col items-center justify-center rounded">
                    <h2 className="text-base text-center text-[#E7E7EB]">Humidity</h2>
                    <div className="flex items-end h-20 mb-4">
                        <h3 className="text-[#E7E7EB] text-6xl font-bold">{weather.main.humidity}</h3>
                        <h4 className="text-[#E7E7EB] text-4xl mb-2 ml-1 text-right">%</h4>
                    </div>
                    <div className="w-[70%] font-bold text-xs flex justify-between text-[#A09FB1]">
                        <p>0</p><p>50</p><p>100</p>
                    </div>
                    <div className="flex items-center w-[70%] h-2 bg-[#E7E7EB] rounded-3xl">
                        <div className="h-2 bg-[#FFEC65] rounded-3xl" style={{ width: `${weather.main.humidity}%` }}></div>
                    </div>
                    <div className="w-[70%] text-right font-bold text-[#A09FB1]">%</div>
                    </div>

                    {/* Visibility */}
                    <div className="w-full max-w-[328px] h-48 bg-[#1E213A] flex flex-col items-center justify-center rounded">
                    <h2 className="text-base text-center text-[#E7E7EB]">Visibility</h2>
                    <div className="flex items-end h-20 mb-4">
                        <h3 className="text-[#E7E7EB] text-6xl font-bold">{(weather.visibility / 1000).toFixed(2)}</h3>
                        <h4 className="text-[#E7E7EB] text-4xl mb-2 ml-1">km</h4>
                    </div>
                    </div>

                    {/* Air Pressure */}
                    <div className="w-full max-w-[328px] h-48 bg-[#1E213A] flex flex-col items-center justify-center rounded">
                    <h2 className="text-base text-center text-[#E7E7EB]">Air Pressure</h2>
                    <div className="flex items-end h-20 mb-4">
                        <h3 className="text-[#E7E7EB] text-6xl font-bold">{weather.main.pressure}</h3>
                        <h4 className="text-[#E7E7EB] text-4xl mb-2 ml-1">mb</h4>
                    </div>
                    </div>
                </div>
                </>
            )}

            <footer className="text-center mt-16 text-gray-500 text-sm">
                Created by <strong>AndreaOmiza</strong> - devChallenges.io
            </footer>
            </section>

            {/* Search Panel */}
            {showSearch && (
            <div className="fixed top-0 left-0 w-full md:w-[510px] bg-[#1E213A] h-full z-50 p-6">
                <div className="flex justify-between items-center">
                <div className="flex items-center bg-gray-800 border border-gray-500 px-3 py-2 w-3/4">
                    <Image src="/icons/search.svg" alt="Search Icon" width={20} height={20} className="mr-2" />
                    <input
                    type="text"
                    placeholder="Search location"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="bg-transparent text-white w-full outline-none"
                    />
                </div>
                <button onClick={handleSearch} className="bg-blue-600 px-4 py-2 text-white rounded ml-2">Search</button>
                <button onClick={() => setShowSearch(false)} className="ml-2">
                    <Image src="/icons/close.svg" alt="Close" width={24} height={24} />
                </button>
                </div>

                <div className="mt-6 space-y-3">
                {(cities as City[]).filter((item) => item.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10).map((item, idx) => (
                    <div
                    key={idx}
                    className="text-white cursor-pointer hover:bg-gray-700 p-2 rounded"
                    onClick={() => {
                        setCity(item.name);
                        setShowSearch(false);
                    }}
                    >
                    {item.name}, {item.country}
                    </div>
                ))}
                </div>
            </div>
            )}
        </main>
    );
}

