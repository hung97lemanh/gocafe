import React from "react";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-800">
            {/* Mobile Header */}
            <div className="md:hidden h-16 bg-white shadow-sm fixed top-0 left-0 right-0 z-30 flex items-center px-4">
                <div className="flex-1 text-center">
                    <span className="font-bold text-lg text-gray-800">Quản lý Cafe</span>
                </div>
            </div>

            <div className="flex flex-1 pt-16 md:pt-0">
                {/* Sidebar is hidden on mobile by default and handled by AdminSidebar component */}
                <div className="hidden md:block md:w-[320px]">
                    <AdminSidebar />
                </div>
                {/* Mobile version of sidebar (with overlay) is rendered inside AdminSidebar */}
                <div className="md:hidden">
                    <AdminSidebar />
                </div>
                <main className="flex-1 bg-white p-4">{children}</main>
            </div>
        </div>
    );
}
