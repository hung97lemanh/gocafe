import AdminLayout from "../../components/AdminLayout";
import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { withAuth } from "../../lib/withAuth";

// Types
type ConnectionStatus = "connected" | "disconnected" | "paused";

function OrdersPage() {
    const [filterValue, setFilterValue] = useState("all");
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]); // Store ALL orders for stats
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { number: 0, label: "Đơn chờ" },
        { number: 0, label: "Đã thanh toán" },
        { number: 0, label: "Hoàn thành" },
        { number: "0", label: "Doanh thu" }
    ]);
    const [searchQuery, setSearchQuery] = useState("");
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connected");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Refs cho polling system
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false); // Prevent concurrent requests
    const errorCountRef = useRef(0); // Track consecutive errors
    const currentIntervalRef = useRef(8000); // Current polling interval
    const lastOrderCountRef = useRef(0); // Track order count for new order detection
    const audioRef = useRef<HTMLAudioElement | null>(null); // Audio for notifications
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize audio
    useEffect(() => {
        // Tạo audio element cho notification sound (có thể thay bằng file âm thanh thực tế)
        audioRef.current = new Audio("/codonhangmoi.mp3");
    }, []);

    // Hàm tính stats từ data có sẵn (KHÔNG gọi API)
    const calculateStatsFromData = useCallback((ordersData: any[]) => {
        const pendingCount = ordersData.filter((order: any) => ["pending", "in_progress", "ready"].includes(order.status)).length;

        const paidCount = ordersData.filter((order: any) => order.status === "paid").length;

        const doneCount = ordersData.filter((order: any) => order.status === "served").length;

        const revenue = ordersData
            .filter((order: any) => ["paid", "served"].includes(order.status))
            .reduce((sum: any, order: any) => sum + (order.totalAmount || 0), 0);

        setStats([
            { number: pendingCount, label: "Đơn chờ" },
            { number: paidCount, label: "Đã thanh toán" },
            { number: doneCount, label: "Hoàn thành" },
            { number: formatCurrency(revenue), label: "Doanh thu" }
        ]);
    }, []);

    // Hàm fetch orders (có loading spinner) - CHỈ dùng khi mount
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch TẤT CẢ orders để tính stats
            const allResponse = await axios.get(`/api/orders?status=all`);
            const allOrdersData = allResponse.data;

            setAllOrders(allOrdersData);
            lastOrderCountRef.current = allOrdersData.length;

            // Filter orders theo filterValue
            if (filterValue === "all") {
                setOrders(allOrdersData);
            } else {
                const filtered = allOrdersData.filter((order: any) => order.status === filterValue.toLowerCase());
                setOrders(filtered);
            }

            // Tính stats từ ALL orders
            calculateStatsFromData(allOrdersData);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    }, [filterValue, calculateStatsFromData]);

    // Hàm fetch orders silently (không có loading spinner) - dùng cho polling
    const fetchOrdersSilently = useCallback(async () => {
        // Prevent concurrent requests
        if (isPollingRef.current) {
            console.log("🔄 Skipping fetch - request already in progress");
            return;
        }

        isPollingRef.current = true;

        try {
            // CHỈ fetch TẤT CẢ orders MỘT LẦN
            const allResponse = await axios.get(`/api/orders?status=all`);
            const newAllOrders = allResponse.data;

            // So sánh data cũ/mới bằng length và stringify
            const hasChanges = JSON.stringify(allOrders) !== JSON.stringify(newAllOrders);

            if (hasChanges) {
                console.log("📊 Data changed, updating state...");

                // Kiểm tra có đơn hàng mới không
                const hasNewOrder = newAllOrders.length > lastOrderCountRef.current;

                setAllOrders(newAllOrders);

                // Filter orders theo filterValue
                if (filterValue === "all") {
                    setOrders(newAllOrders);
                } else {
                    const filtered = newAllOrders.filter((order: any) => order.status === filterValue.toLowerCase());
                    setOrders(filtered);
                }

                // Tính stats từ ALL orders
                calculateStatsFromData(newAllOrders);

                // Notification cho đơn hàng mới
                if (hasNewOrder && lastOrderCountRef.current > 0) {
                    toast.success("🔔 Có đơn hàng mới!", {
                        duration: 3000,
                        position: "top-center"
                    });

                    // Phát âm thanh thông báo
                    if (audioRef.current) {
                        audioRef.current.play().catch((err) => console.log("Audio play failed:", err));
                    }
                }

                lastOrderCountRef.current = newAllOrders.length;
            } else {
                console.log("✓ No changes detected");
            }

            // Reset error count khi request thành công
            if (errorCountRef.current > 0) {
                errorCountRef.current = 0;
                currentIntervalRef.current = 8000;
                setConnectionStatus("connected");
                console.log("✅ Connection restored - Reset interval to 8s");

                // Restart polling với interval mới
                startPolling();
            }
        } catch (error) {
            console.error("Error in silent fetch:", error);

            // Exponential backoff
            errorCountRef.current++;

            // Tính toán interval mới
            if (errorCountRef.current === 1) {
                currentIntervalRef.current = 16000; // 16s
            } else if (errorCountRef.current === 2) {
                currentIntervalRef.current = 32000; // 32s
            } else {
                currentIntervalRef.current = 60000; // 60s (max)
            }

            setConnectionStatus("disconnected");
            console.log(`❌ Error ${errorCountRef.current} - New interval: ${currentIntervalRef.current}ms`);

            // Chỉ hiện toast sau 3 lỗi liên tiếp
            if (errorCountRef.current >= 3) {
                toast.error("⚠️ Mất kết nối với server", {
                    duration: 2000
                });
            }

            // Restart polling với interval mới
            startPolling();
        } finally {
            isPollingRef.current = false;
        }
    }, [filterValue, allOrders, calculateStatsFromData]);

    // Hàm start polling - REMOVE fetchOrdersSilently từ dependencies
    const startPolling = useCallback(() => {
        // Clear existing interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Start new interval với current interval
        pollingIntervalRef.current = setInterval(() => {
            // Gọi fetchOrdersSilently trực tiếp
            if (!isPollingRef.current) {
                fetchOrdersSilently();
            }
        }, currentIntervalRef.current);

        console.log(`🔄 Polling started with interval: ${currentIntervalRef.current}ms`);
    }, []); // EMPTY dependencies để tránh re-create

    // Hàm stop polling
    const stopPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log("⏸️ Polling stopped");
        }
    }, []);

    // Handle visibility change - FIX dependencies
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                stopPolling();
                setConnectionStatus("paused");
                console.log("👁️ Tab hidden - Polling paused");
            } else {
                setConnectionStatus("connected");
                startPolling();
                // Fetch ngay khi tab visible trở lại
                if (!isPollingRef.current) {
                    fetchOrdersSilently();
                }
                console.log("👁️ Tab visible - Polling resumed");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []); // EMPTY dependencies

    // Initial fetch và start polling - FIX dependencies
    useEffect(() => {
        fetchOrders();

        // Delay polling để tránh conflict với initial fetch
        const timeoutId = setTimeout(() => {
            startPolling();
        }, 1000);

        // Cleanup khi unmount hoặc filterValue thay đổi
        return () => {
            clearTimeout(timeoutId);
            stopPolling();
        };
    }, [filterValue]); // CHỈ phụ thuộc filterValue

    const formatCurrency = (amount: any) => {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + "M";
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + "K";
        }
        return amount.toString();
    };

    // Manual refresh handler - đơn giản hóa
    const handleManualRefresh = async () => {
        if (isRefreshing || isPollingRef.current) {
            console.log("⏭️ Skipping manual refresh - already refreshing");
            return;
        }

        setIsRefreshing(true);
        await fetchOrdersSilently();
        setIsRefreshing(false);

        // Reset polling timer
        stopPolling();
        setTimeout(() => startPolling(), 100);

        toast.success("🔄 Đã làm mới!", { duration: 1500 });
    };

    // Debounced action handler - đơn giản hóa
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

            // Fetch ngay lập tức
            if (!isPollingRef.current) {
                await fetchOrdersSilently();
            }

            // Reset polling timer
            stopPolling();
            setTimeout(() => startPolling(), 100);
        } catch (error) {
            console.error(`Error updating order ${orderId}:`, error);
            toast.error("Không thể cập nhật trạng thái đơn hàng");
        }
    };

    // Debounced item action handler - đơn giản hóa
    const handleItemAction = async (itemId: any, status: any) => {
        try {
            await axios.patch(`/api/order-items/${itemId}`, { status });
            toast.success("Cập nhật trạng thái món thành công");

            // Fetch ngay lập tức
            if (!isPollingRef.current) {
                await fetchOrdersSilently();
            }

            // Reset polling timer
            stopPolling();
            setTimeout(() => startPolling(), 100);
        } catch (error) {
            console.error(`Error updating item ${itemId}:`, error);
            toast.error("Không thể cập nhật trạng thái món");
        }
    };

    // Cleanup debounce timer
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

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

    // Connection status badge component
    const ConnectionBadge = () => {
        const statusConfig = {
            connected: {
                icon: "🟢",
                text: "Đang kết nối",
                className: "bg-green-100 text-green-700"
            },
            disconnected: {
                icon: "🔴",
                text: "Mất kết nối",
                className: "bg-red-100 text-red-700"
            },
            paused: {
                icon: "⏸️",
                text: "Tạm dừng",
                className: "bg-yellow-100 text-yellow-700"
            }
        };

        const config = statusConfig[connectionStatus];

        return (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                <span>{config.icon}</span>
                <span>{config.text}</span>
            </div>
        );
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

                    {/* Connection status và refresh button */}
                    <div className="flex items-center gap-2">
                        <ConnectionBadge />
                        <button
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
                            title="Làm mới"
                        >
                            <span className={`text-lg ${isRefreshing ? "animate-spin inline-block" : ""}`}>🔄</span>
                        </button>
                    </div>
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
                {/* <div className="bg-white p-4 rounded-lg shadow mb-4">
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
                </div> */}

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
export default withAuth(OrdersPage);
