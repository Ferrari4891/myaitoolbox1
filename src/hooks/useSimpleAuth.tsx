import { useState, useEffect } from 'react';

interface SimpleMember {
  firstName: string;
  lastName: string;
  email: string;
  displayName: string;
  joinedAt: string;
}

export const useSimpleAuth = () => {
  const [member, setMember] = useState<SimpleMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for member data in localStorage
    const getMember = () => {
      const memberData = localStorage.getItem('gg_member');
      if (memberData) {
        try {
          const parsed = JSON.parse(memberData);
          setMember(parsed);
        } catch (error) {
          console.error('Error parsing member data:', error);
          localStorage.removeItem('gg_member');
        }
      }
      setLoading(false);
    };

    getMember();

    // Listen for storage changes (in case member data is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gg_member') {
        getMember();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const signOut = () => {
    localStorage.removeItem('gg_member');
    setMember(null);
    window.location.href = '/';
  };

  return { 
    member, 
    loading, 
    isMember: !!member,
    signOut
  };
};