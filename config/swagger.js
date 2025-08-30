const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CRM Project API",
      version: "1.0.0",
      description: "API documentation for CRM Project",
    },
    servers: [
      {
        url: "http://localhost:8080", // change in production
      },
    ],
  },
  apis: ["./routes/**/*.js"], // yaha apne routes ka path dalna
};

const swaggerSpec = swaggerJsDoc(options);

function swaggerDocs(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = swaggerDocs;
