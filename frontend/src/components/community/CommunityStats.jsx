export default function CommunityStats({ stats }) {
  const statItems = [
    { value: stats.completed, label: 'Completed Tracks' },
    { value: stats.collaborators, label: 'Collaborators' },
    { value: stats.votes, label: 'Community Votes' },
  ];

  return (
    <div className="flex gap-6 flex-wrap p-6 bg-[var(--surface-1)] border border-[var(--border-color)] rounded-2xl mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="flex-1 min-w-[120px] text-center">
          <div className="text-2xl font-bold text-primary-400">{item.value}</div>
          <div className="text-sm text-[var(--text-tertiary)]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}