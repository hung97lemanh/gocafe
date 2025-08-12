"use client";

import React, { useEffect, useState } from "react";
import { GetStaticProps } from "next";
import { createSwaggerSpec } from "next-swagger-doc";
import swaggerConfig from "../swagger.config";
import Head from "next/head";

export const getStaticProps: GetStaticProps = async () => {
    const spec = createSwaggerSpec(swaggerConfig);
    return {
        props: {
            spec
        }
    };
};

interface ApiDocsProps {
    spec: Record<string, any>;
}

const ApiDocs: React.FC<ApiDocsProps> = ({ spec }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Only run on client-side
        if (typeof window === "undefined") return;

        // Initialize Swagger UI directly using its standalone bundle
        const initSwagger = async () => {
            try {
                // Load the SwaggerUIBundle script
                const SwaggerUIBundle = await import("swagger-ui-dist/swagger-ui-bundle");

                // Clear any existing content
                const container = document.getElementById("swagger-ui");
                if (container) {
                    container.innerHTML = "";

                    // Initialize Swagger UI
                    SwaggerUIBundle.default({
                        spec: spec,
                        dom_id: "#swagger-ui",
                        deepLinking: true,
                        presets: [SwaggerUIBundle.default.presets.apis, SwaggerUIBundle.default.SwaggerUIStandalonePreset],
                        layout: "BaseLayout",
                        supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
                        onComplete: () => {
                            setIsLoaded(true);
                        }
                    });
                }
            } catch (error) {
                console.error("Failed to load Swagger UI:", error);
            }
        };

        initSwagger();

        // Cleanup function
        return () => {
            const container = document.getElementById("swagger-ui");
            if (container) {
                container.innerHTML = "";
            }
        };
    }, [spec]);

    return (
        <>
            <Head>
                <title>API Documentation</title>
                <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
            </Head>
            <div
                style={{
                    height: "100vh",
                    width: "100%",
                    overflow: "auto",
                    padding: "20px"
                }}
            >
                {!isLoaded && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "90vh"
                        }}
                    >
                        <p>Loading API documentation...</p>
                    </div>
                )}
                <div id="swagger-ui"></div>
            </div>
        </>
    );
};

export default ApiDocs;
