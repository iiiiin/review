'use client';

import Header from '@/shared/layout/Header';
import Footer from '@/shared/layout/Footer';
import ProfileView from '@/features/profile/components/ProfileView';

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main className="px-6 py-8">
        <ProfileView />
      </main>
      <Footer />
    </>
  );
}
