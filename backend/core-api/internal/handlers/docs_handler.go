package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/waybill-tracking/core-api/internal/openapi"
)

// DocsHandler serves an HTML page with Swagger UI pointing at the OpenAPI spec.
func DocsHandler(c *gin.Context) {
	c.Header("Content-Type", "text/html")
	c.String(http.StatusOK, swaggerUIHTML)
}

// OpenAPIHandler serves the generated OpenAPI 3 spec in JSON or YAML format.
func OpenAPIHandler(c *gin.Context) {
	if c.Request.URL.Path == "/openapi.yaml" {
		c.Header("Content-Type", "application/yaml")
		c.String(http.StatusOK, openapi.SpecYAML)
		return
	}
	c.Header("Content-Type", "application/json")
	c.String(http.StatusOK, openapi.SpecJSON)
}

const swaggerUIHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Waybill Core API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.presets.standalone_layout],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>
`
