import { useState } from 'react';

export default function Avatar({ user, size = 40, className = '' }) {
const [error, setError] = useState(false);

const getInitial = () => {
if (user?.username) return user.username[0].toUpperCase();
return '?';
};

if (user?.avatar_url && !error) {
return (
    <img
    src={user.avatar_url}
    alt={user.username}
    className={`rounded-full object-cover ${className}`}
    style={{ width: size, height: size }}
    onError={() => setError(true)}
    />
);
}

return (
<div
    className={`bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold ${className}`}
    style={{ width: size, height: size, fontSize: size * 0.4 }}
>
    {getInitial()}
</div>
);
}