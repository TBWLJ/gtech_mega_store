import swaggerJSDoc from "swagger-jsdoc";

const swaggerConfig = {
  openapi: "3.0.0",
  info: {
    title: "GTECH Mega Store API",
    version: "1.0.0",
    description: "Comprehensive backend API documentation for GTECH Mega Store",
  },
  servers: [
    {
      url: "https://gtech-mega-store.onrender.com/api",
      description: "Production Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT Authorization header using the Bearer scheme",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const swaggerOptions = {
  definition: swaggerConfig,
  apis: ["./routes/**/*.js"], // Scan all route files (nested supported)
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
