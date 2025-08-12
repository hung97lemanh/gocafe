import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import AdminLayout from "../../components/AdminLayout";

// Define the Category interface
interface Category {
    id: number;
    name: string;
    foodCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

// Define the form state interface
interface CategoryForm {
    name: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [currentCategory, setCurrentCategory] = useState<Category | null>(null);

    // Form state for adding/editing categories
    const [categoryForm, setCategoryForm] = useState<CategoryForm>({
        name: ""
    });

    // Fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Function to fetch all categories
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/categories");
            if (!response.ok) {
                throw new Error("Failed to fetch categories");
            }
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories:", error);
            alert("Không thể tải danh sách danh mục. Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form input changes
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCategoryForm({ ...categoryForm, [name]: value });
    };

    // Handle adding a new category
    const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!categoryForm.name) {
            alert("Vui lòng nhập tên danh mục");
            return;
        }

        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: categoryForm.name
                })
            });

            if (!response.ok) {
                throw new Error("Failed to add category");
            }

            // Refresh the categories list
            fetchCategories();

            // Reset form and close modal
            setCategoryForm({ name: "" });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error adding category:", error);
            alert("Không thể thêm danh mục. Vui lòng thử lại sau.");
        }
    };

    // Open edit modal with category data
    const openEditModal = (category: Category) => {
        setCurrentCategory(category);
        setCategoryForm({
            name: category.name
        });
        setIsEditModalOpen(true);
    };

    // Handle updating a category
    const handleUpdateCategory = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!currentCategory || !categoryForm.name) {
            alert("Vui lòng nhập tên danh mục");
            return;
        }

        try {
            const response = await fetch(`/api/categories?id=${currentCategory.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: categoryForm.name
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update category");
            }

            // Refresh the categories list
            fetchCategories();

            // Reset form and close modal
            setCategoryForm({ name: "" });
            setCurrentCategory(null);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Error updating category:", error);
            alert("Không thể cập nhật danh mục. Vui lòng thử lại sau.");
        }
    };

    // Handle deleting a category
    const handleDeleteCategory = async (id: number, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa danh mục "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/categories?id=${id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete category");
            }

            // Refresh the categories list
            fetchCategories();

            alert("Xóa danh mục thành công!");
        } catch (error) {
            console.error("Error deleting category:", error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert("Không thể xóa danh mục. Vui lòng thử lại sau.");
            }
        }
    };

    // Filter categories based on search term
    const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <AdminLayout>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-center bg-gradient-to-r from-green-700 to-green-500 text-white p-4 rounded-lg shadow">
                    <h1 className="text-xl font-bold">📋 Quản lý Danh mục</h1>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-medium transition"
                    >
                        + Thêm danh mục
                    </button>
                </div>

                {/* Statistics */}
                <div className="bg-white p-4 rounded-lg shadow text-center">
                    <div className="text-xl font-bold text-green-600">{categories.length}</div>
                    <div className="text-sm text-gray-500">Tổng số danh mục</div>
                </div>

                {/* Search */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="🔍 Tìm kiếm danh mục..."
                            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-800"
                            value={searchTerm}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Categories List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">Đang tải dữ liệu...</div>
                    ) : filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                            <div key={category.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-green-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-lg text-gray-800 font-semibold">{category.name}</h3>
                                        <div className="text-sm text-gray-500">{category.foodCount || 0} món ăn thuộc danh mục này</div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button
                                        className="px-3 py-1 bg-green-200 text-green-900 rounded text-xs font-medium"
                                        onClick={() => openEditModal(category)}
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium"
                                        onClick={() => handleDeleteCategory(category.id, category.name)}
                                    >
                                        🗑️ Xóa
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                            Không tìm thấy danh mục nào phù hợp với tiêu chí tìm kiếm
                        </div>
                    )}
                </div>
            </div>

            {/* Add Category Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-green-600">📋 Thêm danh mục mới</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-green-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleAddCategory}>
                            {/* Tên danh mục */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên danh mục *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Cà phê, Trà sữa, Nước ép..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-green-600 text-gray-800 font-medium"
                                    value={categoryForm.name}
                                    onChange={handleInputChange}
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
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
                                    💾 Lưu danh mục
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {isEditModalOpen && currentCategory && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center border-b pb-4 mb-4">
                            <h2 className="text-xl font-bold text-green-600">✏️ Sửa danh mục</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-green-600 text-2xl"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleUpdateCategory}>
                            {/* Tên danh mục */}
                            <div className="mb-4">
                                <label className="block font-semibold text-gray-700 mb-2">📝 Tên danh mục *</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ví dụ: Cà phê, Trà sữa, Nước ép..."
                                    className="w-full border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-green-600 text-gray-800 font-medium"
                                    value={categoryForm.name}
                                    onChange={handleInputChange}
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
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
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
