import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { PrismaClient, Food, Category, Topping, Table, Order, OrderItem } from "@prisma/client";

interface CartItem {
    food: Food;
    quantity: number;
    note?: string;
    toppings: Topping[];
}

interface FoodWithToppings extends Food {
    toppings?: Topping[];
}

// Get server side props to fetch the table and menu data
export async function getServerSideProps(context: any) {
    const { id } = context.params;
    const prisma = new PrismaClient();

    try {
        // Get table info
        const table = await prisma.table.findUnique({
            where: { id: Number(id) }
        });

        if (!table) {
            // For debugging, log that the table wasn't found
            console.log(`Table with ID ${id} not found`);

            // Create a default table object for testing purposes
            // This helps bypass the 404 error during development
            return {
                props: {
                    table: {
                        id: Number(id),
                        name: `Bàn ${id}`,
                        qrCodeUrl: "",
                        status: "FREE",
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    categories: [],
                    toppings: []
                }
            };
        }

        // Get categories with their foods
        const categories = await prisma.category.findMany({
            include: {
                foods: {
                    where: { status: "AVAILABLE", isDeleted: false },
                    orderBy: { name: "asc" }
                }
            }
        });

        // Add more debug information
        console.log(`Found ${categories.length} categories`);
        categories.forEach((cat) => {
            console.log(`Category ${cat.name} has ${cat.foods.length} foods`);
        });

        // Get all toppings
        const toppings = await prisma.topping.findMany({
            orderBy: { name: "asc" }
        });

        return {
            props: {
                table: JSON.parse(JSON.stringify(table)),
                categories: JSON.parse(JSON.stringify(categories)),
                toppings: JSON.parse(JSON.stringify(toppings))
            }
        };
    } catch (error: any) {
        console.error("Error fetching data:", error);
        return {
            props: {
                error: `Failed to load data: ${error.message}`,
                table: null,
                categories: [],
                toppings: []
            }
        };
    } finally {
        await prisma.$disconnect();
    }
}

interface TableOrderPageProps {
    table: Table;
    categories: (Category & { foods: Food[] })[];
    toppings: Topping[];
    error?: string;
}

export default function TableOrderPage({ table, categories, toppings, error }: TableOrderPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");

    // Improved debugging for categories
    useEffect(() => {
        console.log("Categories received:", categories);
        if (!categories || categories.length === 0) {
            console.log("No categories found. Please check your database or data fetching logic");
        } else {
            console.log(`Found ${categories.length} categories`);
            categories.forEach((cat: any) => {
                console.log(`Category ${cat.name} has ${cat.foods?.length || 0} foods`);
            });
        }
    }, [categories]);

    // Handle search with improved null checking
    const filteredCategories = categories
        ? categories
              .map((category: any) => ({
                  ...category,
                  foods:
                      category.foods?.filter((food: any) => {
                          const matchesSearch = food && food.name && food.name.toLowerCase().includes(searchTerm.toLowerCase());
                          return matchesSearch;
                      }) || []
              }))
              .filter((category: any) => {
                  const hasMatchingFoods = category.foods && category.foods.length > 0;
                  const matchesCategory = categoryFilter === "all" || category.id.toString() === categoryFilter;
                  return hasMatchingFoods && matchesCategory;
              })
        : [];

    // Add item to cart
    const addToCart = (food: Food) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.food.id === food.id);
            if (existingItem) {
                return prevCart.map((item) => (item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item));
            } else {
                return [...prevCart, { food, quantity: 1, toppings: [] }];
            }
        });
    };

    // Remove item from cart
    const removeFromCart = (foodId: number) => {
        setCart((prevCart) => prevCart.filter((item) => item.food.id !== foodId));
    };

    // Calculate total
    const calculateTotal = () => {
        return cart.reduce((total, item) => {
            const foodPrice = item.food.price * item.quantity;
            const toppingsPrice = item.toppings?.reduce((sum, topping) => sum + topping.price, 0) || 0;
            return total + foodPrice + toppingsPrice * item.quantity;
        }, 0);
    };

    // Send order
    const sendOrder = async () => {
        if (cart.length === 0) return;

        try {
            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tableId: table.id,
                    items: cart.map((item) => ({
                        foodId: item.food.id,
                        quantity: item.quantity,
                        note: item.note,
                        toppings: item.toppings.map((t) => t.id)
                    })),
                    paymentMethod
                })
            });

            if (response.ok) {
                alert("Đơn hàng đã được gửi thành công!");
                setCart([]);
                setShowCart(false);
            } else {
                alert("Có lỗi xảy ra khi gửi đơn hàng!");
            }
        } catch (error) {
            console.error("Error sending order:", error);
            alert("Có lỗi xảy ra khi gửi đơn hàng!");
        }
    };

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    // State for managing the selected food when adding to cart
    const [selectedFood, setSelectedFood] = useState<FoodWithToppings | null>(null);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
    const [foodNote, setFoodNote] = useState("");

    // Handle adding to cart with toppings and notes
    const handleAddToCartWithOptions = (food: Food) => {
        setSelectedFood(food);
        setSelectedToppings([]);
        setFoodNote("");
        setShowFoodModal(true);
    };

    // Handle confirming addition to cart with selected toppings
    const confirmAddToCart = () => {
        if (selectedFood) {
            setCart((prevCart) => {
                const existingItem = prevCart.find(
                    (item) => item.food.id === selectedFood.id && JSON.stringify(item.toppings) === JSON.stringify(selectedToppings)
                );

                if (existingItem) {
                    return prevCart.map((item) =>
                        item.food.id === selectedFood.id && JSON.stringify(item.toppings) === JSON.stringify(selectedToppings)
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    return [
                        ...prevCart,
                        {
                            food: selectedFood,
                            quantity: 1,
                            toppings: selectedToppings,
                            note: foodNote
                        }
                    ];
                }
            });
            setShowFoodModal(false);
        }
    };

    // Toggle topping selection
    const toggleTopping = (topping: Topping) => {
        setSelectedToppings((prev) => {
            const exists = prev.find((t) => t.id === topping.id);
            if (exists) {
                return prev.filter((t) => t.id !== topping.id);
            } else {
                return [...prev, topping];
            }
        });
    };

    return (
        <div className="container mx-auto pb-20 max-w-2xl bg-white text-gray-800">
            <h1 className="text-center text-2xl font-bold my-5 text-amber-700">☕ Go Cafe</h1>

            {/* Header */}
            <div className="bg-gradient-to-rp-4 flex justify-between items-center mb-4">
                <div className="flex items-center justify-between w-full">
                    <Image src="/image/fish.png" alt="Fish" width={0} height={20} className="p-1" />
                    <Image src="/image/logo-1.png" alt="Logo" width={100} height={100} className="p-1" />
                    <Image src="/image/fish.png" alt="Fish" width={0} height={20} className="p-1" />
                </div>
            </div>

            {/* Table info */}
            <div className="flex justify-center items-center mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-bold text-amber-700">🪑 Bàn: {table.name}</span>
            </div>

            {/* Search bar */}
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    placeholder="🔍 Tìm kiếm món..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="p-3 border border-gray-300 rounded-lg" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="all">Tất cả</option>
                    {categories?.map((category: any) => (
                        <option key={category.id} value={category.id.toString()}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Menu list */}
            <div className="mt-4">
                {filteredCategories?.map((category: any) => (
                    <div key={category.id} className="mb-6">
                        <h2 className="text-lg font-bold mb-2 text-amber-700">{category.name}</h2>
                        <div className="space-y-4">
                            {category.foods.map((food: any) => (
                                <div key={food.id} className="flex items-center border-b border-gray-100 p-4 hover:bg-amber-50 rounded-lg transition">
                                    {food.imageUrl && (
                                        <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                            <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <div className="font-bold text-base">{food.name}</div>
                                        <div className="text-amber-700 font-bold mt-1">{food.price.toLocaleString()}đ</div>
                                        {food.description && <div className="text-gray-600 text-sm mt-1">{food.description}</div>}
                                    </div>
                                    <button
                                        className="bg-amber-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-amber-700 hover:text-white transition"
                                        onClick={() => handleAddToCartWithOptions(food)}
                                    >
                                        Chọn
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 flex justify-between items-center shadow-lg">
                <button className="bg-amber-700 text-white px-6 py-3 rounded-lg font-bold flex-1 mr-2" onClick={() => setShowCart(true)}>
                    🛒 Giỏ hàng {cart.length > 0 && `(${cart.length})`}
                </button>
                {/* <button
                    className="bg-amber-700 text-white px-6 py-3 rounded-lg font-bold flex-1 ml-2"
                    onClick={() => cart.length > 0 && setShowCart(true)}
                >
                    💳 Thanh toán
                </button> */}
            </div>

            {/* Cart popup */}
            {showCart && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-end z-50">
                    <div
                        className="bg-white rounded-t-xl w-full max-w-2xl h-[80vh] overflow-y-auto p-6 transition-transform duration-300 transform translate-y-0"
                        style={{ animation: "slideUp 0.3s ease-out" }}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">🛒 Giỏ hàng của bạn</h2>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowCart(false)}>
                                ✕
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Giỏ hàng trống. Vui lòng chọn món!</div>
                        ) : (
                            <>
                                <div className="space-y-3 mb-6">
                                    {cart.map((item, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                                            <div>
                                                <span className="font-medium">{item.food.name}</span>
                                                <div className="flex items-center mt-1">
                                                    <button
                                                        className="w-8 h-8 bg-gray-200 rounded-full"
                                                        onClick={() => {
                                                            if (item.quantity > 1) {
                                                                setCart(
                                                                    cart.map((cartItem, i) =>
                                                                        i === index ? { ...cartItem, quantity: cartItem.quantity - 1 } : cartItem
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="mx-3 text-amber-700 font-bold">x{item.quantity}</span>
                                                    <button
                                                        className="w-8 h-8 bg-gray-200 rounded-full"
                                                        onClick={() => {
                                                            setCart(
                                                                cart.map((cartItem, i) =>
                                                                    i === index ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                                                                )
                                                            );
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                {item.toppings && item.toppings.length > 0 && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        Topping: {item.toppings.map((t) => t.name).join(", ")}
                                                        <div className="text-amber-600 font-medium">
                                                            + {item.toppings.reduce((sum, t) => sum + t.price, 0).toLocaleString()}đ
                                                        </div>
                                                    </div>
                                                )}
                                                {item.note && <div className="text-sm text-gray-600 mt-1">Ghi chú: {item.note}</div>}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="font-bold mr-4">
                                                    {(
                                                        (item.food.price + (item.toppings?.reduce((sum, t) => sum + t.price, 0) || 0)) *
                                                        item.quantity
                                                    ).toLocaleString()}
                                                    đ
                                                </span>
                                                <button
                                                    className="bg-red-100 text-red-700 p-2 rounded-lg"
                                                    onClick={() => removeFromCart(item.food.id)}
                                                >
                                                    ❌
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="text-right font-bold text-xl mb-4 p-4 bg-amber-50 rounded-lg text-amber-700">
                                    💰 Tổng tiền: {calculateTotal().toLocaleString()}đ
                                </div>

                                <div className="mb-6">
                                    <div className="mb-2 font-medium">Phương thức thanh toán:</div>
                                    <div className="space-x-6">
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                className="form-radio text-amber-700"
                                                name="payment"
                                                checked={paymentMethod === "CASH"}
                                                onChange={() => setPaymentMethod("CASH")}
                                            />
                                            <span className="ml-2">💵 Tiền mặt</span>
                                        </label>
                                        <label className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                className="form-radio text-amber-700"
                                                name="payment"
                                                checked={paymentMethod === "TRANSFER"}
                                                onChange={() => setPaymentMethod("TRANSFER")}
                                            />
                                            <span className="ml-2">🏦 Chuyển khoản</span>
                                        </label>
                                    </div>
                                </div>

                                <button className="w-full bg-amber-700 text-white py-3 rounded-lg font-bold text-lg" onClick={sendOrder}>
                                    📤 Gửi đơn
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Food Selection Modal */}
            {showFoodModal && selectedFood && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 m-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{selectedFood.name}</h2>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowFoodModal(false)}>
                                ✕
                            </button>
                        </div>

                        {selectedFood.imageUrl && (
                            <div className="w-full h-48 relative rounded-lg overflow-hidden shadow-md mb-4">
                                <img src={selectedFood.imageUrl} alt={selectedFood.name} className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="text-amber-700 font-bold text-lg mb-2">{selectedFood.price.toLocaleString()}đ</div>

                        {selectedFood.description && <div className="text-gray-600 mb-4">{selectedFood.description}</div>}

                        {/* Toppings selection */}
                        {toppings && toppings.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-bold mb-2">Thêm Topping:</h3>
                                <div className="space-y-2">
                                    {toppings.map((topping) => (
                                        <div key={topping.id} className="flex items-center justify-between border-b pb-2">
                                            <label className="flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="form-checkbox text-amber-700 mr-2"
                                                    checked={selectedToppings.some((t) => t.id === topping.id)}
                                                    onChange={() => toggleTopping(topping)}
                                                />
                                                <span>{topping.name}</span>
                                            </label>
                                            <span className="text-amber-700 font-medium">+{topping.price.toLocaleString()}đ</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Note textarea */}
                        <div className="mb-4">
                            <h3 className="font-bold mb-2">Ghi chú:</h3>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="Ghi chú cho món ăn này..."
                                rows={3}
                                value={foodNote}
                                onChange={(e) => setFoodNote(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Total calculation */}
                        <div className="text-right font-bold text-lg mb-4">
                            Tổng: {(selectedFood.price + selectedToppings.reduce((sum, t) => sum + t.price, 0)).toLocaleString()}đ
                        </div>

                        {/* Add to cart button */}
                        <button className="w-full bg-amber-700 text-white py-3 rounded-lg font-bold" onClick={confirmAddToCart}>
                            Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
