import AdminLayout from "../../components/AdminLayout";
import { useState } from "react";

export default function OrdersPage() {
    const [filterValue, setFilterValue] = useState("all");

    // Mock order data - in a real app this would come from an API
    const orders = [
        {
            id: "#DH00123",
            table: "Bàn 04",
            customer: "Hưng",
            status: "pending",
            statusText: "Chờ thanh toán",
            items: ["Trà Đào x2 (ít đường)", "Cà Phê Sữa x1 (nhiều đá)"],
            total: "115.000đ"
        },
        {
            id: "#DH00124",
            table: "Bàn 02",
            customer: "Khánh",
            status: "paid",
            statusText: "Đã thanh toán",
            items: ["Cà Phê Đen x1", "Bánh Mì x1"],
            total: "60.000đ"
        },
        {
            id: "#DH00125",
            table: "Bàn 06",
            customer: "Lan",
            status: "done",
            statusText: "Hoàn thành",
            items: ["Trà Sữa x2"],
            total: "80.000đ",
            paymentMethod: "Chuyển khoản"
        }
    ];

    // Stats data
    const stats = [
        { number: 8, label: "Đơn chờ" },
        { number: 12, label: "Đã thanh toán" },
        { number: 25, label: "Hoàn thành" },
        { number: "1.2M", label: "Doanh thu" }
    ];

    const handleOrderAction = (orderId: any, action: any) => {
        alert(`Thực hiện ${action} cho đơn hàng ${orderId}`);
        // In a real app, you would call an API here
    };

    const getStatusClass = (status: any) => {
        switch (status) {
            case "pending":
                return "bg-amber-100 text-amber-800";
            case "paid":
                return "bg-green-100 text-green-800";
            case "done":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <AdminLayout>
            <div className="pb-20">
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-700 to-amber-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">🏪 Quản lý đơn hàng</h1>
                    {/* <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        + Thêm món
                    </button> */}
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-xl font-bold text-orange-700">{stat.number}</div>
                            <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-lg shadow mb-4">
                    <div className="flex flex-col md:flex-row gap-2">
                        <input
                            type="text"
                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="🔍 Tìm mã đơn, tên khách..."
                        />
                        <select
                            className="p-2 border border-gray-300 rounded-lg text-sm min-w-[120px]"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chờ pha</option>
                            <option value="paid">Đã thanh toán</option>
                            <option value="done">Hoàn thành</option>
                        </select>
                    </div>
                </div>

                {/* Order Items */}
                <div className="flex flex-col gap-3">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl p-4 shadow border-l-4 border-orange-600">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-lg font-bold text-orange-600">{order.id}</div>
                                    <div className="text-sm text-gray-600">
                                        {order.table} • {order.customer}
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>{order.statusText}</span>
                            </div>

                            {/* Order Details */}
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                                <h4 className="text-orange-600 font-medium mb-1 text-sm">Chi tiết đơn hàng:</h4>
                                <ul className="text-sm text-gray-600">
                                    {order.items.map((item, index) => (
                                        <li key={index}>• {item}</li>
                                    ))}
                                    <li>
                                        • Tổng: {order.total} {order.paymentMethod && `• ${order.paymentMethod}`}
                                    </li>
                                </ul>
                            </div>

                            {/* Order Actions */}
                            <div className="flex flex-wrap gap-2">
                                {order.status === "pending" && (
                                    <>
                                        <button
                                            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium"
                                            onClick={() => handleOrderAction(order.id, "đã pha")}
                                        >
                                            ✅ Đã pha
                                        </button>
                                        <button
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium"
                                            onClick={() => handleOrderAction(order.id, "thanh toán")}
                                        >
                                            💳 Đã thanh toán
                                        </button>
                                        <button
                                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium"
                                            onClick={() => handleOrderAction(order.id, "hủy")}
                                        >
                                            ❌ Hủy
                                        </button>
                                    </>
                                )}

                                {order.status === "paid" && (
                                    <button
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium"
                                        onClick={() => handleOrderAction(order.id, "hoàn thành")}
                                    >
                                        🎉 Hoàn thành
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
