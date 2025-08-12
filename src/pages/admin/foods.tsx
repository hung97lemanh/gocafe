import { useState, ChangeEvent, FormEvent, MouseEvent, useEffect, FocusEvent } from "react";
import AdminLayout from "../../components/AdminLayout";
import axios from "axios";
import useSWR, { mutate } from "swr";
import Image from "next/image";

// Type interfaces for API data
interface Category {
    id: number;
    name: string;
    foodCount?: number;
}

interface Topping {
    id: number;
    name: string;
    price: number;
}

interface FoodTopping {
    id: number;
    foodId: number;
    toppingId: number;
    topping: Topping;
}

interface Food {
    id: number;
    name: string;
    price: number;
    description: string;
    status: string;
    imageUrl: string | null;
    categoryId: number;
    category?: Category;
    foodToppings?: FoodTopping[];
    notes?: string;
}

interface NewFoodForm {
    name: string;
    price: string;
    description: string;
    status: string;
    notes: string;
    categoryId: string;
    selectedToppings: number[];
}

// SWR fetcher function
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export default function FoodsPage() {
    // Fetch data using SWR
    const { data: foods, error: foodsError, isLoading: foodsLoading } = useSWR<Food[]>("/api/foods", fetcher);
    const { data: categories, error: categoriesError } = useSWR<Category[]>("/api/categories", fetcher);
    const { data: toppings, error: toppingsError } = useSWR<Topping[]>("/api/toppings", fetcher);

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [currentFoodId, setCurrentFoodId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [showToast, setShowToast] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string>("");

    // State for new food form
    const [newFood, setNewFood] = useState<NewFoodForm>({
        name: "",
        price: "",
        description: "",
        status: "AVAILABLE",
        notes: "",
        categoryId: "",
        selectedToppings: []
    });

    // For file upload
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Reset form when closing modal
    useEffect(() => {
        if (!isAddModalOpen) {
            setNewFood({
                name: "",
                price: "",
                description: "",
                status: "AVAILABLE",
                notes: "",
                categoryId: "",
                selectedToppings: []
            });
            setSelectedFile(null);
            setPreviewUrl(null);
            setIsEditMode(false);
            setCurrentFoodId(null);
        }
    }, [isAddModalOpen]);

    // Set up file preview
    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreviewUrl(objectUrl);

        // Free memory when component unmounts
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    // Show toast message
    const displayToast = (message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Open edit modal with food data
    const handleEditFood = (food: Food) => {
        // Find selected toppings
        const selectedToppingIds = food.foodToppings?.map((ft) => ft.topping.id) || [];

        setNewFood({
            name: food.name,
            price: food.price.toString(),
            description: food.description || "",
            status: food.status,
            notes: food.notes || "",
            categoryId: food.categoryId.toString(),
            selectedToppings: selectedToppingIds
        });

        if (food.imageUrl) {
            setPreviewUrl(food.imageUrl);
        }

        setCurrentFoodId(food.id);
        setIsEditMode(true);
        setIsAddModalOpen(true);
    };

    // Handle form submission for creating/updating food
    const handleSubmitFood = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // Validate form
        if (!newFood.name || !newFood.price || !newFood.categoryId) {
            alert("Vui lòng điền đầy đủ các trường bắt buộc (*)");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", newFood.name);
            formData.append("price", newFood.price);
            formData.append("description", newFood.description);
            formData.append("status", newFood.status);
            formData.append("categoryId", newFood.categoryId);

            if (newFood.notes) {
                formData.append("notes", newFood.notes);
            }

            // Add selected toppings
            newFood.selectedToppings.forEach((toppingId) => {
                formData.append("toppingIds", toppingId.toString());
            });

            // Add image if selected
            if (selectedFile) {
                formData.append("image", selectedFile);
            }

            let response;

            if (isEditMode && currentFoodId) {
                // Update existing food
                response = await axios.put(`/api/foods?id=${currentFoodId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                displayToast("Món ăn đã được cập nhật thành công");
            } else {
                // Create new food
                response = await axios.post("/api/foods", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                displayToast("Món ăn mới đã được thêm thành công");
            }

            // Refetch the foods list
            mutate("/api/foods");

            // Close modal
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error saving food:", error);
            alert("Có lỗi xảy ra khi lưu món ăn. Vui lòng thử lại sau.");
        }
    };

    // Handle deleting a food
    const handleDeleteFood = async (foodId: number, foodName: string) => {
        if (confirm(`Bạn có chắc muốn xóa món "${foodName}"?`)) {
            try {
                await axios.delete(`/api/foods?id=${foodId}`);
                mutate("/api/foods");
                displayToast("Món ăn đã được xóa thành công");
            } catch (error) {
                console.error("Error deleting food:", error);
                alert("Có lỗi xảy ra khi xóa món ăn. Vui lòng thử lại sau.");
            }
        }
    };

    // Toggle topping selection
    const toggleTopping = (toppingId: number): void => {
        setNewFood((prev) => {
            const currentToppings = [...prev.selectedToppings];

            if (currentToppings.includes(toppingId)) {
                return {
                    ...prev,
                    selectedToppings: currentToppings.filter((id) => id !== toppingId)
                };
            } else {
                return {
                    ...prev,
                    selectedToppings: [...currentToppings, toppingId]
                };
            }
        });
    };

    // Remove a selected topping
    const removeTopping = (toppingId: number): void => {
        setNewFood((prev) => ({
            ...prev,
            selectedToppings: prev.selectedToppings.filter((id) => id !== toppingId)
        }));
    };

    // Handle file selection
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert("Kích thước file quá lớn. Vui lòng chọn file nhỏ hơn 5MB.");
                return;
            }
            setSelectedFile(file);
        }
    };

    // Filtering foods based on search and status
    const filteredFoods =
        foods?.filter((food: any) => {
            const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || food.status === statusFilter;
            return matchesSearch && matchesStatus;
        }) || [];

    // Format price to VND
    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    };

    // Translate food status to Vietnamese
    const translateStatus = (status: string): string => {
        switch (status) {
            case "AVAILABLE":
                return "Còn hàng";
            case "OUT_OF_STOCK":
                return "Hết hàng";
            case "HIDDEN":
                return "Ẩn";
            default:
                return status;
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-gradient-to-r from-amber-700 to-amber-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">🏪 Quản lý món ăn</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        + Thêm món
                    </button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-amber-600">{foods?.length || 0}</div>
                        <div className="text-sm text-gray-500">Tổng món</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-amber-600">{foods?.filter((d: any) => d.status === "AVAILABLE").length || 0}</div>
                        <div className="text-sm text-gray-500">Còn hàng</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-amber-600">{foods?.filter((d: any) => d.status === "OUT_OF_STOCK").length || 0}</div>
                        <div className="text-sm text-gray-500">Hết hàng</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-xl font-bold text-amber-600">{foods?.filter((d: any    ) => d.status === "HIDDEN").length || 0}</div>
                        <div className="text-sm text-gray-500">Ẩn</div>
                    </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm món..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800"
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border border-gray-300 rounded-lg px-4 py-2 text-sm md:w-40 text-gray-800"
                            value={statusFilter}
                            onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả</option>
                            <option value="AVAILABLE">Còn hàng</option>
                            <option value="OUT_OF_STOCK">Hết hàng</option>
                            <option value="HIDDEN">Ẩn</option>
                        </select>
                    </div>
                </div>

                {/* Loading State */}
                {foodsLoading && (
                    <div className="bg-white p-8 rounded-lg shadow text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-2"></div>
                        <p className="text-gray-600">Đang tải danh sách món...</p>
                    </div>
                )}

                {/* Error State */}
                {foodsError && (
                    <div className="bg-white p-8 rounded-lg shadow text-center text-red-500">
                        Có lỗi xảy ra khi tải danh sách món ăn. Vui lòng thử lại sau.
                    </div>
                )}

                {/* Menu Items */}
                {!foodsLoading && !foodsError && (
                    <div className="space-y-3">
                        {filteredFoods.map((food: any) => (
                            <div key={food.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-amber-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-3">
                                        {food.imageUrl && (
                                            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-semibold">{food.name}</h3>
                                            <div className="text-lg font-bold text-amber-600">{formatPrice(food.price)}</div>
                                            {food.category && <div className="text-xs text-gray-500">Danh mục: {food.category.name}</div>}
                                        </div>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            food.status === "AVAILABLE"
                                                ? "bg-green-100 text-green-800"
                                                : food.status === "OUT_OF_STOCK"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                    >
                                        {translateStatus(food.status)}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 mb-3">{food.description}</div>

                                {food.foodToppings && food.foodToppings.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        <span className="text-xs text-gray-500 mr-1">Topping:</span>
                                        {food.foodToppings.map((ft: FoodTopping) => (
                                            <span key={ft.id} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                                                {ft.topping.name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="px-3 py-1 bg-amber-200 text-amber-900 rounded text-xs font-medium"
                                        onClick={() => handleEditFood(food)}
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs font-medium"
                                        onClick={async () => {
                                            try {
                                                const newStatus = food.status === "HIDDEN" ? "AVAILABLE" : "HIDDEN";
                                                await axios.put(`/api/foods?id=${food.id}`, { status: newStatus });
                                                mutate("/api/foods");
                                                displayToast(`Món ăn đã được ${newStatus === "HIDDEN" ? "ẩn" : "hiện"}`);
                                            } catch (error) {
                                                console.error("Error updating status:", error);
                                                alert("Có lỗi xảy ra. Vui lòng thử lại sau.");
                                            }
                                        }}
                                    >
                                        👁️ {food.status === "HIDDEN" ? "Hiện" : "Ẩn"}
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium"
                                        onClick={() => handleDeleteFood(food.id, food.name)}
                                    >
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredFoods.length === 0 && (
                            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                                Không tìm thấy món ăn nào phù hợp với tiêu chí tìm kiếm
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add/Edit Food Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-amber-600">🍽️ {isEditMode ? "Cập nhật món" : "Thêm món mới"}</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-amber-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmitFood}>
                            {/* Tên món */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên món *</label>
                                <input
                                    type="text"
                                    placeholder="Ví dụ: Trà Đào, Cà Phê Sữa..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFood({ ...newFood, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Danh mục */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📂 Danh mục *</label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.categoryId}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewFood({ ...newFood, categoryId: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories?.map((category: any) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {categoriesError && <p className="text-red-500 text-xs mt-1">Lỗi tải danh mục. Vui lòng thử lại.</p>}
                            </div>

                            {/* Giá */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">💰 Giá (VNĐ) *</label>
                                <input
                                    type="number"
                                    placeholder="35000"
                                    min="1000"
                                    step="1000"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.price}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                        let value = e.target.value.replace(/\D/g, "");
                                        setNewFood({ ...newFood, price: value });
                                    }}
                                    onBlur={(e: FocusEvent<HTMLInputElement>) => {
                                        let value = e.target.value.replace(/\D/g, "");
                                        if (value) {
                                            value = (Math.round(parseInt(value) / 1000) * 1000).toString();
                                        }
                                        setNewFood({ ...newFood, price: value });
                                    }}
                                    required
                                />
                            </div>

                            {/* Hình ảnh */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📷 Hình ảnh</label>
                                <div
                                    className={`border-2 border-dashed ${previewUrl ? "border-amber-600 bg-amber-50" : "border-gray-200"} 
                                    rounded-lg p-3 text-center cursor-pointer hover:border-amber-600 hover:bg-amber-50 transition`}
                                    onClick={() => document.getElementById("foodImage")?.click()}
                                >
                                    <input type="file" id="foodImage" accept="image/*" className="hidden" onChange={handleFileChange} />

                                    {previewUrl ? (
                                        <div className="text-center">
                                            <img src={previewUrl} alt="Preview" className="mx-auto max-h-40 object-contain mb-2" />
                                            <div className="text-gray-800 font-medium text-sm">
                                                {selectedFile ? `📷 Đã chọn: ${selectedFile.name}` : "Hình ảnh hiện tại"}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            📸 Chọn hình ảnh món ăn
                                            <br />
                                            <span className="text-xs text-gray-500">Định dạng: JPG, PNG (Tối đa 5MB)</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📄 Mô tả món</label>
                                <textarea
                                    placeholder="Mô tả về hương vị, nguyên liệu, cách chế biến..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 h-20 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.description}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewFood({ ...newFood, description: e.target.value })}
                                ></textarea>
                            </div>

                            {/* Trạng thái */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📊 Trạng thái *</label>
                                <select
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.status}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewFood({ ...newFood, status: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn trạng thái --</option>
                                    <option value="AVAILABLE">✅ Còn hàng</option>
                                    <option value="OUT_OF_STOCK">❌ Hết hàng</option>
                                    <option value="HIDDEN">👁️ Ẩn</option>
                                </select>
                            </div>

                            {/* Ghi chú mặc định */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📋 Ghi chú mặc định</label>
                                <input
                                    type="text"
                                    placeholder="Ít đường, Nhiều đá, Không đá, Ít sữa... (phân cách bởi dấu phẩy)"
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-amber-600 text-gray-800 font-medium"
                                    value={newFood.notes}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewFood({ ...newFood, notes: e.target.value })}
                                />
                                <span className="text-xs text-gray-700">Ví dụ: Ít đường, Nhiều đá, Không đá, Thêm sữa</span>
                            </div>

                            {/* Topping */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">🧊 Topping có thể đi kèm</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const dropdown = document.getElementById("toppingDropdown");
                                            dropdown?.classList.toggle("hidden");
                                        }}
                                        className="w-full border-2 border-gray-200 rounded-lg p-3 text-left flex justify-between items-center text-gray-800 font-medium"
                                    >
                                        <span>
                                            {newFood.selectedToppings.length > 0
                                                ? `Đã chọn ${newFood.selectedToppings.length} topping`
                                                : "Chọn topping..."}
                                        </span>
                                        <span>▼</span>
                                    </button>

                                    <div
                                        id="toppingDropdown"
                                        className="absolute z-10 w-full bg-white border-2 border-gray-200 border-t-0 rounded-b-lg max-h-48 overflow-y-auto hidden"
                                    >
                                        {toppings?.map((topping: Topping) => (
                                            <div
                                                key={topping.id}
                                                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                                                onClick={() => toggleTopping(topping.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={newFood.selectedToppings.includes(topping.id)}
                                                    onChange={() => {}}
                                                    className="mr-2"
                                                />
                                                <label className="cursor-pointer">
                                                    {topping.name} (+{formatPrice(topping.price)})
                                                </label>
                                            </div>
                                        ))}

                                        {toppingsError && (
                                            <div className="p-3 text-red-500 text-center text-sm">Lỗi tải topping. Vui lòng thử lại.</div>
                                        )}

                                        {toppings?.length === 0 && (
                                            <div className="p-3 text-gray-500 text-center text-sm">
                                                Chưa có topping nào. Vui lòng thêm trong phần quản lý topping.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {newFood.selectedToppings.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {newFood.selectedToppings.map((toppingId: number) => {
                                            const topping = toppings?.find((t: Topping) => t.id === toppingId);
                                            return (
                                                topping && (
                                                    <div
                                                        key={toppingId}
                                                        className="bg-amber-600 text-white px-2 py-1 rounded-full text-xs flex items-center"
                                                    >
                                                        {topping.name}
                                                        <button
                                                            type="button"
                                                            className="ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20"
                                                            onClick={() => removeTopping(toppingId)}
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                )
                                            );
                                        })}
                                    </div>
                                )}
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
                                    💾 {isEditMode ? "Cập nhật" : "Lưu món"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Message */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {toastMessage}
                </div>
            )}
        </AdminLayout>
    );
}
