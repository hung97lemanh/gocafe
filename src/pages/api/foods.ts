import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, FoodStatus } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { NextApiRequestWithFile } from "../../types/api";

// Setup multer for file upload
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            // Sử dụng UPLOAD_DIR từ environment variable
            const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public/image/food");

            // Create directory if it doesn't exist
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            // Generate unique filename with timestamp
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.") as any);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Convert multer middleware to promise and handle NextApiRequest
const multerUpload = (req: NextApiRequestWithFile, res: NextApiResponse) => {
    return new Promise<void>((resolve, reject) => {
        upload.single("image")(req as any, res as any, (error: any) => {
            if (error) return reject(error);
            resolve();
        });
    });
};

const prisma = new PrismaClient();

// API route handler must be configured to accept file uploads
export const config = {
    api: {
        bodyParser: false // Disable built-in bodyParser to use multer
    }
};

export default async function handler(req: NextApiRequestWithFile, res: NextApiResponse) {
    try {
        // Process file upload for POST and PUT requests
        if (req.method === "POST" || req.method === "PUT") {
            try {
                await multerUpload(req, res);
            } catch (error: any) {
                return res.status(400).json({ message: error.message });
            }
        }

        switch (req.method) {
            case "GET":
                return await getFoods(req, res);
            case "POST":
                return await createFood(req, res);
            case "PUT":
                return await updateFood(req, res);
            case "DELETE":
                return await deleteFood(req, res);
            default:
                return res.status(405).json({ message: "Method not allowed" });
        }
    } catch (error: any) {
        console.error("Error processing request:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    } finally {
        await prisma.$disconnect();
    }
}

// Get all foods with their categories and toppings
async function getFoods(req: NextApiRequest, res: NextApiResponse) {
    const foods = await prisma.food.findMany({
        include: {
            category: true,
            foodToppings: {
                include: {
                    topping: true
                }
            }
        }
    });

    return res.status(200).json(foods);
}

// Create a new food with category, toppings, and image
async function createFood(req: NextApiRequestWithFile, res: NextApiResponse) {
    const { name, description, price, status, categoryId } = req.body;
    const toppingIds = req.body.toppingIds ? (Array.isArray(req.body.toppingIds) ? req.body.toppingIds : [req.body.toppingIds]) : [];

    if (!name || !price || !categoryId) {
        return res.status(400).json({ message: "Name, price, and category are required" });
    }

    const category = await prisma.category.findUnique({
        where: { id: Number(categoryId) }
    });

    if (!category) {
        return res.status(404).json({ message: "Category not found" });
    }

    // Process image file if uploaded
    let imageUrl = null;
    if (req.file) {
        // Sử dụng BASE_URL từ environment
        const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "/image/food";
        imageUrl = `${baseUrl}/${req.file.filename}`;
    }

    // Create food with toppings in a transaction
    const newFood = await prisma.$transaction(async (tx) => {
        // Create the food first
        const food = await tx.food.create({
            data: {
                name,
                description,
                price: Number(price),
                imageUrl,
                status: status || "AVAILABLE",
                categoryId: Number(categoryId)
            }
        });

        // If toppings are provided, create the relationships
        if (toppingIds && toppingIds.length > 0) {
            // Validate toppings exist
            const toppings = await tx.topping.findMany({
                where: {
                    id: {
                        in: toppingIds.map((id: any) => Number(id))
                    }
                }
            });

            if (toppings.length !== toppingIds.length) {
                throw new Error("One or more toppings not found");
            }

            // Create food-topping relationships
            await Promise.all(
                toppingIds.map((toppingId: any) =>
                    tx.foodTopping.create({
                        data: {
                            foodId: food.id,
                            toppingId: Number(toppingId)
                        }
                    })
                )
            );
        }

        // Return the food with its relationships
        return tx.food.findUnique({
            where: { id: food.id },
            include: {
                category: true,
                foodToppings: {
                    include: {
                        topping: true
                    }
                }
            }
        });
    });

    return res.status(201).json(newFood);
}

// Helper function to delete an existing image
async function deleteExistingImage(imageUrl: string | null) {
    if (!imageUrl) return;

    try {
        // Extract filename from URL
        const filename = path.basename(imageUrl);
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "public/image/food");
        const filePath = path.join(uploadDir, filename);

        // Check if file exists before attempting to delete
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Deleted old image: ${filePath}`);
        }
    } catch (error) {
        console.error("Error deleting old image:", error);
    }
}

// Update an existing food
async function updateFood(req: NextApiRequestWithFile, res: NextApiResponse) {
    const { id } = req.query;
    const { name, description, price, status, categoryId } = req.body;
    const toppingIds = req.body.toppingIds ? (Array.isArray(req.body.toppingIds) ? req.body.toppingIds : [req.body.toppingIds]) : undefined;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Valid food ID is required" });
    }

    const existingFood = await prisma.food.findUnique({
        where: { id: Number(id) }
    });

    if (!existingFood) {
        return res.status(404).json({ message: "Food not found" });
    }

    // Process image file if uploaded
    let imageUrl = existingFood.imageUrl;
    if (req.file) {
        // Delete existing image if there is one
        await deleteExistingImage(existingFood.imageUrl);

        // Create URL for the new image
        const baseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "/image/food";
        imageUrl = `${baseUrl}/${req.file.filename}`;
    }

    // Update food and its relationships in a transaction
    const updatedFood = await prisma.$transaction(async (tx) => {
        // Update food details
        const food = await tx.food.update({
            where: { id: Number(id) },
            data: {
                name,
                description,
                price: price ? Number(price) : undefined,
                imageUrl,
                status: status as FoodStatus,
                categoryId: categoryId ? Number(categoryId) : undefined
            }
        });

        // If toppingIds are provided, update the topping relationships
        if (toppingIds) {
            // Delete existing relationships
            await tx.foodTopping.deleteMany({
                where: { foodId: Number(id) }
            });

            // Create new relationships
            if (toppingIds.length > 0) {
                await Promise.all(
                    toppingIds.map((toppingId: any) =>
                        tx.foodTopping.create({
                            data: {
                                foodId: food.id,
                                toppingId: Number(toppingId)
                            }
                        })
                    )
                );
            }
        }

        // Return updated food with relationships
        return tx.food.findUnique({
            where: { id: food.id },
            include: {
                category: true,
                foodToppings: {
                    include: {
                        topping: true
                    }
                }
            }
        });
    });

    return res.status(200).json(updatedFood);
}

// Delete a food
async function deleteFood(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Valid food ID is required" });
    }

    // Get the food to access the image URL
    const food = await prisma.food.findUnique({
        where: { id: Number(id) }
    });

    if (!food) {
        return res.status(404).json({ message: "Food not found" });
    }

    // Delete in a transaction to ensure proper cleanup
    await prisma.$transaction(async (tx) => {
        // First delete related food-topping relationships
        await tx.foodTopping.deleteMany({
            where: { foodId: Number(id) }
        });

        // Then delete the food
        await tx.food.delete({
            where: { id: Number(id) }
        });
    });

    // Delete the image file if exists
    await deleteExistingImage(food.imageUrl);

    return res.status(200).json({ message: "Food deleted successfully" });
}
