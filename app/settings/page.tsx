'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BottomNav } from '@/components/bottom-nav';
import { AddLogModal } from '@/components/add-log-modal';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { ProfileManager } from '@/components/settings/profile-manager';
import { TagsManager } from '@/components/settings/tags-manager';
import { CuisinesManager } from '@/components/settings/cuisines-manager';
import { ListsManager } from '@/components/settings/lists-manager';
import { SecurityPrivacy } from '@/components/settings/security-privacy';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileManager />;
      case 'tags':
        return <TagsManager />;
      case 'cuisines':
        return <CuisinesManager />;
      case 'lists':
        return <ListsManager />;
      case 'security':
        return <SecurityPrivacy />;
      default:
        return <ProfileManager />;
    }
  };

  // Helper to get title based on section
  const getTitle = () => {
    switch (activeSection) {
      case 'profile':
        return 'Perfil';
      case 'tags':
        return 'Tags';
      case 'cuisines':
        return 'Culinárias';
      case 'lists':
        return 'Listas';
      case 'security':
        return 'Segurança e Privacidade';
      default:
        return 'Configurações';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header - only visible on lg+ */}
      <header className="hidden lg:flex fixed top-0 left-64 right-0 z-40 h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-8">
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Configurações</h1>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/30">
        <div className="mx-auto flex h-14 max-w-md items-center gap-4 px-4">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold">Configurações</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-16 pb-24 lg:pb-0">
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
          {/* Sidebar - top on mobile, sticky left on desktop */}
          <aside className="lg:w-72 flex-shrink-0 lg:border-r lg:bg-muted/10">
            <div className="lg:sticky lg:top-16 p-6">
              <SettingsSidebar
                currentSection={activeSection}
                onSectionChange={setActiveSection}
              />
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="mx-auto max-w-2xl px-4 py-6 lg:py-10 lg:px-10">
              <div className="mb-6 lg:hidden">
                <h2 className="text-xl font-bold">{getTitle()}</h2>
              </div>
              {renderContent()}
            </div>
          </div>
        </div>
      </main>

      <BottomNav onAddClick={() => setIsModalOpen(true)} />

      <AddLogModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          // If we need to refresh anything globally
        }}
      />
    </div>
  );
}
