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
    schemas: {
      User: {
        type: "object",
        required: ["name", "email", "hashedPassword"],
        properties: {
          _id: { type: "string", example: "64fbb12345abcde123456789" },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", example: "john@example.com" },
          role: { type: "string", enum: ["customer", "admin"], example: "customer" },
          status: { type: "string", enum: ["active", "inactive"], example: "active" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Product: {
        type: "object",
        required: ["name", "category", "description", "price"],
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          description: { type: "string" },
          price: { type: "number", example: 99.99 },
          discount_price: { type: "number", example: 79.99 },
          specifications: { type: "object" },
          images: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                public_id: { type: "string" },
                resource_type: { type: "string", enum: ["image", "video"] },
              },
            },
          },
          inStock: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Review: {
        type: "object",
        required: ["product", "user", "rating"],
        properties: {
          _id: { type: "string" },
          product: { type: "string" },
          user: { type: "string" },
          rating: { type: "number", minimum: 1, maximum: 5 },
          comment: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Order: {
        type: "object",
        required: ["user", "products", "totalAmount"],
        properties: {
          _id: { type: "string" },
          user: { type: "string" },
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" },
              },
            },
          },
          totalAmount: { type: "number" },
          paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "cancelled"] },
          deliveryStatus: { type: "string", enum: ["pending", "shipped", "delivered", "cancelled"] },
          shippingAddress: {
            type: "object",
            properties: {
              address: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postalCode: { type: "string" },
              country: { type: "string" },
            },
          },
          paidAt: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
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
