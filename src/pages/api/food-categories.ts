import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.setHeader("Allow", ["GET"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const categories = await prisma.category.findMany({
            include: {
                foods: {
                    where: {
                        isDeleted: false
                    },
                    include: {
                        foodToppings: {
                            include: {
                                topping: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        });

        return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching food categories:", error);
        return res.status(500).json({
            message: "Error fetching food categories",
            error
        });
    } finally {
        await prisma.$disconnect();
    }
}
