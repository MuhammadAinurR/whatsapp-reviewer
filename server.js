const { app, whatsappService } = require('./src/app');

const port = process.env.PORT || 3000;

// Error handlers
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  whatsappService.initialize();
}); 