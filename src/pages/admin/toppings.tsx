import { useState, useEffect, ChangeEvent, FormEvent, FocusEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import { withAuth } from "../../lib/withAuth";

// Define the Topping interface
interface Topping {
    id: number;
    name: string;
    price: number;
    createdAt?: string;
    updatedAt?: string;
}

// Define the form state interface
interface ToppingForm {
    name: string;
    price: string;
}

function ToppingsPage() {
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentTopping, setCurrentTopping] = useState<Topping | null>(null);

    // Form state for adding/editing toppings
    const [toppingForm, setToppingForm] = useState<ToppingForm>({
        name: "",
        price: ""
    });

    // Fetch toppings on component mount
    useEffect(() => {
        fetchToppings();
    }, []);

    // Function to fetch all toppings
    const fetchToppings = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/toppings");
            if (!response.ok) {
                throw new Error("Failed to fetch toppings");
            }
            const data = await response.json();
            setToppings(data);
        } catch (error) {
            console.error("Error fetching toppings:", error);
            alert("Không thể tải danh sách topping. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setToppingForm({ ...toppingForm, [name]: value });
    };

    // Handle adding a new topping
    const handleAddTopping = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!toppingForm.name || !toppingForm.price) {
            alert("Vui lòng điền đầy đủ các trường bắt buộc");
            return;
        }

        try {
            const response = await fetch("/api/toppings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: toppingForm.name,
                    price: parseInt(toppingForm.price)
                })
            });

            if (!response.ok) {
                throw new Error("Failed to add topping");
            }

            // Refresh the toppings list
            fetchToppings();

            // Reset form and close modal
            setToppingForm({ name: "", price: "" });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error adding topping:", error);
            alert("Không thể thêm topping. Vui lòng thử lại sau.");
        }
    };

    // Open edit modal with topping data
    const openEditModal = (topping: Topping) => {
        setCurrentTopping(topping);
        setToppingForm({
            name: topping.name,
            price: topping.price.toString()
        });
        setIsEditModalOpen(true);
    };

    // Handle updating a topping
    const handleUpdateTopping = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentTopping || !toppingForm.name || !toppingForm.price) {
            alert("Vui lòng điền đầy đủ các trường bắt buộc");
            return;
        }

        try {
            const response = await fetch(`/api/toppings?id=${currentTopping.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: toppingForm.name,
                    price: parseInt(toppingForm.price)
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update topping");
            }

            // Refresh the toppings list
            fetchToppings();

            // Reset form and close modal
            setToppingForm({ name: "", price: "" });
            setCurrentTopping(null);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating topping:", error);
            alert("Không thể cập nhật topping. Vui lòng thử lại sau.");
        }
    };

    // Handle deleting a topping
    const handleDeleteTopping = async (id: number, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa topping "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/toppings?id=${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                throw new Error("Failed to delete topping");
            }

            // Refresh the toppings list
            fetchToppings();

            alert("Xóa topping thành công!");
        } catch (error) {
            console.error("Error deleting topping:", error);
            alert("Không thể xóa topping. Vui lòng thử lại sau.");
        }
    };

    // Filter toppings based on search term
    const filteredToppings = toppings.filter((topping) => topping.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Format price to VND
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-700 to-amber-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">🧊 Quản lý Topping</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        + Thêm topping
                    </button>
                </div>

                {/* Statistics */}
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-xl font-bold text-amber-600">{toppings.length}</div>
                    <div className="text-sm text-gray-500">Tổng số topping</div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm topping..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800"
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Toppings List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Đang tải dữ liệu...</div>
                    ) : filteredToppings.length > 0 ? (
                        filteredToppings.map((topping) => (
                            <div key={topping.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg text-gray-800 font-semibold">{topping.name}</h3>
                                        <div className="text-lg font-bold text-amber-600">{formatPrice(topping.price)}</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        className="px-3 py-1 bg-amber-200 text-amber-900 rounded text-xs font-medium"
                                        onClick={() => openEditModal(topping)}
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium"
                                        onClick={() => handleDeleteTopping(topping.id, topping.name)}
                                    >
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                            Không tìm thấy topping nào phù hợp với tiêu chí tìm kiếm
                        </div>
                    )}
                </div>
            </div>

            {/* Add Topping Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-amber-600">🧊 Thêm topping mới</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-amber-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddTopping}>
                            {/* Tên topping */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên topping *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Trân châu đen, Thạch dừa..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={toppingForm.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Giá */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">💰 Giá (VNĐ) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="5000"
                                    min="0"
                                    step="1000"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={toppingForm.price}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        let value = e.target.value.replace(/\D/g, "");
                                        setToppingForm({ ...toppingForm, price: value });
                                    }}
                                    onBlur={(e: FocusEvent<HTMLInputElement>) => {
                                        let value = e.target.value.replace(/\D/g, "");
                                        if (value) {
                                            value = (Math.round(parseInt(value) / 1000) * 1000).toString();
                                        }
                                        setToppingForm({ ...toppingForm, price: value });
                                    }}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    ❌ Hủy
                                </button>
                                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                                    💾 Lưu topping
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Topping Modal */}
            {isEditModalOpen && currentTopping && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-amber-600">✏️ Sửa topping</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-amber-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateTopping}>
                            {/* Tên topping */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên topping *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Trân châu đen, Thạch dừa..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={toppingForm.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            {/* Giá */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">💰 Giá (VNĐ) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    placeholder="5000"
                                    min="1000"
                                    step="1000"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={toppingForm.price}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        let value = e.target.value.replace(/\D/g, "");
                                        if (value) {
                                            value = (Math.round(parseInt(value) / 1000) * 1000).toString();
                                        }
                                        setToppingForm({ ...toppingForm, price: value });
                                    }}
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    ❌ Hủy
                                </button>
                                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                                    💾 Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default withAuth(ToppingsPage);
