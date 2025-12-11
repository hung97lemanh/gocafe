import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case "GET":
            return handleGet(req, res);
        case "POST":
            return handlePost(req, res);
        case "PUT":
            return handlePut(req, res);
        case "DELETE":
            return handleDelete(req, res);
        case "OPTIONS":
            return res.status(200).end();
        default:
            res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}

// GET - Fetch all toppings or a single topping by ID
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;

        if (id) {
            // Get a single topping
            const topping = await prisma.topping.findUnique({
                where: {
                    id: Number(id)
                }
            });

            if (!topping) {
                return res.status(404).json({ message: "Topping not found" });
            }

            return res.status(200).json(topping);
        } else {
            // Get all toppings
            const toppings = await prisma.topping.findMany();
            return res.status(200).json(toppings);
        }
    } catch (error) {
        console.error("Error fetching toppings:", error);
        return res.status(500).json({ message: "Error fetching toppings", error });
    }
}

// POST - Create a new topping
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { name, price } = req.body;

        if (!name || price === undefined) {
            return res.status(400).json({ message: "Name and price are required" });
        }

        const newTopping = await prisma.topping.create({
            data: {
                name,
                price: Number(price)
            }
        });

        return res.status(201).json(newTopping);
    } catch (error) {
        console.error("Error creating topping:", error);
        return res.status(500).json({ message: "Error creating topping", error });
    }
}

// PUT - Update an existing topping
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;
        const { name, price } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Topping ID is required" });
        }

        // Check if topping exists
        const existingTopping = await prisma.topping.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!existingTopping) {
            return res.status(404).json({ message: "Topping not found" });
        }

        // Update the topping
        const updatedTopping = await prisma.topping.update({
            where: {
                id: Number(id)
            },
            data: {
                ...(name && { name }),
                ...(price !== undefined && { price: Number(price) })
            }
        });

        return res.status(200).json(updatedTopping);
    } catch (error) {
        console.error("Error updating topping:", error);
        return res.status(500).json({ message: "Error updating topping", error });
    }
}

// DELETE - Remove a topping
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Topping ID is required" });
        }

        // Check if topping exists
        const existingTopping = await prisma.topping.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!existingTopping) {
            return res.status(404).json({ message: "Topping not found" });
        }

        // Delete the topping
        await prisma.topping.delete({
            where: {
                id: Number(id)
            }
        });

        return res.status(200).json({ message: "Topping deleted successfully" });
    } catch (error) {
        console.error("Error deleting topping:", error);
        return res.status(500).json({ message: "Error deleting topping", error });
    }
}
