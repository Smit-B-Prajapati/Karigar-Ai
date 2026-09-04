/**
 * Controller for application health check endpoint.
 * GET /api/health
 */
export const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "KarigarAI API is running"
  });
};
