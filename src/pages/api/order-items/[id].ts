import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, OrderItemStatus, OrderStatus } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "PATCH") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { id } = req.query;
        const { status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Validate the status
        if (!Object.values(OrderItemStatus).includes(status as OrderItemStatus)) {
            return res.status(400).json({ message: "Invalid item status" });
        }

        // Update the order item
        const orderItem = await prisma.orderItem.update({
            where: { id: Number(id) },
            data: { status: status as OrderItemStatus },
            include: {
                order: true
            }
        });

        // Check if all items in this order are done
        if (status === "DONE") {
            const allOrderItems = await prisma.orderItem.findMany({
                where: { orderId: orderItem.orderId }
            });

            const allItemsDone = allOrderItems.every((item) => item.status === "DONE" || item.status === "CANCELLED");

            // If all items are done, update the order status to READY
            if (allItemsDone) {
                await prisma.order.update({
                    where: { id: orderItem.orderId },
                    data: { status: "READY" }
                });
            } else {
                // Otherwise, set to IN_PROGRESS if at least one item is DONE
                const anyItemDone = allOrderItems.some((item) => item.status === "DONE");
                if (anyItemDone && orderItem.order.status === "PENDING") {
                    await prisma.order.update({
                        where: { id: orderItem.orderId },
                        data: { status: "IN_PROGRESS" }
                    });
                }
            }
        }

        return res.status(200).json({ orderItem });
    } catch (error: any) {
        console.error("Error updating order item:", error);
        return res.status(500).json({ message: "Error updating order item", error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}
