import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, OrderStatus, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        switch (req.method) {
            case "GET":
                return await getOrders(req, res);
            case "POST":
                return await createOrder(req, res);
            case "PATCH":
                return await updateOrderStatus(req, res);
            default:
                return res.status(405).json({ message: "Method not allowed" });
        }
    } catch (error: any) {
        console.error("Error in orders API:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}

async function getOrders(req: NextApiRequest, res: NextApiResponse) {
    const { status } = req.query;

    // Build filter conditions
    const where: any = {};

    // Filter by status if provided
    if (status && status !== "all") {
        where.status = status as OrderStatus;
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            table: true,
            customer: true,
            orderItems: {
                include: {
                    food: true,
                    toppings: {
                        include: {
                            topping: true
                        }
                    }
                }
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    // Format data for frontend
    const formattedOrders = orders.map((order) => {
        return {
            id: `#DH${order.id.toString().padStart(5, "0")}`,
            rawId: order.id,
            table: order.table.name,
            customer: order.customer?.name || "Khách lẻ",
            status: order.status.toLowerCase(),
            statusText: getStatusText(order.status),
            items: order.orderItems.map((item) => {
                const toppingText = item.toppings.length > 0 ? ` (${item.toppings.map((t) => t.topping.name).join(", ")})` : "";
                const noteText = item.note ? ` (${item.note})` : "";
                return {
                    id: item.id,
                    name: `${item.food.name} x${item.quantity}${toppingText}${noteText}`,
                    status: item.status
                };
            }),
            total: `${order.totalAmount.toLocaleString()}đ`,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod ? (order.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản") : undefined,
            createdAt: order.createdAt
        };
    });

    return res.status(200).json(formattedOrders);
}

async function createOrder(req: NextApiRequest, res: NextApiResponse) {
    const { tableId, items, paymentMethod } = req.body;

    if (!tableId || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
        const food = await prisma.food.findUnique({
            where: { id: item.foodId }
        });

        if (!food) continue;

        totalAmount += food.price * item.quantity;

        // Add topping prices if any
        if (item.toppings && item.toppings.length > 0) {
            const toppings = await prisma.topping.findMany({
                where: { id: { in: item.toppings } }
            });

            for (const topping of toppings) {
                totalAmount += topping.price * item.quantity;
            }
        }
    }

    // Create the order
    const order = await prisma.order.create({
        data: {
            tableId,
            totalAmount,
            paymentMethod,
            status: "PENDING",
            orderItems: {
                create: items.map((item: any) => ({
                    foodId: item.foodId,
                    quantity: item.quantity,
                    note: item.note || null,
                    status: "PENDING",
                    toppings: {
                        create:
                            item.toppings?.map((toppingId: number) => ({
                                topping: { connect: { id: toppingId } }
                            })) || []
                    }
                }))
            }
        },
        include: {
            orderItems: {
                include: {
                    toppings: true
                }
            }
        }
    });

    // Update table status to OCCUPIED
    await prisma.table.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" }
    });

    return res.status(200).json({ order });
}

async function updateOrderStatus(req: NextApiRequest, res: NextApiResponse) {
    const { orderId, status, paymentMethod } = req.body;

    if (!orderId || !status) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate the status
    if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return res.status(400).json({ message: "Invalid order status" });
    }

    const data: any = { status: status as OrderStatus };

    // Add payment method if provided
    if (paymentMethod) {
        if (!Object.values(PaymentMethod).includes(paymentMethod as PaymentMethod)) {
            return res.status(400).json({ message: "Invalid payment method" });
        }
        data.paymentMethod = paymentMethod;
    }

    // Update the order
    const order = await prisma.order.update({
        where: { id: Number(orderId) },
        data,
        include: {
            table: true,
            orderItems: true
        }
    });

    // If order is marked as PAID or CANCELLED, update table status
    if (status === "PAID" || status === "CANCELLED") {
        await prisma.table.update({
            where: { id: order.tableId },
            data: { status: "FREE" }
        });
    }

    return res.status(200).json({ order });
}

// Helper function to get status text in Vietnamese
function getStatusText(status: OrderStatus): string {
    switch (status) {
        case "PENDING":
            return "Chờ pha chế";
        case "IN_PROGRESS":
            return "Đang pha chế";
        case "READY":
            return "Đã pha xong";
        case "SERVED":
            return "Đã phục vụ";
        case "PAID":
            return "Đã thanh toán";
        case "CANCELLED":
            return "Đã hủy";
        default:
            return "Không xác định";
    }
}
