export default function ProfileBanner() {
return (
<div className="relative h-48 bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 overflow-hidden">
    <div className="absolute inset-0 opacity-10">
    <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path 
        d="M0,100 Q150,50 300,100 T600,100 T900,100 T1200,100" 
        stroke="white" 
        fill="none" 
        strokeWidth="2" 
        />
    </svg>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
    
    {/* Audio wave decoration */}
    <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20">
    <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 50">
        <path 
        d="M0,25 Q150,10 300,25 T600,25 T900,25 T1200,25" 
        stroke="white" 
        fill="none" 
        strokeWidth="1" 
        />
    </svg>
    </div>
</div>
);
}