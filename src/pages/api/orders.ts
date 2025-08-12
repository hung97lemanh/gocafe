import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
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
    } catch (error: any) {
        console.error("Error creating order:", error);
        return res.status(500).json({ message: "Error creating order", error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}
