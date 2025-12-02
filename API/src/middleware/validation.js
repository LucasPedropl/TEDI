const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      });
    }

    next();
  };
};

module.exports = {
  validateRequiredFields
};