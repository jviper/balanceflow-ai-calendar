import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTasks } from '../context/TasksContext';

// Static background images per month (using royalty-free, consistent source)
const staticBackgrounds: { [month: number]: string } = {
    0: 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?auto=format&fit=crop&w=1920&q=80', // Jan (Snowy landscape)
    1: 'https://images.unsplash.com/photo-1550269344-9b84a303869a?auto=format&fit=crop&w=1920&q=80', // Feb (Misty morning)
    2: 'https://images.unsplash.com/photo-1489650974259-9a5a45e00b87?auto=format&fit=crop&w=1920&q=80', // Mar (Spring blossoms)
    3: 'https://images.unsplash.com/photo-1587330959863-e3831b3d8894?auto=format&fit=crop&w=1920&q=80', // Apr (Cherry blossoms)
    4: 'https://images.unsplash.com/photo-1525498128493-380d1990a112?auto=format&fit=crop&w=1920&q=80', // May (Green leaves)
    5: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1920&q=80', // Jun (Sunny beach)
    6: 'https://images.unsplash.com/photo-1565882662283-ce5377b0a797?auto=format&fit=crop&w=1920&q=80', // Jul (Vibrant sunset)
    7: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80', // Aug (Lush mountains)
    8: 'https://images.unsplash.com/photo-1506827039434-6c72d476a6f1?auto=format&fit=crop&w=1920&q=80', // Sep (Autumn forest)
    9: 'https://images.unsplash.com/photo-1505672255476-c28f03397f8c?auto=format&fit=crop&w=1920&q=80', // Oct (Foggy road)
    10: 'https://images.unsplash.com/photo-1477814612869-d4d4b353a25b?auto=format&fit=crop&w=1920&q=80', // Nov (Rainy window)
    11: 'https://images.unsplash.com/photo-1512319313493-4a0b63f6831d?auto=format&fit=crop&w=1920&q=80', // Dec (Snowy trees)
};

const Starfield = () => (
    <div className="absolute inset-0 bg-black overflow-hidden">
        <style>{`
            @keyframes star-anim1 { from{transform:translateY(0px)} to{transform:translateY(-2000px)} }
            @keyframes star-anim2 { from{transform:translateY(0px)} to{transform:translateY(-2000px)} }
            @keyframes star-anim3 { from{transform:translateY(0px)} to{transform:translateY(-2000px)} }
            .stars1 { animation: star-anim1 50s linear infinite; background-image: radial-gradient(1px 1px at 25px 5px, white, transparent), radial-gradient(1px 1px at 50px 75px, white, transparent); }
            .stars2 { animation: star-anim2 100s linear infinite; background-image: radial-gradient(1px 1px at 100px 100px, white, transparent), radial-gradient(1px 1px at 125px 25px, white, transparent); }
            .stars3 { animation: star-anim3 150s linear infinite; background-image: radial-gradient(2px 2px at 200px 150px, white, transparent), radial-gradient(2px 2px at 250px 400px, white, transparent); }
        `}</style>
        <div className="stars1 absolute top-0 left-0 right-0 bottom-0 w-full h-[2000px]"></div>
        <div className="stars2 absolute top-0 left-0 right-0 bottom-0 w-full h-[2000px]"></div>
        <div className="stars3 absolute top-0 left-0 right-0 bottom-0 w-full h-[2000px]"></div>
    </div>
);

const Snowfall = () => (
    <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
        <style>{`
            @keyframes fall {
                0% { transform: translateY(-100%) translateX(0); }
                100% { transform: translateY(100vh) translateX(15vw); }
            }
            @keyframes fall-reverse {
                0% { transform: translateY(-100%) translateX(0); }
                100% { transform: translateY(100vh) translateX(-15vw); }
            }
        `}</style>
        {Array.from({ length: 150 }).map((_, i) => (
            <div
                key={i}
                className="absolute bg-white/70 rounded-full"
                style={{
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 4 + 1}px`,
                    height: `${Math.random() * 4 + 1}px`,
                    animation: `${i % 2 === 0 ? 'fall' : 'fall-reverse'} ${Math.random() * 10 + 10}s linear infinite`,
                    animationDelay: `${Math.random() * 10}s`,
                    opacity: Math.random() * 0.7 + 0.2,
                }}
            />
        ))}
    </div>
);


const LiveBackground: React.FC<{ month: number }> = ({ month }) => {
    // Winter
    if ([11, 0, 1].includes(month)) {
        return <Snowfall />;
    }
    // Default to starfield
    return <Starfield />;
};

export const DynamicBackground: React.FC = () => {
    const { backgroundMode } = useSettings();
    const { currentDate } = useTasks();

    if (backgroundMode === 'off') {
        return null;
    }

    const month = currentDate.getMonth();

    return (
        <div className="absolute inset-0 -z-10 transition-all duration-1000">
            {backgroundMode === 'live' ? (
                <LiveBackground month={month} />
            ) : (
                <div
                    className="w-full h-full bg-cover bg-center transition-opacity duration-1000"
                    style={{ backgroundImage: `url(${staticBackgrounds[month]})` }}
                >
                    {/* Overlay for readability */}
                    <div className="w-full h-full bg-black/40"></div>
                </div>
            )}
        </div>
    );
};
