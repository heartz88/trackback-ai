import { useState } from 'react';

function FeatureShowcase() {
const [activeFeature, setActiveFeature] = useState(0);

const features = [
{
    icon: "🎵",
    title: "BPM Detection",
    description: "Accurate tempo analysis with 98% precision",
    detail: "Our AI analyzes your track's rhythm and identifies the exact BPM in seconds. Works with any genre from ambient to drum & bass.",
    demo: (
    <div className="flex items-center justify-center gap-2 p-8">
        <div className="text-6xl font-bold text-primary-500 animate-bpm">128</div>
        <div className="text-2xl text-gray-400">BPM</div>
        <div className="flex gap-1 ml-4">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="w-2 bg-primary-500 rounded-full visualizer-bar" style={{ height: '60px' }} />
        ))}
        </div>
    </div>
    ),
    color: "from-primary-600 to-primary-400"
},
{
    icon: "⚡",
    title: "Energy Levels",
    description: "Classify tracks by intensity and vibe",
    detail: "Automatically categorize your music into Low, Medium, or High energy to match with the right collaborators.",
    demo: (
    <div className="flex justify-center gap-4 p-8">
        <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-2 energy-low">
            <span className="text-2xl">🌙</span>
        </div>
        <div className="text-xs text-gray-400">Low</div>
        </div>
        <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-2 energy-medium animate-pulse">
            <span className="text-2xl">🔥</span>
        </div>
        <div className="text-xs text-gray-400">Medium</div>
        </div>
        <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-2 energy-high animate-bounce-slow">
            <span className="text-2xl">⚡</span>
        </div>
        <div className="text-xs text-gray-400">High</div>
        </div>
    </div>
    ),
    color: "from-yellow-600 to-orange-400"
},
{
    icon: "🎹",
    title: "Key Detection",
    description: "Identify musical key for perfect harmony",
    detail: "Detect the musical key of your track to find collaborators working in compatible keys.",
    demo: (
    <div className="flex justify-center items-center p-8">
        <div className="relative">
        <div className="text-7xl font-bold text-transparent bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text">
            C♯
        </div>
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-primary-500/20 border border-primary-500/50 rounded-full text-xs text-primary-300">
            Minor
        </div>
        <div className="flex gap-1 mt-4 justify-center">
            {['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((note, i) => (
            <div
                key={note}
                className={`w-8 h-12 ${i === 0 ? 'bg-primary-500' : 'bg-gray-700'} rounded-sm border border-gray-600`}
            />
            ))}
        </div>
        </div>
    </div>
    ),
    color: "from-primary-600 to-primary-400"
},
{
    icon: "🤝",
    title: "Smart Matching",
    description: "Find collaborators who complement your style",
    detail: "Our algorithm matches you with producers based on musical compatibility, skills, and availability.",
    demo: (
    <div className="flex justify-center items-center p-8 gap-6">
        <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
            You
        </div>
        <div className="text-xs text-gray-400">128 BPM</div>
        <div className="text-xs text-gray-400">High Energy</div>
        </div>
        <div className="flex flex-col gap-2">
        <div className="w-8 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse"></div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-8 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2 animate-pulse">
            DJ
        </div>
        <div className="text-xs text-green-400">✓ 98% Match</div>
        <div className="text-xs text-gray-400">Perfect Fit!</div>
        </div>
    </div>
    ),
    color: "from-green-600 to-teal-400"
}
];

return (
<div className="max-w-6xl mx-auto">
    {/* Tab Navigation */}
    <div className="flex flex-wrap justify-center gap-3 mb-8">
    {features.map((feature, index) => (
        <button
        key={index}
        onClick={() => setActiveFeature(index)}
        className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeFeature === index
            ? `bg-gradient-to-r ${feature.color} text-white shadow-lg scale-105`
            : 'bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
            }`}
        >
        <span className="mr-2">{feature.icon}</span>
        {feature.title}
        </button>
    ))}
    </div>

    {/* Active Feature Display */}
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden">
    <div className="grid md:grid-cols-2 gap-0">
        {/* Left: Description */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
        <div className="text-6xl mb-4 animate-bounce-slow">{features[activeFeature].icon}</div>
        <h3 className="text-3xl font-bold text-white mb-4">
            {features[activeFeature].title}
        </h3>
        <p className="text-gray-400 text-lg mb-4">
            {features[activeFeature].description}
        </p>
        <p className="text-gray-300">
            {features[activeFeature].detail}
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-primary-400 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Powered by Librosa AI</span>
        </div>
        </div>

        {/* Right: Interactive Demo */}
        <div className="bg-gradient-to-br from-gray-950 to-gray-900 border-l border-gray-800 flex items-center justify-center min-h-[300px]">
        <div className="animate-fade-in">
            {features[activeFeature].demo}
        </div>
        </div>
    </div>
    </div>
</div>
);
}

export default FeatureShowcase;