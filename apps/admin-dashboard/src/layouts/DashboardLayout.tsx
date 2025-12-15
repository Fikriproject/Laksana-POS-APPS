import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export interface DashboardContextType {
    toggleSidebar: () => void;
}

const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Sidebar */}
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto relative flex flex-col">
                <div className="h-full w-full">
                    {/* Page Content */}
                    <Outlet context={{ toggleSidebar }} />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
