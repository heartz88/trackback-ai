export default function ProfileSkills({ skills }) {
return (
<div className="flex flex-wrap gap-2 mb-4">
    {skills.map((skill, i) => (
    <span 
        key={i} 
        className="px-3 py-1 bg-primary-500/10 border border-primary-500/30 rounded-full text-xs text-primary-400 font-medium hover:bg-primary-500/20"
    >
        {skill}
    </span>
    ))}
</div>
);
}