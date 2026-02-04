'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { SettingsSidebar } from '@/components/settings/settings-sidebar';
import { ProfileManager } from '@/components/settings/profile-manager';
import { TagsManager } from '@/components/settings/tags-manager';
import { CuisinesManager } from '@/components/settings/cuisines-manager';
import { ListsManager } from '@/components/settings/lists-manager';
import { SecurityPrivacy } from '@/components/settings/security-privacy';
import { AppearanceManager } from '@/components/settings/appearance-manager';
import { PageTitle } from '@/components/layout/page-title';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

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
      case 'appearance':
        return <AppearanceManager />;
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
      case 'appearance':
        return 'Aparência';
      case 'security':
        return 'Segurança e Privacidade';
      default:
        return 'Configurações';
    }
  };

  return (
    <div className="bg-background">
      <PageTitle title={getTitle()} />
      {/* Main Content */}
      <main className="pb-24 lg:pb-0">
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
    </div>
  );
}
