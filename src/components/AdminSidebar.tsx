import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const menuItems = [
    { label: "Đơn hàng", path: "/admin/orders" },
    { label: "Món ăn", path: "/admin/foods" },
    { label: "Topping", path: "/admin/toppings" },
    { label: "Danh mục", path: "/admin/categories" },
    { label: "Bàn", path: "/admin/tables" },
    { label: "Cấu hình hệ thống", path: "/admin/system-settings" },
    { label: "Báo cáo", path: "/admin/reports" }
];

export default function AdminSidebar() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <>
            {/* Burger button for mobile - positioned in the mobile header */}
            <button className="md:hidden fixed left-4 top-4 z-50 p-2 rounded-md" onClick={() => setOpen(!open)} aria-label="Open sidebar">
                <svg width="24" height="24" fill="none">
                    <path d="M4 6h16M4 12h16M4 18h16" stroke="#333" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>

            {/* Sidebar - hidden by default on mobile, visible on desktop */}
            <div
                className={`fixed top-0 left-0 h-full w-[280px] bg-white text-gray-900 z-40 shadow-lg transform ${
                    open ? "translate-x-0" : "-translate-x-full"
                } transition-transform duration-300 md:translate-x-0 md:static md:w-full`}
            >
                <div className="flex items-center justify-between px-6 py-5" style={{ background: "#d67c2c" }}>
                    <span className="font-bold text-lg text-white">Quản lý Cafe</span>
                    {/* Close button for mobile */}
                    <button className="md:hidden p-2" onClick={() => setOpen(false)} aria-label="Close sidebar">
                        <svg width="24" height="24" fill="none">
                            <path d="M6 6l12 12M6 18L18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <nav className="mt-8">
                    <ul>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <Link
                                    href={item.path}
                                    className={`flex items-center px-6 py-3 hover:bg-orange-100 transition 
                    ${router.pathname === item.path ? "bg-orange-100 font-semibold" : ""}`}
                                    onClick={() => setOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>

            {/* Overlay for mobile when menu is open */}
            {open && <div className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden" onClick={() => setOpen(false)} />}
        </>
    );
}
