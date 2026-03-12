import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CommunityStats from '../components/community/CommunityStats';
import CommunityTabs from '../components/community/CommunityTabs';
import CompletedTrackCard from '../components/community/CompletedTrackCard';
import EmptyCommunityState from '../components/community/EmptyCommunityState';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

function CommunityPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ completed: 0, collaborators: 0, votes: 0 });
  const { on } = useSocket();

  useEffect(() => {
    fetchCommunityData();
  }, [activeTab]);

  useEffect(() => {
    const unsub = on('track:completed', () => {
      if (activeTab === 0 || activeTab === 1) fetchCommunityData();
      setStats(prev => ({ ...prev, completed: prev.completed + 1 }));
    });
    return unsub;
  }, [on, activeTab]);

  const fetchCommunityData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const sortMap = ['featured', 'recent', 'votes'];
      const res = await api.get('/tracks/completed?sort=' + sortMap[activeTab] + '&limit=20');
      const completedTracks = res.data.tracks || [];

      const enriched = await Promise.all(
        completedTracks.map(async (track) => {
          try {
            const subRes = await api.get('/submissions/track/' + track.id);
            const subs = subRes.data.submissions || [];
            const winner = subs.length > 0
              ? subs.reduce((best, s) => (parseInt(s.upvotes) || 0) > (parseInt(best.upvotes) || 0) ? s : best)
              : null;
            return {
              ...track,
              winning_submission: winner ? { ...winner, upvotes: parseInt(winner.upvotes) || 0 } : null,
              submissions_count: subs.length,
            };
          } catch {
            return { ...track, winning_submission: null, submissions_count: 0 };
          }
        })
      );

      setTracks(enriched);

      if (activeTab === 0) {
        try {
          const statsRes = await api.get('/tracks/stats/community');
          setStats(statsRes.data.stats || { completed: enriched.length, collaborators: 0, votes: 0 });
        } catch {
          const totalVotes = enriched.reduce((acc, t) => acc + (parseInt(t.winning_submission?.upvotes) || 0), 0);
          setStats({ completed: enriched.length, collaborators: enriched.length, votes: totalVotes });
        }
      }
    } catch (err) {
      console.error('Community fetch error:', err);
      setError('Failed to load community tracks');
    } finally {
      setIsLoading(false);
    }
  };

  const TABS = ['Featured', 'Recently Completed', 'Most Voted'];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="music-loader">
          {[...Array(5)].map((_, i) => <div key={i} className="music-loader-bar" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchCommunityData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          🏆 Community Showcase
        </h1>
        <p className="text-[var(--text-secondary)]">
          Tracks that started as unfinished loops — completed by the community.
        </p>
      </div>

      {/* Stats */}
      <CommunityStats stats={stats} />

      {/* Tabs */}
      <CommunityTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tracks */}
      {tracks.length === 0 ? (
        <EmptyCommunityState tab={TABS[activeTab]} />
      ) : (
        <div className="space-y-4">
          {tracks.map((track, i) => (
            <CompletedTrackCard
              key={track.id}
              track={track}
              rank={i + 1}
              featured={activeTab === 0 && i === 0}
            />
          ))}
        </div>
      )}

      {/* CTA */}
      {!isLoading && (
        <div className="mt-12 p-8 bg-gradient-to-br from-primary-500/5 to-primary-600/5 rounded-2xl border border-primary-500/20 text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Want your track to appear here?
          </p>
          <p className="text-[var(--text-secondary)] mb-4">
            Upload your unfinished loop, find a collaborator, and let the community vote.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/upload" className="btn-primary">
              Upload a Loop
            </Link>
            <Link to="/discover" className="btn-secondary">
              Find a Track to Complete
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;