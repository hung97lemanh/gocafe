const swaggerConfig = {
    apiFolder: "src/pages/api",
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Cafe Management API",
            version: "1.0.0",
            description: "API documentation for Cafe Management application"
        },
        paths: {
            "/api/toppings": {
                get: {
                    summary: "Get all toppings",
                    description: "Retrieve a list of all available toppings",
                    tags: ["Toppings"],
                    responses: {
                        "200": {
                            description: "List of toppings",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "array",
                                        items: {
                                            $ref: "#/components/schemas/Topping"
                                        }
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    summary: "Create a new topping",
                    description: "Add a new topping to the database",
                    tags: ["Toppings"],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ToppingInput"
                                }
                            }
                        }
                    },
                    responses: {
                        "201": {
                            description: "Topping created successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Topping"
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Invalid input",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/toppings/{id}": {
                get: {
                    summary: "Get a specific topping",
                    description: "Retrieve a topping by its ID",
                    tags: ["Toppings"],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID of the topping to retrieve",
                            schema: {
                                type: "integer"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Topping found",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Topping"
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Topping not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                },
                put: {
                    summary: "Update a topping",
                    description: "Update an existing topping by its ID",
                    tags: ["Toppings"],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID of the topping to update",
                            schema: {
                                type: "integer"
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            "application/json": {
                                schema: {
                                    $ref: "#/components/schemas/ToppingInput"
                                }
                            }
                        }
                    },
                    responses: {
                        "200": {
                            description: "Topping updated successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Topping"
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Invalid input",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Topping not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                },
                delete: {
                    summary: "Delete a topping",
                    description: "Remove a topping from the database by its ID",
                    tags: ["Toppings"],
                    parameters: [
                        {
                            name: "id",
                            in: "path",
                            required: true,
                            description: "ID of the topping to delete",
                            schema: {
                                type: "integer"
                            }
                        }
                    ],
                    responses: {
                        "200": {
                            description: "Topping deleted successfully",
                            content: {
                                "application/json": {
                                    schema: {
                                        type: "object",
                                        properties: {
                                            message: {
                                                type: "string",
                                                example: "Topping deleted successfully"
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "400": {
                            description: "Invalid input",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "404": {
                            description: "Topping not found",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        },
                        "500": {
                            description: "Server error",
                            content: {
                                "application/json": {
                                    schema: {
                                        $ref: "#/components/schemas/Error"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        components: {
            schemas: {
                Topping: {
                    type: "object",
                    properties: {
                        id: {
                            type: "integer",
                            description: "The topping ID",
                            example: 1
                        },
                        name: {
                            type: "string",
                            description: "The name of the topping",
                            example: "Whipped Cream"
                        },
                        price: {
                            type: "number",
                            format: "float",
                            description: "The price of the topping",
                            example: 0.5
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "The date when the topping was created"
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "The date when the topping was last updated"
                        }
                    }
                },
                ToppingInput: {
                    type: "object",
                    required: ["name", "price"],
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the topping",
                            example: "Whipped Cream"
                        },
                        price: {
                            type: "number",
                            format: "float",
                            description: "The price of the topping",
                            example: 0.5
                        }
                    }
                },
                Error: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Error message",
                            example: "An error occurred"
                        },
                        error: {
                            type: "object",
                            description: "Error details"
                        }
                    }
                }
            }
        }
    }
};

export default swaggerConfig;
