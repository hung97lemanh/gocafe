import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { TableStatus } from "@prisma/client";
import { useQRCode } from "next-qrcode";

// Define the Table interface
interface Table {
    id: number;
    name: string;
    qrCodeUrl: string;
    status: TableStatus;
    createdAt?: string;
    updatedAt?: string;
}

// Define the form state interface
interface TableForm {
    name: string;
    status: TableStatus;
}
export default function TablesPage() {
    const { Canvas } = useQRCode();
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewQRModalOpen, setIsViewQRModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentTable, setCurrentTable] = useState<Table | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Form state for adding/editing tables
    const [tableForm, setTableForm] = useState<TableForm>({
        name: "",
        status: TableStatus.FREE
    });

    // Fetch tables on component mount
    useEffect(() => {
        fetchTables();
    }, []);

    // Function to fetch all tables
    const fetchTables = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/tables");
            if (!response.ok) {
                throw new Error("Failed to fetch tables");
            }
            const data = await response.json();
            setTables(data);
        } catch (error) {
            console.error("Error fetching tables:", error);
            alert("Không thể tải danh sách bàn. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTableForm({ ...tableForm, [name]: value });
    };

    // Handle adding a new table
    const handleAddTable = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!tableForm.name) {
            alert("Vui lòng điền tên bàn");
            return;
        }

        try {
            const response = await fetch("/api/tables", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: tableForm.name,
                    status: tableForm.status
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to add table");
            }

            // Refresh the tables list
            fetchTables();

            // Reset form and close modal
            setTableForm({ name: "", status: TableStatus.FREE });
            setIsAddModalOpen(false);

            alert("Thêm bàn mới thành công!");
        } catch (error: any) {
            console.error("Error adding table:", error);
            alert(`Không thể thêm bàn: ${error.message}`);
        }
    };

    // Open edit modal with table data
    const openEditModal = (table: Table) => {
        setCurrentTable(table);
        setTableForm({
            name: table.name,
            status: table.status
        });
        setIsEditModalOpen(true);
    };

    // Open QR view modal
    const openQRModal = (table: Table) => {
        setCurrentTable(table);
        setIsViewQRModalOpen(true);
    };

    // Handle updating a table
    const handleUpdateTable = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentTable || !tableForm.name) {
            alert("Vui lòng điền tên bàn");
            return;
        }

        try {
            const response = await fetch(`/api/tables?id=${currentTable.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: tableForm.name,
                    qrCodeUrl: currentTable.qrCodeUrl, // Keep the existing QR code URL
                    status: tableForm.status
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to update table");
            }

            // Refresh the tables list
            fetchTables();

            // Reset form and close modal
            setTableForm({ name: "", status: TableStatus.FREE });
            setCurrentTable(null);
            setIsEditModalOpen(false);

            alert("Cập nhật bàn thành công!");
        } catch (error: any) {
            console.error("Error updating table:", error);
            alert(`Không thể cập nhật bàn: ${error.message}`);
        }
    };

    // Handle deleting a table
    const handleDeleteTable = async (id: number, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/tables?id=${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete table");
            }

            // Refresh the tables list
            fetchTables();

            alert("Xóa bàn thành công!");
        } catch (error: any) {
            console.error("Error deleting table:", error);
            alert(`Không thể xóa bàn: ${error.message}`);
        }
    };

    // Quick update table status
    const handleQuickStatusChange = async (id: number, status: TableStatus) => {
        try {
            const table = tables.find((t) => t.id === id);
            if (!table) return;

            const response = await fetch(`/api/tables?id=${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: table.name,
                    qrCodeUrl: table.qrCodeUrl,
                    status: status
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update table status");
            }

            // Refresh the tables list
            fetchTables();
        } catch (error) {
            console.error("Error updating table status:", error);
            alert("Không thể cập nhật trạng thái bàn. Vui lòng thử lại sau.");
        }
    };

    // Filter tables based on search term and status
    const filteredTables = tables.filter((table) => {
        const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || table.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Get status color and label
    const getStatusInfo = (status: TableStatus) => {
        switch (status) {
            case "FREE":
                return { color: "bg-green-100 text-green-800", label: "Trống" };
            case "OCCUPIED":
                return { color: "bg-red-100 text-red-800", label: "Đã có khách" };
            case "RESERVED":
                return { color: "bg-yellow-100 text-yellow-800", label: "Đã đặt trước" };
            // case "MAINTENANCE":
            //     return { color: "bg-gray-100 text-gray-800", label: "Bảo trì" };
            default:
                return { color: "bg-gray-100 text-gray-800", label: "Khác" };
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">🪑 Quản lý Bàn</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        + Thêm bàn mới
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-blue-600">{tables.length}</div>
                        <div className="text-sm text-gray-500">Tổng số bàn</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-green-600">{tables.filter((t) => t.status === "FREE").length}</div>
                        <div className="text-sm text-gray-500">Bàn trống</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-red-600">{tables.filter((t) => t.status === "OCCUPIED").length}</div>
                        <div className="text-sm text-gray-500">Bàn có khách</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-yellow-600">{tables.filter((t) => t.status === "RESERVED").length}</div>
                        <div className="text-sm text-gray-500">Bàn đã đặt</div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm bàn..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800"
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="md:w-48 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800"
                            value={statusFilter}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="FREE">Trống</option>
                            <option value="OCCUPIED">Đã có khách</option>
                            <option value="RESERVED">Đã đặt trước</option>
                            <option value="MAINTENANCE">Bảo trì</option>
                        </select>
                    </div>
                </div>

                {/* Tables List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isLoading ? (
                        <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">Đang tải dữ liệu...</div>
                    ) : filteredTables.length > 0 ? (
                        filteredTables.map((table) => {
                            const statusInfo = getStatusInfo(table.status);

                            return (
                                <div key={table.id} className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg text-gray-800 font-semibold">{table.name}</h3>
                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} mt-1`}>
                                                {statusInfo.label}
                                            </div>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => openQRModal(table)}
                                                className="p-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                                title="Xem QR"
                                            >
                                                🔍
                                            </button>
                                            <button
                                                onClick={() => openEditModal(table)}
                                                className="p-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200"
                                                title="Sửa thông tin"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTable(table.id, table.name)}
                                                className="p-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
                                                title="Xóa bàn"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Status Change */}
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <div className="text-xs text-gray-500 mb-2">Thay đổi trạng thái:</div>
                                        <div className="flex flex-wrap gap-2">
                                            {table.status !== "FREE" && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(table.id, "FREE")}
                                                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
                                                >
                                                    Trống
                                                </button>
                                            )}
                                            {table.status !== "OCCUPIED" && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(table.id, "OCCUPIED")}
                                                    className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium"
                                                >
                                                    Có khách
                                                </button>
                                            )}
                                            {table.status !== "RESERVED" && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(table.id, "RESERVED")}
                                                    className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium"
                                                >
                                                    Đặt trước
                                                </button>
                                            )}
                                            {/* {table.status !== "MAINTENANCE" && (
                                                <button
                                                    onClick={() => handleQuickStatusChange(table.id, "MAINTENANCE")}
                                                    className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium"
                                                >
                                                    Bảo trì
                                                </button>
                                            )} */}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">
                            Không tìm thấy bàn nào phù hợp với tiêu chí tìm kiếm
                        </div>
                    )}
                </div>
            </div>

            {/* Add Table Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-blue-600">🪑 Thêm bàn mới</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddTable}>
                            {/* Tên bàn */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên bàn *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Bàn 1, Bàn VIP..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 text-gray-800 font-medium"
                                    value={tableForm.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Trạng thái */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">🔄 Trạng thái</label>
                                <select
                                    name="status"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 text-gray-800 font-medium"
                                    value={tableForm.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="FREE">Trống</option>
                                    <option value="OCCUPIED">Đã có khách</option>
                                    <option value="RESERVED">Đã đặt trước</option>
                                    <option value="MAINTENANCE">Bảo trì</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    ❌ Hủy
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    💾 Lưu bàn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Table Modal */}
            {isEditModalOpen && currentTable && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-blue-600">✏️ Sửa thông tin bàn</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTable}>
                            {/* Tên bàn */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên bàn *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Bàn 1, Bàn VIP..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 text-gray-800 font-medium"
                                    value={tableForm.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Trạng thái */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">🔄 Trạng thái</label>
                                <select
                                    name="status"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-blue-600 text-gray-800 font-medium"
                                    value={tableForm.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="FREE">Trống</option>
                                    <option value="OCCUPIED">Đã có khách</option>
                                    <option value="RESERVED">Đã đặt trước</option>
                                    <option value="MAINTENANCE">Bảo trì</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    ❌ Hủy
                                </button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    💾 Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View QR Code Modal */}
            {isViewQRModalOpen && currentTable && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-blue-600">🔍 QR Code: {currentTable.name}</h2>
                            <button
                                onClick={() => setIsViewQRModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-blue-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="flex flex-col items-center">
                            <Canvas
                                text={`${window.location.origin}/order-table/${currentTable.id}`}
                                options={{
                                    type: "image/jpeg",
                                    quality: 0.3,
                                    errorCorrectionLevel: "M",
                                    margin: 3,
                                    scale: 4,
                                    width: 200,
                                    color: {
                                        dark: "#010599FF",
                                        light: "#edebeb"
                                    }
                                }}
                            />

                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => {
                                        // Find the QR canvas element (needs a more reliable selector)
                                        const canvas = document.querySelector("canvas");
                                        if (canvas) {
                                            // Create a temporary link to trigger download
                                            const link = document.createElement("a");
                                            link.download = `qr-${currentTable.name.replace(/\s+/g, "-")}.png`;
                                            // Convert canvas to data URL
                                            link.href = canvas.toDataURL("image/png");
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        } else {
                                            alert("Không thể tải QR code. Vui lòng thử lại.");
                                        }
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                >
                                    <span>⬇️</span> Tải QR code
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
