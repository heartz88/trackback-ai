function VisualizerBars({ isPlaying }) {
return (
<div className="flex items-end justify-center gap-1 h-32 mb-8">
    {[...Array(40)].map((_, i) => (
    <div
        key={i}
        className={`w-1 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full ${isPlaying ? 'visualizer-bar' : ''
        }`}
        style={{
        height: isPlaying ? '100%' : `${Math.random() * 30 + 20}%`,
        animationDelay: `${i * 0.05}s`,
        opacity: isPlaying ? 1 : 0.3,
        }}
    />
    ))}
</div>
);
}

export default VisualizerBars;