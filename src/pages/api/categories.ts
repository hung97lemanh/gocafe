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
        default:
            res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
            return res.status(405).end(`Method ${method} Not Allowed`);
    }
}

// GET - Fetch all categories or a single category by ID
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;

        if (id) {
            // Get a single category
            const category = await prisma.category.findUnique({
                where: {
                    id: Number(id)
                },
                include: {
                    foods: true // Include related foods
                }
            });

            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            return res.status(200).json(category);
        } else {
            // Get all categories
            const categories = await prisma.category.findMany({
                include: {
                    foods: {
                        select: {
                            id: true
                        }
                    }
                }
            });

            // Format response to include food count
            const formattedCategories = categories.map((category) => ({
                ...category,
                foodCount: category.foods.length,
                foods: undefined // Remove the foods array
            }));

            return res.status(200).json(formattedCategories);
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ message: "Error fetching categories", error });
    }
}

// POST - Create a new category
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const newCategory = await prisma.category.create({
            data: { name }
        });

        return res.status(201).json(newCategory);
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({ message: "Error creating category", error });
    }
}

// PUT - Update an existing category
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;
        const { name } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Category ID is required" });
        }

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: Number(id)
            }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Update the category
        const updatedCategory = await prisma.category.update({
            where: {
                id: Number(id)
            },
            data: { name }
        });

        return res.status(200).json(updatedCategory);
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({ message: "Error updating category", error });
    }
}

// DELETE - Remove a category
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: "Category ID is required" });
        }

        // Check if category exists
        const existingCategory = await prisma.category.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                foods: true
            }
        });

        if (!existingCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Check if category has associated foods
        if (existingCategory.foods.length > 0) {
            return res.status(400).json({
                message: "Cannot delete category with associated foods. Please remove foods from this category first."
            });
        }

        // Delete the category
        await prisma.category.delete({
            where: {
                id: Number(id)
            }
        });

        return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({ message: "Error deleting category", error });
    }
}

// Sample data for categories
const sampleCategories = [
    {
        name: "Cà phê",
        items: [
            { name: "Espresso", price: "35.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Espresso" },
            { name: "Americano", price: "40.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Americano" },
            { name: "Latte", price: "50.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Latte" },
            { name: "Cappuccino", price: "50.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Cappuccino" },
            { name: "Cà phê sữa đá", price: "45.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Ca+Phe+Sua" }
        ]
    },
    {
        name: "Trà",
        items: [
            { name: "Trà Đào Cam Sả", price: "55.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Tra+Dao" },
            { name: "Trà Vải Nhiệt Đới", price: "50.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Tra+Vai" },
            { name: "Trà Atiso", price: "45.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Tra+Atiso" }
        ]
    },
    {
        name: "Bánh ngọt",
        items: [
            { name: "Tiramisu", price: "65.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Tiramisu" },
            { name: "Bánh Mousse Chanh Leo", price: "60.000 VNĐ", image: "https://placehold.co/150x150/A0522D/F5DEB3?text=Mousse" },
            { name: "Red Velvet", price: "60.000 VNĐ", image: "https://placehold.co/150x150/8B4513/F5DEB3?text=Red+Velvet" }
        ]
    },
    {
        name: "Đồ uống lạnh khác",
        items: [
            { name: "Soda Việt Quất", price: "55.000 VNĐ", image: "https://placehold.co/150x150/D2B48C/6F4E37?text=Soda" },
            { name: "Nước Ép Cam Tươi", price: "45.000 VNĐ", image: "https://placehold.co/150x150/6F4E37/F5DEB3?text=Nuoc+Ep+Cam" }
        ]
    }
];
