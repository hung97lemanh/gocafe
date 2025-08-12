import AdminLayout from "../../components/AdminLayout";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
    const [filterValue, setFilterValue] = useState("all");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { number: 0, label: "Đơn chờ" },
        { number: 0, label: "Đã thanh toán" },
        { number: 0, label: "Hoàn thành" },
        { number: "0", label: "Doanh thu" }
    ]);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchOrders();
    }, [filterValue]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/orders?status=${filterValue}`);
            setOrders(response.data);

            // Update stats
            calculateStats();
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = async () => {
        try {
            // Get all orders for stats
            const response = await axios.get("/api/orders");
            const allOrders = response.data;

            const pendingCount = allOrders.filter((order: any) => ["pending", "in_progress", "ready"].includes(order.status)).length;

            const paidCount = allOrders.filter((order: any) => order.status === "paid").length;

            const doneCount = allOrders.filter((order: any) => order.status === "served").length;

            // Calculate revenue from paid and served orders
            const revenue = allOrders
                .filter((order: any) => ["paid", "served"].includes(order.status))
                .reduce((sum: any, order: any) => sum + (order.totalAmount || 0), 0);

            setStats([
                { number: pendingCount, label: "Đơn chờ" },
                { number: paidCount, label: "Đã thanh toán" },
                { number: doneCount, label: "Hoàn thành" },
                { number: formatCurrency(revenue), label: "Doanh thu" }
            ]);
        } catch (error) {
            console.error("Error calculating stats:", error);
        }
    };

    const formatCurrency = (amount: any) => {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + "M";
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + "K";
        }
        return amount.toString();
    };

    const handleOrderAction = async (orderId: any, action: any) => {
        try {
            let status, message;

            switch (action) {
                case "đã pha":
                    status = "READY";
                    message = "Đánh dấu đơn hàng đã pha xong thành công";
                    break;
                case "thanh toán":
                    status = "PAID";
                    message = "Đánh dấu đơn hàng đã thanh toán thành công";
                    break;
                case "hoàn thành":
                    status = "SERVED";
                    message = "Đánh dấu đơn hàng đã hoàn thành thành công";
                    break;
                case "hủy":
                    status = "CANCELLED";
                    message = "Đơn hàng đã được hủy";
                    break;
                default:
                    return;
            }

            await axios.patch(`/api/orders`, {
                orderId,
                status
            });

            toast.success(message);
            fetchOrders();
        } catch (error) {
            console.error(`Error updating order ${orderId}:`, error);
            toast.error("Không thể cập nhật trạng thái đơn hàng");
        }
    };

    const handleItemAction = async (itemId: any, status: any) => {
        try {
            await axios.patch(`/api/order-items/${itemId}`, { status });
            toast.success("Cập nhật trạng thái món thành công");
            fetchOrders();
        } catch (error) {
            console.error(`Error updating item ${itemId}:`, error);
            toast.error("Không thể cập nhật trạng thái món");
        }
    };

    const getStatusClass = (status: any) => {
        switch (status) {
            case "pending":
                return "bg-amber-100 text-amber-800";
            case "in_progress":
                return "bg-blue-100 text-blue-800";
            case "ready":
                return "bg-green-100 text-green-800";
            case "served":
                return "bg-purple-100 text-purple-800";
            case "paid":
                return "bg-green-100 text-green-800";
            case "cancelled":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const filteredOrders = orders.filter((order: any) => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        return order.id.toLowerCase().includes(query) || order.customer.toLowerCase().includes(query) || order.table.toLowerCase().includes(query);
    });

    return (
        <AdminLayout>
            <div className="pb-20">
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-700 to-amber-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">🏪 Quản lý đơn hàng</h1>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <select
                            className="p-2 border border-gray-300 rounded-lg text-sm min-w-[120px]"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="PENDING">Chờ pha</option>
                            <option value="IN_PROGRESS">Đang pha chế</option>
                            <option value="READY">Đã pha xong</option>
                            <option value="PAID">Đã thanh toán</option>
                            <option value="SERVED">Đã phục vụ</option>
                        </select>
                    </div>
                </div>

                {/* Order Items */}
                {loading ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-700 mx-auto"></div>
                        <p className="mt-2 text-gray-500">Đang tải dữ liệu...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl shadow">
                        <p className="text-gray-500">Không có đơn hàng nào</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredOrders.map((order: any) => (
                            <div key={order.id} className="bg-white rounded-xl p-4 shadow border-l-4 border-orange-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="text-lg font-bold text-orange-600">{order.id}</div>
                                        <div className="text-sm text-gray-600">
                                            {order.table} • {order.customer}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>
                                        {order.statusText}
                                    </span>
                                </div>

                                {/* Order Details */}
                                <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                                    <h4 className="text-orange-600 font-medium mb-1 text-sm">Chi tiết đơn hàng:</h4>
                                    <ul className="text-sm text-gray-600">
                                        {order.items.map((item: any, index: any) => (
                                            <li key={index} className="flex justify-between items-center mb-1">
                                                <span>• {item.name}</span>
                                                {order.status === "pending" && (
                                                    <button
                                                        onClick={() => handleItemAction(item.id, "DONE")}
                                                        className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded hover:bg-green-200"
                                                    >
                                                        Đã pha xong
                                                    </button>
                                                )}
                                            </li>
                                        ))}
                                        <li>
                                            • Tổng: {order.total} {order.paymentMethod && `• ${order.paymentMethod}`}
                                        </li>
                                    </ul>
                                </div>

                                {/* Order Actions */}
                                <div className="flex flex-wrap gap-2">
                                    {["pending", "in_progress"].includes(order.status) && (
                                        <>
                                            <button
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium"
                                                onClick={() => handleOrderAction(order.rawId, "đã pha")}
                                            >
                                                ✅ Đã pha xong
                                            </button>
                                            <button
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium"
                                                onClick={() => handleOrderAction(order.rawId, "thanh toán")}
                                            >
                                                💳 Đã thanh toán
                                            </button>
                                            <button
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium"
                                                onClick={() => handleOrderAction(order.rawId, "hủy")}
                                            >
                                                ❌ Hủy
                                            </button>
                                        </>
                                    )}

                                    {order.status === "ready" && (
                                        <button
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium"
                                            onClick={() => handleOrderAction(order.rawId, "thanh toán")}
                                        >
                                            💳 Đã thanh toán
                                        </button>
                                    )}

                                    {order.status === "paid" && (
                                        <button
                                            className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium"
                                            onClick={() => handleOrderAction(order.rawId, "hoàn thành")}
                                        >
                                            🎉 Hoàn thành
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
