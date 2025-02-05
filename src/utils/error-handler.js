/**
 * @param {Error} error 
 * @param {string} context
 * @returns {Error}
 */
const handleError = (error, context) => {
  console.error(`${context}:`, error);
  return new Error(`Error in ${context}: ${error.message}`);
};

module.exports = { handleError }; 