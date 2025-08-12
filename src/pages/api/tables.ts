import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, TableStatus } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // GET - Fetch all tables or a specific table
    if (req.method === "GET") {
        const { id } = req.query;

        if (id) {
            // Fetch a specific table
            try {
                const table = await prisma.table.findUnique({
                    where: { id: Number(id) }
                });

                if (!table) {
                    return res.status(404).json({ error: "Table not found" });
                }

                return res.status(200).json(table);
            } catch (error) {
                console.error("Error fetching table:", error);
                return res.status(500).json({ error: "Failed to fetch table" });
            }
        } else {
            // Fetch all tables
            try {
                const tables = await prisma.table.findMany({
                    orderBy: { name: "asc" }
                });
                return res.status(200).json(tables);
            } catch (error) {
                console.error("Error fetching tables:", error);
                return res.status(500).json({ error: "Failed to fetch tables" });
            }
        }
    }

    // POST - Create a new table
    if (req.method === "POST") {
        const { name, qrCodeUrl, status } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        try {
            // Check if table with the same name already exists
            const existingTable = await prisma.table.findFirst({
                where: { name }
            });

            if (existingTable) {
                return res.status(400).json({ error: "A table with this name already exists" });
            }

            // Create new table with default QR code URL
            const newTable = await prisma.table.create({
                data: {
                    name,
                    qrCodeUrl: qrCodeUrl || `/order-table/${name.replace(/\s+/g, "-").toLowerCase()}`,
                    status: status || "FREE"
                }
            });

            return res.status(201).json(newTable);
        } catch (error) {
            console.error("Error creating table:", error);
            return res.status(500).json({ error: "Failed to create table" });
        }
    }

    // PUT - Update an existing table
    if (req.method === "PUT") {
        const { id } = req.query;
        const { name, qrCodeUrl, status } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Table ID is required" });
        }

        // Validate required fields
        if (!name) {
            return res.status(400).json({ error: "Name is required" });
        }

        try {
            // Check if table exists
            const table = await prisma.table.findUnique({
                where: { id: Number(id) }
            });

            if (!table) {
                return res.status(404).json({ error: "Table not found" });
            }

            // Check if new name conflicts with existing table
            if (name !== table.name) {
                const existingTable = await prisma.table.findFirst({
                    where: { name }
                });

                if (existingTable) {
                    return res.status(400).json({ error: "A table with this name already exists" });
                }
            }

            // Update table
            const updatedTable = await prisma.table.update({
                where: { id: Number(id) },
                data: {
                    name,
                    qrCodeUrl: qrCodeUrl || table.qrCodeUrl,
                    status: status || table.status
                }
            });

            return res.status(200).json(updatedTable);
        } catch (error) {
            console.error("Error updating table:", error);
            return res.status(500).json({ error: "Failed to update table" });
        }
    }

    // DELETE - Delete a table
    if (req.method === "DELETE") {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: "Table ID is required" });
        }

        try {
            // Check if table exists
            const table = await prisma.table.findUnique({
                where: { id: Number(id) }
            });

            if (!table) {
                return res.status(404).json({ error: "Table not found" });
            }

            // Check if table has related orders
            const ordersCount = await prisma.order.count({
                where: { tableId: Number(id) }
            });

            if (ordersCount > 0) {
                return res.status(400).json({
                    error: "Cannot delete table with existing orders. Consider changing its status instead."
                });
            }

            // Delete table
            await prisma.table.delete({
                where: { id: Number(id) }
            });

            return res.status(200).json({ message: "Table deleted successfully" });
        } catch (error) {
            console.error("Error deleting table:", error);
            return res.status(500).json({ error: "Failed to delete table" });
        }
    }

    // Method not allowed
    return res.status(405).json({ error: "Method not allowed" });
}
