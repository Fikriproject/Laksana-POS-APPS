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
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark print:h-auto print:overflow-visible print:block">
            {/* Sidebar */}
            <div className="print:hidden">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Main Content */}
            <main className="flex-1 h-full overflow-y-auto relative flex flex-col print:h-auto print:overflow-visible print:block print:static">
                <div className="h-full w-full print:h-auto print:overflow-visible print:block">
                    {/* Page Content */}
                    <Outlet context={{ toggleSidebar }} />
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
